import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { analyzeVoiceTask, transcribeAudio } from "./openai";
import { extractAudioFromVideo, getVideoInfo } from "./videoProcessor";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import {
  insertTaskSchema,
  insertTeamMemberSchema,
  insertNotificationSchema,
  insertVoiceHistorySchema,
  insertCalendarEventSchema,
  insertEmailInboxSchema,
  insertCommentSchema,
  insertAttachmentSchema,
  insertSubtaskSchema,
  insertTagSchema,
  insertTaskTagSchema,
  insertActivityLogSchema,
  insertTaskWatcherSchema,
  insertTaskTemplateSchema,
  insertRecurringTaskPatternSchema,
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import Stripe from "stripe";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  listCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
  getFreeBusyInfo,
} from "./integrations/googleCalendar";
import { analyzeEmailForTask, htmlToPlainText } from "./emailParser";
import { emitEvent } from "./integrations/events";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
if (!process.env.STRIPE_PRICE_ID) {
  throw new Error('Missing required Stripe secret: STRIPE_PRICE_ID');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configure multer for video uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);

  // Auth user endpoint
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ============ TASK ROUTES ============
  
  // Get all tasks for the user
  app.get("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tasks = await storage.getTasks(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  // Get a single task
  app.get("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.getTask(req.params.id);
      if (!task || task.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });

  // Create task with AI analysis from voice transcript
  app.post("/api/tasks/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Validate request body
      const requestSchema = z.object({
        transcript: z.string().min(1, "Transcript cannot be empty"),
      });
      
      const { transcript } = requestSchema.parse(req.body);

      // Get team members for AI to suggest assignee
      const teamMembers = await storage.getTeamMembers(userId);
      const teamMemberNames = teamMembers.map(tm => tm.name);

      // Analyze task with AI
      const startTime = Date.now();
      const analysis = await analyzeVoiceTask(transcript, teamMemberNames);
      const processingTime = Date.now() - startTime;

      console.log('[Voice Analysis] AI suggested assignee:', analysis.suggestedAssignee);
      console.log('[Voice Analysis] Available team members:', teamMemberNames);

      // Find suggested team member
      let suggestedTeamMember = null;
      if (analysis.suggestedAssignee) {
        suggestedTeamMember = teamMembers.find(
          tm => tm.name.toLowerCase() === analysis.suggestedAssignee?.toLowerCase()
        );
        console.log('[Voice Analysis] Matched team member:', suggestedTeamMember?.name || 'Not found');
      }

      // Create the task
      const task = await storage.createTask({
        userId: userId,
        teamMemberId: suggestedTeamMember?.id || null,
        title: analysis.title,
        description: analysis.description,
        voiceTranscript: transcript,
        impact: analysis.impact,
        urgency: analysis.urgency,
        aiAnalysis: JSON.stringify(analysis.smartObjectives),
        suggestedAssignee: analysis.suggestedAssignee,
        status: "delegated",
        progress: 0,
        dueDate: null,
      });

      // Emit event for integrations (e.g., Slack notifications)
      emitEvent('task.created', { task }, userId, storage);

      // Record voice history
      await storage.createVoiceHistory({
        userId: userId,
        taskId: task.id,
        transcript,
        processingTime,
        success: true,
      });

      // Create notification if assigned to team member
      if (suggestedTeamMember) {
        await storage.createNotification({
          userId: userId,
          taskId: task.id,
          type: "task_assigned",
          title: "New Task Assigned",
          message: `Task "${task.title}" has been assigned to ${suggestedTeamMember.name}`,
        });

        // Update team member's active task count
        await storage.updateTeamMember(suggestedTeamMember.id, {
          activeTasks: (suggestedTeamMember.activeTasks || 0) + 1,
        });
      }

      res.json({ task, analysis });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error analyzing task:", error);
      res.status(500).json({ error: "Failed to analyze task" });
    }
  });

  // Create task from video with AI transcription and analysis
  app.post("/api/tasks/analyze-video", isAuthenticated, upload.single('video'), async (req: any, res) => {
    let videoPath: string | undefined;
    let audioPath: string | undefined;

    try {
      const userId = req.user.claims.sub;
      
      if (!req.file) {
        return res.status(400).json({ error: "No video file provided" });
      }

      videoPath = req.file.path;
      console.log(`[Video Processing] Received video: ${videoPath}, size: ${req.file.size} bytes`);

      if (!videoPath) {
        throw new Error("Video path is undefined");
      }

      // Get video info
      const videoInfo = await getVideoInfo(videoPath);
      console.log(`[Video Processing] Video info:`, videoInfo);

      // Check video duration (max 10 minutes for cost control)
      if (videoInfo.duration > 600) {
        throw new Error("Video is too long. Maximum duration is 10 minutes.");
      }

      // Extract audio from video
      console.log(`[Video Processing] Extracting audio from video...`);
      const { audioPath: extractedAudioPath, cleanup } = await extractAudioFromVideo(videoPath);
      audioPath = extractedAudioPath;
      
      if (!audioPath) {
        throw new Error("Audio extraction failed - audioPath is undefined");
      }
      
      console.log(`[Video Processing] Audio extracted: ${audioPath}`);

      // Transcribe audio with Whisper
      console.log(`[Video Processing] Transcribing audio with Whisper...`);
      const startTime = Date.now();
      const transcript = await transcribeAudio(audioPath);
      const transcriptionTime = Date.now() - startTime;
      console.log(`[Video Processing] Transcription complete (${transcriptionTime}ms): ${transcript.substring(0, 100)}...`);

      if (!transcript || transcript.trim().length === 0) {
        throw new Error("No speech detected in video");
      }

      // Get team members for AI to suggest assignee
      const teamMembers = await storage.getTeamMembers(userId);
      const teamMemberNames = teamMembers.map(tm => tm.name);

      // Analyze task with AI (same as voice)
      console.log(`[Video Processing] Analyzing transcript with AI...`);
      const analysisStartTime = Date.now();
      const analysis = await analyzeVoiceTask(transcript, teamMemberNames);
      const analysisTime = Date.now() - analysisStartTime;
      const totalProcessingTime = Date.now() - startTime;

      console.log('[Video Processing] AI suggested assignee:', analysis.suggestedAssignee);

      // Find suggested team member
      let suggestedTeamMember = null;
      if (analysis.suggestedAssignee) {
        suggestedTeamMember = teamMembers.find(
          tm => tm.name.toLowerCase() === analysis.suggestedAssignee?.toLowerCase()
        );
        console.log('[Video Processing] Matched team member:', suggestedTeamMember?.name || 'Not found');
      }

      // Create the task
      const task = await storage.createTask({
        userId: userId,
        teamMemberId: suggestedTeamMember?.id || null,
        title: analysis.title,
        description: analysis.description,
        voiceTranscript: transcript,
        impact: analysis.impact,
        urgency: analysis.urgency,
        aiAnalysis: JSON.stringify(analysis.smartObjectives),
        suggestedAssignee: analysis.suggestedAssignee,
        status: "delegated",
        progress: 0,
        dueDate: null,
      });

      // Emit event for integrations (e.g., Slack notifications)
      emitEvent('task.created', { task }, userId, storage);

      // Record voice history (video is essentially voice with visuals)
      await storage.createVoiceHistory({
        userId: userId,
        taskId: task.id,
        transcript,
        processingTime: totalProcessingTime,
        success: true,
      });

      // Create notification if assigned to team member
      if (suggestedTeamMember) {
        await storage.createNotification({
          userId: userId,
          taskId: task.id,
          type: "task_assigned",
          title: "New Task Assigned (from Video)",
          message: `Task "${task.title}" has been assigned to ${suggestedTeamMember.name}`,
        });

        // Update team member's active task count
        await storage.updateTeamMember(suggestedTeamMember.id, {
          activeTasks: (suggestedTeamMember.activeTasks || 0) + 1,
        });
      }

      // Clean up video and audio files
      await cleanup();
      console.log(`[Video Processing] Cleanup complete`);

      res.json({ 
        task, 
        analysis,
        videoInfo: {
          duration: videoInfo.duration,
          size: videoInfo.size,
        },
        processingStats: {
          transcriptionTime,
          analysisTime,
          totalProcessingTime,
        }
      });
    } catch (error) {
      // Clean up files on error
      if (videoPath) {
        try {
          await fs.unlink(videoPath);
        } catch (e) {
          console.error("Error deleting video file:", e);
        }
      }
      if (audioPath) {
        try {
          await fs.unlink(audioPath);
        } catch (e) {
          console.error("Error deleting audio file:", e);
        }
      }

      console.error("Error processing video:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to process video" 
      });
    }
  });

  // Create task manually (without AI analysis)
  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        userId: userId,
      });

      const task = await storage.createTask(validatedData);

      // Emit event for integrations (e.g., Slack notifications)
      emitEvent('task.created', { task }, userId, storage);

      // Update team member's active task count if assigned
      if (task.teamMemberId) {
        const teamMember = await storage.getTeamMember(task.teamMemberId);
        if (teamMember) {
          await storage.updateTeamMember(task.teamMemberId, {
            activeTasks: (teamMember.activeTasks || 0) + 1,
          });
        }
      }

      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  // Update task
  app.patch("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.getTask(req.params.id);
      if (!task || task.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Validate update data
      const updateSchema = insertTaskSchema.partial().omit({ userId: true });
      const validatedUpdates = updateSchema.parse(req.body);
      const updates: any = validatedUpdates;
      
      // Handle team member changes
      if (updates.teamMemberId !== undefined && updates.teamMemberId !== task.teamMemberId) {
        // Decrease old assignee's count
        if (task.teamMemberId) {
          const oldMember = await storage.getTeamMember(task.teamMemberId);
          if (oldMember) {
            await storage.updateTeamMember(task.teamMemberId, {
              activeTasks: Math.max(0, (oldMember.activeTasks || 0) - 1),
            });
          }
        }
        
        // Increase new assignee's count
        if (updates.teamMemberId) {
          const newMember = await storage.getTeamMember(updates.teamMemberId);
          if (newMember) {
            await storage.updateTeamMember(updates.teamMemberId, {
              activeTasks: (newMember.activeTasks || 0) + 1,
            });
            
            // Create notification
            await storage.createNotification({
              userId: userId,
              taskId: task.id,
              type: "task_assigned",
              title: "Task Reassigned",
              message: `Task "${task.title}" has been assigned to ${newMember.name}`,
            });
          }
        }
      }

      // Handle completion
      if (updates.status === "completed" && task.status !== "completed") {
        updates.completedAt = new Date();
        updates.progress = 100;
        
        // Update team member's completion stats
        if (task.teamMemberId) {
          const teamMember = await storage.getTeamMember(task.teamMemberId);
          if (teamMember) {
            const newActiveTasks = Math.max(0, (teamMember.activeTasks || 0) - 1);
            const newCompletedTasks = (teamMember.completedTasks || 0) + 1;
            const totalTasks = newActiveTasks + newCompletedTasks;
            const newCompletionRate = totalTasks > 0 
              ? Math.round((newCompletedTasks / totalTasks) * 100)
              : 0;

            await storage.updateTeamMember(task.teamMemberId, {
              activeTasks: newActiveTasks,
              completedTasks: newCompletedTasks,
              completionRate: newCompletionRate,
            });
          }
        }

        // Create notification
        await storage.createNotification({
          userId: userId,
          taskId: task.id,
          type: "task_completed",
          title: "Task Completed",
          message: `Task "${task.title}" has been completed`,
        });
      }

      const updatedTask = await storage.updateTask(req.params.id, updates);
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  // Delete task
  app.delete("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.getTask(req.params.id);
      if (!task || task.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Update team member's active task count
      if (task.teamMemberId && task.status !== "completed") {
        const teamMember = await storage.getTeamMember(task.teamMemberId);
        if (teamMember) {
          await storage.updateTeamMember(task.teamMemberId, {
            activeTasks: Math.max(0, (teamMember.activeTasks || 0) - 1),
          });
        }
      }

      await storage.deleteTask(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Accept task - formal acceptance with timestamp for audit trail
  app.post("/api/tasks/:id/accept", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.getTask(req.params.id);
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Authorization: Only task owner can accept
      // NOTE: In current system design, team members are records without authentication.
      // The executive (task owner) formally accepts the delegation on behalf of the organization.
      // In a future implementation with team member authentication, delegates could accept directly.
      if (task.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to accept this task" });
      }

      // Check if already accepted
      if (task.acceptedAt) {
        return res.status(400).json({ error: "Task already accepted", acceptedAt: task.acceptedAt });
      }

      // Record formal acceptance with timestamp
      const updatedTask = await storage.updateTask(req.params.id, {
        acceptedAt: new Date(),
      });

      // Create notification for acceptance record
      await storage.createNotification({
        userId: userId,
        taskId: task.id,
        type: "task_assigned",
        title: "Task Accepted",
        message: `Task "${task.title}" has been formally accepted`,
      });

      res.json(updatedTask);
    } catch (error) {
      console.error("Error accepting task:", error);
      res.status(500).json({ error: "Failed to accept task" });
    }
  });

  // ============ TEAM MEMBER ROUTES ============

  // Team Member Authentication Routes

  // Send invitation to team member
  app.post("/api/team-members/invite", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestSchema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        role: z.string().min(1),
      });

      const { name, email, role } = requestSchema.parse(req.body);

      // Check if email already exists
      const existingMember = await storage.getTeamMemberByEmail(email);
      if (existingMember) {
        return res.status(400).json({ error: "Team member with this email already exists" });
      }

      // Generate secure invitation token
      const invitationToken = crypto.randomBytes(32).toString('hex');

      // Create team member with pending status
      const member = await storage.createTeamMember({
        userId,
        name,
        email,
        role,
        avatar: null,
      });

      // Update with invitation token and status
      await storage.updateTeamMember(member.id, {
        invitationToken,
        invitationStatus: 'pending',
        invitedAt: new Date(),
      });

      // TODO: Send invitation email with link containing token
      // For MVP, return the invitation link in response
      const invitationLink = `${req.protocol}://${req.hostname}/accept-invitation?token=${invitationToken}`;

      res.json({
        member,
        invitationLink,
        message: "Team member invited successfully. Share this link with them to complete registration.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error inviting team member:", error);
      res.status(500).json({ error: "Failed to invite team member" });
    }
  });

  // Accept invitation and set password
  app.post("/api/team-members/accept-invitation", async (req, res) => {
    try {
      const requestSchema = z.object({
        token: z.string().min(1),
        password: z.string().min(8, "Password must be at least 8 characters"),
      });

      const { token, password } = requestSchema.parse(req.body);

      // Find team member by invitation token
      const member = await storage.getTeamMemberByInvitationToken(token);
      if (!member) {
        return res.status(404).json({ error: "Invalid or expired invitation token" });
      }

      if (member.invitationStatus === 'accepted') {
        return res.status(400).json({ error: "Invitation already accepted" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Update team member with password and accepted status
      await storage.updateTeamMember(member.id, {
        passwordHash,
        invitationStatus: 'accepted',
        acceptedAt: new Date(),
        invitationToken: null, // Clear token after use
      });

      res.json({
        message: "Invitation accepted successfully. You can now login.",
        email: member.email,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error accepting invitation:", error);
      res.status(500).json({ error: "Failed to accept invitation" });
    }
  });

  // Team member login
  app.post("/api/team-members/login", async (req, res) => {
    try {
      const requestSchema = z.object({
        email: z.string().email(),
        password: z.string().min(1),
      });

      const { email, password } = requestSchema.parse(req.body);

      // Find team member by email
      const member = await storage.getTeamMemberByEmail(email);
      if (!member) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (member.invitationStatus !== 'accepted') {
        return res.status(401).json({ error: "Please accept your invitation first" });
      }

      if (!member.passwordHash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, member.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Update last login timestamp
      await storage.updateTeamMember(member.id, {
        lastLoginAt: new Date(),
      });

      // Store team member info in session
      (req.session as any).teamMember = {
        id: member.id,
        userId: member.userId,
        email: member.email,
        name: member.name,
        role: member.role,
        accountType: 'team_member',
      };

      res.json({
        message: "Login successful",
        teamMember: {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          accountType: 'team_member',
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error logging in team member:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Team member logout
  app.post("/api/team-members/logout", (req, res) => {
    (req.session as any).teamMember = null;
    res.json({ message: "Logged out successfully" });
  });

  // Get current team member info
  app.get("/api/team-members/me", async (req: any, res) => {
    try {
      const teamMember = (req.session as any)?.teamMember;
      if (!teamMember) {
        return res.status(401).json({ error: "Not authenticated as team member" });
      }

      // Fetch fresh team member data
      const member = await storage.getTeamMember(teamMember.id);
      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }

      // Get team member's assigned tasks
      const tasks = await storage.getTasks(member.userId);
      const assignedTasks = tasks.filter(task => task.teamMemberId === member.id);

      res.json({
        ...member,
        passwordHash: undefined, // Don't send password hash
        invitationToken: undefined, // Don't send token
        assignedTasks: assignedTasks.length,
      });
    } catch (error) {
      console.error("Error fetching team member info:", error);
      res.status(500).json({ error: "Failed to fetch team member info" });
    }
  });

  // Get all team members
  app.get("/api/team-members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const members = await storage.getTeamMembers(userId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  // Get single team member
  app.get("/api/team-members/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getTeamMember(req.params.id);
      if (!member || member.userId !== userId) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json(member);
    } catch (error) {
      console.error("Error fetching team member:", error);
      res.status(500).json({ error: "Failed to fetch team member" });
    }
  });

  // Create team member
  app.post("/api/team-members", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertTeamMemberSchema.parse({
        ...req.body,
        userId: userId,
      });

      const member = await storage.createTeamMember(validatedData);
      res.json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error creating team member:", error);
      res.status(500).json({ error: "Failed to create team member" });
    }
  });

  // Update team member
  app.patch("/api/team-members/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getTeamMember(req.params.id);
      if (!member || member.userId !== userId) {
        return res.status(404).json({ error: "Team member not found" });
      }

      // Validate update data
      const updateSchema = insertTeamMemberSchema.partial().omit({ userId: true });
      const validatedUpdates = updateSchema.parse(req.body);

      const updatedMember = await storage.updateTeamMember(req.params.id, validatedUpdates);
      res.json(updatedMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error updating team member:", error);
      res.status(500).json({ error: "Failed to update team member" });
    }
  });

  // Delete team member
  app.delete("/api/team-members/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getTeamMember(req.params.id);
      if (!member || member.userId !== userId) {
        return res.status(404).json({ error: "Team member not found" });
      }

      await storage.deleteTeamMember(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting team member:", error);
      res.status(500).json({ error: "Failed to delete team member" });
    }
  });

  // ============ NOTIFICATION ROUTES ============

  // Get all notifications
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // ============ VOICE HISTORY ROUTES ============

  // Get voice history
  app.get("/api/voice-history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const history = await storage.getVoiceHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching voice history:", error);
      res.status(500).json({ error: "Failed to fetch voice history" });
    }
  });

  // ============ USER/SUBSCRIPTION ROUTES ============

  // Get current user
  app.get("/api/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // User schema no longer has password field
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Get dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tasks = await storage.getTasks(userId);
      const teamMembers = await storage.getTeamMembers(userId);

      const activeTasks = tasks.filter(t => t.status !== "completed").length;
      const completedToday = tasks.filter(t => {
        if (!t.completedAt) return false;
        const today = new Date();
        const completedDate = new Date(t.completedAt);
        return completedDate.toDateString() === today.toDateString();
      }).length;

      // Calculate team productivity as average completion rate
      const totalCompletionRate = teamMembers.reduce((sum, member) => sum + (member.completionRate || 0), 0);
      const productivity = teamMembers.length > 0 ? Math.round(totalCompletionRate / teamMembers.length) : 0;

      res.json({
        activeTasks,
        productivity,
        completedToday,
        teamSize: teamMembers.length,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // ============ STRIPE SUBSCRIPTION ROUTES ============

  // Get or create subscription for Executive Plan ($1/month)
  app.post('/api/subscription/create', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // If user already has an active subscription, return it
      if (user.subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);
        
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          return res.json({
            subscriptionId: subscription.id,
            status: subscription.status,
            clientSecret: null,
          });
        }
      }

      // Create Stripe customer if not exists
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: fullName,
          metadata: {
            userId: user.id,
          },
        });
        stripeCustomerId = customer.id;
        await storage.updateUser(user.id, { stripeCustomerId });
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{
          price: process.env.STRIPE_PRICE_ID,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user's subscription info
      await storage.updateUser(user.id, {
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
      });

      const invoice = subscription.latest_invoice as any;
      const paymentIntent = invoice?.payment_intent as any;

      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret || null,
        status: subscription.status,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: error.message || "Failed to create subscription" });
    }
  });

  // Cancel subscription
  app.post('/api/subscription/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.subscriptionId) {
        return res.status(400).json({ error: "No active subscription found" });
      }

      const subscription = await stripe.subscriptions.update(user.subscriptionId, {
        cancel_at_period_end: true,
      });

      await storage.updateUser(user.id, {
        subscriptionStatus: 'cancelled',
      });

      res.json({ 
        success: true,
        subscription: {
          id: subscription.id,
          cancel_at: subscription.cancel_at,
        },
      });
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ error: error.message || "Failed to cancel subscription" });
    }
  });

  // Get subscription status
  app.get('/api/subscription/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!user.subscriptionId) {
        return res.json({ 
          hasSubscription: false,
          status: 'inactive',
        });
      }

      const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);

      res.json({
        hasSubscription: true,
        status: subscription.status,
        currentPeriodEnd: (subscription as any).current_period_end,
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      });
    } catch (error: any) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ error: "Failed to fetch subscription status" });
    }
  });

  // ============ CALENDAR ROUTES ============

  // Get calendar events
  app.get('/api/calendar/events', isAuthenticated, async (req: any, res) => {
    try {
      const timeMin = req.query.timeMin ? new Date(req.query.timeMin as string) : new Date();
      const timeMax = req.query.timeMax ? new Date(req.query.timeMax as string) : undefined;
      const maxResults = req.query.maxResults ? parseInt(req.query.maxResults as string) : 50;

      const events = await listCalendarEvents(timeMin, timeMax, maxResults);
      res.json(events);
    } catch (error: any) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ error: error.message || "Failed to fetch calendar events" });
    }
  });

  // Create calendar event from task
  app.post('/api/calendar/events', isAuthenticated, async (req: any, res) => {
    try {
      const requestSchema = z.object({
        taskId: z.string().optional(),
        summary: z.string().min(1),
        description: z.string().optional(),
        startTime: z.string().transform(str => new Date(str)),
        endTime: z.string().transform(str => new Date(str)),
        attendees: z.array(z.string().email()).optional(),
      });

      const data = requestSchema.parse(req.body);
      
      const event = await createCalendarEvent({
        summary: data.summary,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        attendees: data.attendees,
      });

      const userId = req.user.claims.sub;
      await storage.createCalendarEvent({
        userId,
        taskId: data.taskId || null,
        googleEventId: event.id!,
        title: data.summary,
        description: data.description || null,
        startTime: data.startTime,
        endTime: data.endTime,
        attendees: data.attendees || [],
        location: null,
        status: 'confirmed',
      });

      res.json(event);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const friendlyError = fromZodError(error);
        return res.status(400).json({ error: friendlyError.message });
      }
      console.error("Error creating calendar event:", error);
      res.status(500).json({ error: error.message || "Failed to create calendar event" });
    }
  });

  // Sync task deadline to calendar
  app.post('/api/tasks/:id/sync-to-calendar', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.getTask(req.params.id);

      if (!task || task.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }

      if (!task.dueDate) {
        return res.status(400).json({ error: "Task has no due date to sync" });
      }

      const startTime = new Date(task.dueDate);
      startTime.setHours(startTime.getHours() - 1);
      const endTime = new Date(task.dueDate);

      const event = await createCalendarEvent({
        summary: `Task Due: ${task.title}`,
        description: task.description || undefined,
        startTime,
        endTime,
      });

      await storage.createCalendarEvent({
        userId,
        taskId: task.id,
        googleEventId: event.id!,
        title: `Task Due: ${task.title}`,
        description: task.description,
        startTime,
        endTime,
        attendees: [],
        location: null,
        status: 'confirmed',
      });

      res.json({ success: true, event });
    } catch (error: any) {
      console.error("Error syncing task to calendar:", error);
      res.status(500).json({ error: error.message || "Failed to sync task to calendar" });
    }
  });

  // Get team availability
  app.post('/api/calendar/availability', isAuthenticated, async (req: any, res) => {
    try {
      const requestSchema = z.object({
        emails: z.array(z.string().email()),
        timeMin: z.string().transform(str => new Date(str)),
        timeMax: z.string().transform(str => new Date(str)),
      });

      const data = requestSchema.parse(req.body);
      const availability = await getFreeBusyInfo(data.emails, data.timeMin, data.timeMax);
      
      res.json(availability);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const friendlyError = fromZodError(error);
        return res.status(400).json({ error: friendlyError.message });
      }
      console.error("Error checking availability:", error);
      res.status(500).json({ error: error.message || "Failed to check availability" });
    }
  });

  // ============ EMAIL ROUTES ============

  // Get email inbox for user
  app.get("/api/emails", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const emails = await storage.getEmailInbox(userId);
      res.json(emails);
    } catch (error) {
      console.error("Error fetching emails:", error);
      res.status(500).json({ error: "Failed to fetch emails" });
    }
  });

  // Webhook endpoint for incoming emails (generic - works with any email service)
  app.post("/api/emails/webhook", async (req, res) => {
    try {
      const requestSchema = z.object({
        userId: z.string(), // Provided by email service or routing logic
        messageId: z.string(),
        from: z.string().email(),
        fromName: z.string().optional(),
        subject: z.string(),
        bodyText: z.string().optional(),
        bodyHtml: z.string().optional(),
        receivedAt: z.string().optional(),
      });

      const emailData = requestSchema.parse(req.body);

      // Check for duplicate email
      const existingEmail = await storage.getEmailByMessageId(emailData.messageId);
      if (existingEmail) {
        return res.json({ 
          message: "Email already processed", 
          emailId: existingEmail.id,
          taskId: existingEmail.taskId 
        });
      }

      // Get body text (prefer plain text, fallback to converting HTML)
      let bodyText = emailData.bodyText || '';
      if (!bodyText && emailData.bodyHtml) {
        bodyText = htmlToPlainText(emailData.bodyHtml);
      }

      // Store email in database
      const email = await storage.createEmail({
        userId: emailData.userId,
        taskId: null,
        messageId: emailData.messageId,
        from: emailData.from,
        fromName: emailData.fromName || null,
        subject: emailData.subject,
        bodyText,
        bodyHtml: emailData.bodyHtml || null,
        receivedAt: emailData.receivedAt ? new Date(emailData.receivedAt) : new Date(),
        status: 'pending',
        processedAt: null,
        errorMessage: null,
        extractedTask: null,
      });

      // Analyze email asynchronously (don't block response)
      processEmailAsync(email.id, emailData.userId, emailData.from, emailData.subject, bodyText)
        .catch(err => console.error("Error processing email:", err));

      res.json({ 
        message: "Email received and will be processed",
        emailId: email.id 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error processing email webhook:", error);
      res.status(500).json({ error: "Failed to process email" });
    }
  });

  // Manual email-to-task creation (for testing or manual forwarding)
  app.post("/api/emails/create-task", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestSchema = z.object({
        from: z.string().email(),
        subject: z.string().min(1),
        bodyText: z.string().min(1),
      });

      const { from, subject, bodyText } = requestSchema.parse(req.body);

      // Get team members for AI suggestions
      const teamMembers = await storage.getTeamMembers(userId);
      const teamMemberNames = teamMembers.map(tm => tm.name);

      // Analyze email with AI
      const analysis = await analyzeEmailForTask(from, subject, bodyText, teamMemberNames);

      if (!analysis.shouldCreateTask) {
        return res.json({
          shouldCreateTask: false,
          reason: analysis.reason,
        });
      }

      if (!analysis.taskData) {
        return res.status(400).json({ error: "AI analysis failed to extract task data" });
      }

      // Find suggested team member
      let suggestedTeamMember = null;
      if (analysis.taskData.suggestedAssignee) {
        suggestedTeamMember = teamMembers.find(
          tm => tm.name.toLowerCase() === analysis.taskData!.suggestedAssignee?.toLowerCase()
        );
      }

      // Create task from email
      const task = await storage.createTask({
        userId,
        teamMemberId: suggestedTeamMember?.id || null,
        title: analysis.taskData.title,
        description: analysis.taskData.description,
        voiceTranscript: `Email from: ${from}\nSubject: ${subject}`,
        impact: analysis.taskData.impact,
        urgency: analysis.taskData.urgency,
        aiAnalysis: analysis.taskData.smartObjectives || null,
        suggestedAssignee: analysis.taskData.suggestedAssignee || null,
        status: 'delegated',
        progress: 0,
        dueDate: analysis.taskData.dueDate ? new Date(analysis.taskData.dueDate) : null,
        acceptedAt: null,
        expiryDate: null,
        spendingLimit: null,
      });

      // Create email record
      const email = await storage.createEmail({
        userId,
        taskId: task.id,
        messageId: `manual-${Date.now()}`,
        from,
        fromName: null,
        subject,
        bodyText,
        bodyHtml: null,
        receivedAt: new Date(),
        status: 'processed',
        processedAt: new Date(),
        errorMessage: null,
        extractedTask: analysis.taskData as any,
      });

      // Update task counts
      if (suggestedTeamMember) {
        await storage.updateTeamMember(suggestedTeamMember.id, {
          activeTasks: (suggestedTeamMember.activeTasks || 0) + 1,
        });
      }

      // Create notification
      await storage.createNotification({
        userId,
        taskId: task.id,
        type: "task_assigned",
        title: "Task Created from Email",
        message: `New task "${task.title}" created from email: ${subject}`,
      });

      res.json({
        shouldCreateTask: true,
        task,
        email,
        analysis,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromZodError(error).message });
      }
      console.error("Error creating task from email:", error);
      res.status(500).json({ error: "Failed to create task from email" });
    }
  });

  // Async function to process email and create task
  async function processEmailAsync(
    emailId: string,
    userId: string,
    from: string,
    subject: string,
    bodyText: string
  ) {
    try {
      // Get team members for AI suggestions
      const teamMembers = await storage.getTeamMembers(userId);
      const teamMemberNames = teamMembers.map(tm => tm.name);

      // Analyze email with AI
      const analysis = await analyzeEmailForTask(from, subject, bodyText, teamMemberNames);

      if (!analysis.shouldCreateTask) {
        await storage.updateEmail(emailId, {
          status: 'ignored',
          processedAt: new Date(),
          extractedTask: { reason: analysis.reason } as any,
        });
        return;
      }

      if (!analysis.taskData) {
        await storage.updateEmail(emailId, {
          status: 'failed',
          processedAt: new Date(),
          errorMessage: 'AI analysis failed to extract task data',
        });
        return;
      }

      // Find suggested team member
      let suggestedTeamMember = null;
      if (analysis.taskData.suggestedAssignee) {
        suggestedTeamMember = teamMembers.find(
          tm => tm.name.toLowerCase() === analysis.taskData!.suggestedAssignee?.toLowerCase()
        );
      }

      // Create task from email
      const task = await storage.createTask({
        userId,
        teamMemberId: suggestedTeamMember?.id || null,
        title: analysis.taskData.title,
        description: analysis.taskData.description,
        voiceTranscript: `Email from: ${from}\nSubject: ${subject}`,
        impact: analysis.taskData.impact,
        urgency: analysis.taskData.urgency,
        aiAnalysis: analysis.taskData.smartObjectives || null,
        suggestedAssignee: analysis.taskData.suggestedAssignee || null,
        status: 'delegated',
        progress: 0,
        dueDate: analysis.taskData.dueDate ? new Date(analysis.taskData.dueDate) : null,
        acceptedAt: null,
        expiryDate: null,
        spendingLimit: null,
      });

      // Update email with task linkage
      await storage.updateEmail(emailId, {
        taskId: task.id,
        status: 'processed',
        processedAt: new Date(),
        extractedTask: analysis.taskData as any,
      });

      // Update task counts
      if (suggestedTeamMember) {
        await storage.updateTeamMember(suggestedTeamMember.id, {
          activeTasks: (suggestedTeamMember.activeTasks || 0) + 1,
        });
      }

      // Create notification
      await storage.createNotification({
        userId,
        taskId: task.id,
        type: "task_assigned",
        title: "Task Created from Email",
        message: `New task "${task.title}" created from email: ${subject}`,
      });

      console.log(`Successfully created task ${task.id} from email ${emailId}`);
    } catch (error) {
      console.error("Error in processEmailAsync:", error);
      await storage.updateEmail(emailId, {
        status: 'failed',
        processedAt: new Date(),
        errorMessage: (error as Error).message,
      });
    }
  }

  // ============ TIER 1: COMMENT ROUTES ============
  
  app.get("/api/tasks/:taskId/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.getTask(req.params.taskId);
      if (!task || task.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }
      const comments = await storage.getComments(req.params.taskId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/tasks/:taskId/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.getTask(req.params.taskId);
      if (!task || task.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }
      const validated = insertCommentSchema.parse({
        ...req.body,
        taskId: req.params.taskId,
        userId,
      });
      const comment = await storage.createComment(validated);
      
      // Log activity
      await storage.createActivityLog({
        taskId: req.params.taskId,
        userId,
        action: "comment_added",
        details: { commentId: comment.id, preview: comment.content.slice(0, 100) },
      });
      
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        res.status(500).json({ error: "Failed to create comment" });
      }
    }
  });

  app.delete("/api/comments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const comment = await storage.getComment(req.params.id);
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }
      // Verify ownership through task
      const task = await storage.getTask(comment.taskId);
      if (!task || task.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      await storage.deleteComment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // ============ TIER 1: ATTACHMENT ROUTES ============
  
  app.get("/api/tasks/:taskId/attachments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.getTask(req.params.taskId);
      if (!task || task.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }
      const attachments = await storage.getAttachments(req.params.taskId);
      res.json(attachments);
    } catch (error) {
      console.error("Error fetching attachments:", error);
      res.status(500).json({ error: "Failed to fetch attachments" });
    }
  });

  app.post("/api/tasks/:taskId/attachments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.getTask(req.params.taskId);
      if (!task || task.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }
      const validated = insertAttachmentSchema.parse({
        ...req.body,
        taskId: req.params.taskId,
        userId,
      });
      const attachment = await storage.createAttachment(validated);
      
      // Log activity
      await storage.createActivityLog({
        taskId: req.params.taskId,
        userId,
        action: "attachment_added",
        details: { attachmentId: attachment.id, fileName: attachment.fileName },
      });
      
      res.status(201).json(attachment);
    } catch (error) {
      console.error("Error creating attachment:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        res.status(500).json({ error: "Failed to create attachment" });
      }
    }
  });

  app.delete("/api/attachments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const attachment = await storage.getAttachment(req.params.id);
      if (!attachment) {
        return res.status(404).json({ error: "Attachment not found" });
      }
      // Verify ownership through task
      const task = await storage.getTask(attachment.taskId);
      if (!task || task.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      await storage.deleteAttachment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting attachment:", error);
      res.status(500).json({ error: "Failed to delete attachment" });
    }
  });

  // ============ TIER 1: SUBTASK ROUTES ============
  
  app.get("/api/tasks/:taskId/subtasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.getTask(req.params.taskId);
      if (!task || task.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }
      const subtasks = await storage.getSubtasks(req.params.taskId);
      res.json(subtasks);
    } catch (error) {
      console.error("Error fetching subtasks:", error);
      res.status(500).json({ error: "Failed to fetch subtasks" });
    }
  });

  app.post("/api/tasks/:taskId/subtasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.getTask(req.params.taskId);
      if (!task || task.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }
      const validated = insertSubtaskSchema.parse({
        ...req.body,
        taskId: req.params.taskId,
      });
      const subtask = await storage.createSubtask(validated);
      
      // Log activity
      await storage.createActivityLog({
        taskId: req.params.taskId,
        userId,
        action: "subtask_added",
        details: { subtaskId: subtask.id, title: subtask.title },
      });
      
      res.status(201).json(subtask);
    } catch (error) {
      console.error("Error creating subtask:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        res.status(500).json({ error: "Failed to create subtask" });
      }
    }
  });

  app.patch("/api/subtasks/:id/toggle", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subtask = await storage.getSubtask(req.params.id);
      if (!subtask) {
        return res.status(404).json({ error: "Subtask not found" });
      }
      // Verify ownership through task
      const task = await storage.getTask(subtask.taskId);
      if (!task || task.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const updated = await storage.toggleSubtask(req.params.id);
      res.json(updated);
    } catch (error) {
      console.error("Error toggling subtask:", error);
      res.status(500).json({ error: "Failed to toggle subtask" });
    }
  });

  app.delete("/api/subtasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subtask = await storage.getSubtask(req.params.id);
      if (!subtask) {
        return res.status(404).json({ error: "Subtask not found" });
      }
      // Verify ownership through task
      const task = await storage.getTask(subtask.taskId);
      if (!task || task.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      await storage.deleteSubtask(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subtask:", error);
      res.status(500).json({ error: "Failed to delete subtask" });
    }
  });

  // ============ TIER 2: TAG ROUTES ============
  
  app.get("/api/tags", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tags = await storage.getTags(userId);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ error: "Failed to fetch tags" });
    }
  });

  app.post("/api/tags", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = insertTagSchema.parse({
        ...req.body,
        userId,
      });
      const tag = await storage.createTag(validated);
      res.status(201).json(tag);
    } catch (error) {
      console.error("Error creating tag:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        res.status(500).json({ error: "Failed to create tag" });
      }
    }
  });

  app.get("/api/tasks/:taskId/tags", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.getTask(req.params.taskId);
      if (!task || task.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }
      const tags = await storage.getTaskTags(req.params.taskId);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching task tags:", error);
      res.status(500).json({ error: "Failed to fetch task tags" });
    }
  });

  app.post("/api/tasks/:taskId/tags/:tagId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.getTask(req.params.taskId);
      if (!task || task.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }
      await storage.addTaskTag({
        taskId: req.params.taskId,
        tagId: req.params.tagId,
      });
      res.status(201).send();
    } catch (error) {
      console.error("Error adding task tag:", error);
      res.status(400).json({ error: "Failed to add task tag" });
    }
  });

  app.delete("/api/tasks/:taskId/tags/:tagId", isAuthenticated, async (req: any, res) => {
    try {
      await storage.removeTaskTag(req.params.taskId, req.params.tagId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing task tag:", error);
      res.status(500).json({ error: "Failed to remove task tag" });
    }
  });

  // ============ TIER 2: ACTIVITY LOG ROUTES ============
  
  app.get("/api/tasks/:taskId/activity", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.getTask(req.params.taskId);
      if (!task || task.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }
      const activity = await storage.getActivityLog(req.params.taskId);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching activity log:", error);
      res.status(500).json({ error: "Failed to fetch activity log" });
    }
  });

  // ============ TIER 2: TASK WATCHER ROUTES ============
  
  app.get("/api/tasks/:taskId/watchers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.getTask(req.params.taskId);
      if (!task || task.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }
      const watchers = await storage.getTaskWatchers(req.params.taskId);
      res.json(watchers);
    } catch (error) {
      console.error("Error fetching watchers:", error);
      res.status(500).json({ error: "Failed to fetch watchers" });
    }
  });

  app.post("/api/tasks/:taskId/watchers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.addTaskWatcher({
        taskId: req.params.taskId,
        userId,
        teamMemberId: req.body.teamMemberId || null,
      });
      res.status(201).send();
    } catch (error) {
      console.error("Error adding watcher:", error);
      res.status(400).json({ error: "Failed to add watcher" });
    }
  });

  app.delete("/api/tasks/:taskId/watchers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.removeTaskWatcher(req.params.taskId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing watcher:", error);
      res.status(500).json({ error: "Failed to remove watcher" });
    }
  });

  // ============ TIER 3: TASK TEMPLATE ROUTES ============
  
  app.get("/api/templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templates = await storage.getTaskTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.post("/api/templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = insertTaskTemplateSchema.parse({
        ...req.body,
        userId,
      });
      const template = await storage.createTaskTemplate(validated);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(400).json({ error: fromZodError(error as any).message });
    }
  });

  app.post("/api/templates/:id/create-task", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const template = await storage.getTaskTemplate(req.params.id);
      if (!template || template.userId !== userId) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      // Create task from template
      const task = await storage.createTask({
        userId,
        teamMemberId: req.body.teamMemberId || null,
        title: template.title,
        description: template.description || "",
        impact: template.impact,
        urgency: template.urgency,
        status: "delegated",
        progress: 0,
      });
      
      // Create subtasks from template
      if (template.subtaskTemplates) {
        const subtaskTitles = template.subtaskTemplates as string[];
        for (let i = 0; i < subtaskTitles.length; i++) {
          await storage.createSubtask({
            taskId: task.id,
            title: subtaskTitles[i],
            order: i,
            completed: false,
          });
        }
      }
      
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task from template:", error);
      res.status(500).json({ error: "Failed to create task from template" });
    }
  });

  app.delete("/api/templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const template = await storage.getTaskTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      // Verify ownership
      if (template.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      await storage.deleteTaskTemplate(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ error: "Failed to delete template" });
    }
  });

  // ============ TIER 3: RECURRING TASK ROUTES ============
  
  app.get("/api/recurring-tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const patterns = await storage.getRecurringTaskPatterns(userId);
      res.json(patterns);
    } catch (error) {
      console.error("Error fetching recurring tasks:", error);
      res.status(500).json({ error: "Failed to fetch recurring tasks" });
    }
  });

  app.post("/api/tasks/:taskId/recurring", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const task = await storage.getTask(req.params.taskId);
      if (!task || task.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }
      const validated = insertRecurringTaskPatternSchema.parse({
        ...req.body,
        taskId: req.params.taskId,
      });
      const pattern = await storage.createRecurringTaskPattern(validated);
      res.status(201).json(pattern);
    } catch (error) {
      console.error("Error creating recurring pattern:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: fromZodError(error).message });
      } else {
        res.status(500).json({ error: "Failed to create recurring pattern" });
      }
    }
  });

  app.delete("/api/recurring-tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const pattern = await storage.getRecurringTaskPattern(req.params.id);
      if (!pattern) {
        return res.status(404).json({ error: "Recurring pattern not found" });
      }
      // Verify ownership through task
      const task = await storage.getTask(pattern.taskId);
      if (!task || task.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      await storage.deleteRecurringTaskPattern(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting recurring pattern:", error);
      res.status(500).json({ error: "Failed to delete recurring pattern" });
    }
  });

  // ============ INTEGRATION ROUTES: SLACK ============

  // Temporary state storage for OAuth CSRF protection
  const oauthStates = new Map<string, { state: string; expiresAt: number }>();

  // Get Slack OAuth authorization URL
  app.get('/api/integrations/slack/install', isAuthenticated, async (req: any, res) => {
    try {
      const clientId = process.env.SLACK_CLIENT_ID;
      if (!clientId) {
        return res.status(500).json({ error: "Slack integration not configured. Please set SLACK_CLIENT_ID" });
      }

      const userId = req.user.claims.sub;
      const redirectUri = `${req.protocol}://${req.get('host')}/api/integrations/slack/callback`;
      const scopes = ['chat:write', 'channels:read', 'commands', 'users:read'].join(',');
      
      // Generate CSRF state token
      const state = crypto.randomBytes(32).toString('hex');
      oauthStates.set(userId, {
        state,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      });
      
      const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
      
      res.json({ url: authUrl });
    } catch (error: any) {
      console.error("Error generating Slack OAuth URL:", error);
      res.status(500).json({ error: "Failed to generate Slack authorization URL" });
    }
  });

  // Handle Slack OAuth callback
  app.get('/api/integrations/slack/callback', isAuthenticated, async (req: any, res) => {
    try {
      const { code, state } = req.query;
      if (!code || !state) {
        return res.redirect('/?error=slack_oauth_failed');
      }

      const userId = req.user.claims.sub;
      
      // Verify CSRF state token
      const storedState = oauthStates.get(userId);
      if (!storedState || storedState.state !== state || storedState.expiresAt < Date.now()) {
        console.error("Invalid or expired OAuth state");
        oauthStates.delete(userId);
        return res.redirect('/?error=slack_oauth_csrf_failed');
      }
      
      // Clean up state after verification
      oauthStates.delete(userId);

      const redirectUri = `${req.protocol}://${req.get('host')}/api/integrations/slack/callback`;
      const { exchangeCodeForToken } = await import('./integrations/slack');
      const tokenResponse = await exchangeCodeForToken(code as string, redirectUri);

      if (!tokenResponse.ok || !tokenResponse.access_token) {
        console.error("Slack OAuth error:", tokenResponse.error);
        return res.redirect('/?error=slack_oauth_failed');
      }

      // Store integration
      const credentials = JSON.stringify({
        accessToken: tokenResponse.access_token,
        teamId: tokenResponse.team?.id,
        teamName: tokenResponse.team?.name,
        userId: tokenResponse.authed_user?.id,
      });

      // Check if integration already exists
      const existing = await storage.getIntegration(userId, 'slack');
      if (existing) {
        await storage.updateIntegration(existing.id, {
          credentials,
          status: 'active',
          lastSyncAt: new Date(),
        });
      } else {
        await storage.createIntegration({
          userId,
          integrationId: 'slack',
          credentials,
          settings: {},
          status: 'active',
          lastSyncAt: new Date(),
        });
      }

      res.redirect('/?integration=slack&status=success');
    } catch (error: any) {
      console.error("Error in Slack OAuth callback:", error);
      res.redirect('/?error=slack_oauth_failed');
    }
  });

  // Get Slack integration status
  app.get('/api/integrations/slack', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integration = await storage.getIntegration(userId, 'slack');
      
      if (!integration) {
        return res.json({ connected: false });
      }

      const credentials = JSON.parse(integration.credentials || '{}');
      res.json({
        connected: true,
        status: integration.status,
        teamName: credentials.teamName,
        lastSync: integration.lastSyncAt,
      });
    } catch (error) {
      console.error("Error fetching Slack integration:", error);
      res.status(500).json({ error: "Failed to fetch Slack integration status" });
    }
  });

  // Send test notification to Slack
  app.post('/api/integrations/slack/test', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integration = await storage.getIntegration(userId, 'slack');
      
      if (!integration) {
        return res.status(404).json({ error: "Slack not connected" });
      }

      const credentials = JSON.parse(integration.credentials || '{}');
      const { postMessage } = await import('./integrations/slack');
      
      await postMessage(
        credentials.accessToken,
        'general',
        'Test notification from Deleg8te.ai! Your integration is working correctly. 🎉'
      );

      res.json({ success: true, message: "Test notification sent to #general" });
    } catch (error: any) {
      console.error("Error sending Slack test notification:", error);
      res.status(500).json({ error: error.message || "Failed to send test notification" });
    }
  });

  // Disconnect Slack integration
  app.delete('/api/integrations/slack', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integration = await storage.getIntegration(userId, 'slack');
      
      if (!integration) {
        return res.status(404).json({ error: "Slack integration not found" });
      }

      await storage.deleteIntegration(integration.id);
      res.json({ success: true, message: "Slack integration disconnected" });
    } catch (error) {
      console.error("Error disconnecting Slack:", error);
      res.status(500).json({ error: "Failed to disconnect Slack integration" });
    }
  });

  // ============ INTEGRATION ROUTES: GMAIL ============

  // Helper function to refresh Gmail access token if needed
  async function ensureGmailToken(integration: any) {
    const credentials = JSON.parse(integration.credentials || '{}');
    
    // Check if token is expired or close to expiry (within 5 minutes)
    const now = Date.now();
    const expiryDate = credentials.expiryDate || 0;
    const needsRefresh = now >= (expiryDate - 5 * 60 * 1000);

    if (needsRefresh && credentials.refreshToken) {
      const { refreshAccessToken } = await import('./integrations/gmail');
      const refreshed = await refreshAccessToken(credentials.refreshToken);
      
      // Update credentials with new access token
      const newCredentials = {
        ...credentials,
        accessToken: refreshed.access_token,
        expiryDate: now + (refreshed.expires_in * 1000),
      };

      // Persist updated credentials
      await storage.updateIntegration(integration.id, {
        credentials: JSON.stringify(newCredentials),
      });

      return newCredentials;
    }

    return credentials;
  }

  // Get Gmail OAuth authorization URL
  app.get('/api/integrations/gmail/install', isAuthenticated, async (req: any, res) => {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (!clientId) {
        return res.status(500).json({ error: "Gmail integration not configured. Please set GOOGLE_CLIENT_ID" });
      }

      const userId = req.user.claims.sub;
      const redirectUri = `${req.protocol}://${req.get('host')}/api/integrations/gmail/callback`;
      const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.labels',
        'https://www.googleapis.com/auth/gmail.modify',
      ].join(' ');
      
      // Generate CSRF state token
      const state = crypto.randomBytes(32).toString('hex');
      oauthStates.set(userId, {
        state,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      });
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}&access_type=offline&prompt=consent`;
      
      res.json({ url: authUrl });
    } catch (error: any) {
      console.error("Error generating Gmail OAuth URL:", error);
      res.status(500).json({ error: "Failed to generate Gmail authorization URL" });
    }
  });

  // Handle Gmail OAuth callback
  app.get('/api/integrations/gmail/callback', isAuthenticated, async (req: any, res) => {
    try {
      const { code, state } = req.query;
      if (!code || !state) {
        return res.redirect('/?error=gmail_oauth_failed');
      }

      const userId = req.user.claims.sub;
      
      // Verify CSRF state token
      const storedState = oauthStates.get(userId);
      if (!storedState || storedState.state !== state || storedState.expiresAt < Date.now()) {
        console.error("Invalid or expired OAuth state");
        oauthStates.delete(userId);
        return res.redirect('/?error=gmail_oauth_csrf_failed');
      }
      
      // Clean up state after verification
      oauthStates.delete(userId);

      const redirectUri = `${req.protocol}://${req.get('host')}/api/integrations/gmail/callback`;
      const { exchangeCodeForToken, getUserProfile, getOrCreateLabel } = await import('./integrations/gmail');
      const tokenResponse = await exchangeCodeForToken(code as string, redirectUri);

      if (!tokenResponse.access_token) {
        console.error("Gmail OAuth error: No access token");
        return res.redirect('/?error=gmail_oauth_failed');
      }

      // Get user profile
      const profile = await getUserProfile(tokenResponse.access_token);

      // Create "Deleg8te" label for auto-processing
      const delegateLabelId = await getOrCreateLabel(tokenResponse.access_token, 'Deleg8te');

      // Normalize credentials (convert Google's field names to our format)
      const now = Date.now();
      const expiresIn = tokenResponse.expires_in || 3600; // Default to 1 hour
      const credentials = JSON.stringify({
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        scope: tokenResponse.scope,
        expiryDate: tokenResponse.expiry_date || (now + expiresIn * 1000), // Normalize to our field name
        emailAddress: profile.emailAddress,
        delegateLabelId,
      });

      // Check if integration already exists
      const existing = await storage.getIntegration(userId, 'gmail');
      if (existing) {
        await storage.updateIntegration(existing.id, {
          credentials,
          status: 'active',
          lastSyncAt: new Date(),
        });
      } else {
        await storage.createIntegration({
          userId,
          integrationId: 'gmail',
          credentials,
          settings: {},
          status: 'active',
          lastSyncAt: new Date(),
        });
      }

      res.redirect('/?integration=gmail&status=success');
    } catch (error: any) {
      console.error("Error in Gmail OAuth callback:", error);
      res.redirect('/?error=gmail_oauth_failed');
    }
  });

  // Get Gmail integration status
  app.get('/api/integrations/gmail', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integration = await storage.getIntegration(userId, 'gmail');
      
      if (!integration) {
        return res.json({ connected: false });
      }

      const credentials = JSON.parse(integration.credentials || '{}');
      res.json({
        connected: true,
        status: integration.status,
        emailAddress: credentials.emailAddress,
        lastSync: integration.lastSyncAt,
      });
    } catch (error) {
      console.error("Error fetching Gmail integration:", error);
      res.status(500).json({ error: "Failed to fetch Gmail integration status" });
    }
  });

  // Send test email via Gmail
  app.post('/api/integrations/gmail/test', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integration = await storage.getIntegration(userId, 'gmail');
      
      if (!integration) {
        return res.status(404).json({ error: "Gmail not connected" });
      }

      // Ensure token is fresh
      const credentials = await ensureGmailToken(integration);
      const { sendEmail } = await import('./integrations/gmail');
      
      await sendEmail(
        credentials.accessToken,
        credentials.emailAddress,
        'Test from Deleg8te.ai',
        '<p>Test notification from Deleg8te.ai! Your Gmail integration is working correctly. 🎉</p><p>You can now create tasks from labeled emails and receive task updates via email.</p>'
      );

      res.json({ success: true, message: `Test email sent to ${credentials.emailAddress}` });
    } catch (error: any) {
      console.error("Error sending Gmail test email:", error);
      res.status(500).json({ error: error.message || "Failed to send test email" });
    }
  });

  // Sync Gmail inbox for labeled messages (manual trigger)
  app.post('/api/integrations/gmail/sync', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integration = await storage.getIntegration(userId, 'gmail');
      
      if (!integration) {
        return res.status(404).json({ error: "Gmail not connected" });
      }

      // Ensure token is fresh
      const credentials = await ensureGmailToken(integration);
      const { listMessages, extractHeaders, extractBody } = await import('./integrations/gmail');
      
      // Get messages with "Deleg8te" label
      const messages = await listMessages(credentials.accessToken, [credentials.delegateLabelId], 10);

      let processedCount = 0;
      for (const message of messages) {
        const headers = extractHeaders(message);
        const { bodyText, bodyHtml } = extractBody(message);

        // Check if already processed
        const existingEmail = await storage.getEmailByMessageId(message.id);
        if (existingEmail) {
          continue; // Skip already processed emails
        }

        // Process email via webhook (reuse existing email processing logic)
        try {
          const bodyToAnalyze = bodyText || htmlToPlainText(bodyHtml);
          
          // Store email
          const email = await storage.createEmail({
            userId,
            taskId: null,
            messageId: message.id,
            from: headers.from,
            fromName: headers.fromName,
            subject: headers.subject,
            bodyText: bodyToAnalyze,
            bodyHtml,
            receivedAt: new Date(headers.date),
            status: 'pending',
            processedAt: null,
            errorMessage: null,
            extractedTask: null,
          });

          // Get team members
          const teamMembers = await storage.getTeamMembers(userId);
          const teamMemberNames = teamMembers.map(tm => tm.name);

          // Analyze with AI
          const analysis = await analyzeEmailForTask(headers.from, headers.subject, bodyToAnalyze, teamMemberNames);

          if (analysis.shouldCreateTask && analysis.taskData) {
            // Find suggested team member
            let suggestedTeamMember = null;
            if (analysis.taskData.suggestedAssignee) {
              suggestedTeamMember = teamMembers.find(
                tm => tm.name.toLowerCase() === analysis.taskData!.suggestedAssignee?.toLowerCase()
              );
            }

            // Create task
            const task = await storage.createTask({
              userId,
              teamMemberId: suggestedTeamMember?.id || null,
              title: analysis.taskData.title,
              description: analysis.taskData.description,
              voiceTranscript: `Email from: ${headers.from}\nSubject: ${headers.subject}`,
              impact: analysis.taskData.impact,
              urgency: analysis.taskData.urgency,
              aiAnalysis: analysis.taskData.smartObjectives || null,
              suggestedAssignee: analysis.taskData.suggestedAssignee || null,
              status: 'delegated',
              progress: 0,
              dueDate: analysis.taskData.dueDate ? new Date(analysis.taskData.dueDate) : null,
              acceptedAt: null,
              expiryDate: null,
              spendingLimit: null,
            });

            // Update email with task linkage
            await storage.updateEmail(email.id, {
              taskId: task.id,
              status: 'processed',
              processedAt: new Date(),
              extractedTask: analysis.taskData as any,
            });

            processedCount++;
          } else {
            // Mark as ignored
            await storage.updateEmail(email.id, {
              status: 'ignored',
              processedAt: new Date(),
              extractedTask: { reason: analysis.reason } as any,
            });
          }
        } catch (processError) {
          console.error("Error processing email:", processError);
        }
      }

      // Update last sync
      await storage.updateIntegration(integration.id, {
        lastSyncAt: new Date(),
      });

      res.json({ 
        success: true, 
        message: `Synced ${messages.length} emails, created ${processedCount} tasks`,
        synced: messages.length,
        tasksCreated: processedCount
      });
    } catch (error: any) {
      console.error("Error syncing Gmail:", error);
      res.status(500).json({ error: error.message || "Failed to sync Gmail inbox" });
    }
  });

  // Disconnect Gmail integration
  app.delete('/api/integrations/gmail', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integration = await storage.getIntegration(userId, 'gmail');
      
      if (!integration) {
        return res.status(404).json({ error: "Gmail integration not found" });
      }

      await storage.deleteIntegration(integration.id);
      res.json({ success: true, message: "Gmail integration disconnected" });
    } catch (error) {
      console.error("Error disconnecting Gmail:", error);
      res.status(500).json({ error: "Failed to disconnect Gmail integration" });
    }
  });

  // ============ INTEGRATION ROUTES: GOOGLE MEET ============
  // Google Meet uses Google Calendar OAuth - shares authentication

  // Get Google Meet status (checks if Calendar is connected)
  app.get('/api/integrations/google-meet', isAuthenticated, async (req: any, res) => {
    try {
      // Google Meet uses Google Calendar connector
      const { getUncachableGoogleCalendarClient } = await import('./integrations/googleCalendar');
      
      try {
        // Try to get calendar client - if this succeeds, Google Calendar (and Meet) is connected
        await getUncachableGoogleCalendarClient();
        res.json({
          connected: true,
          status: 'active',
          message: 'Google Meet is available via Google Calendar integration'
        });
      } catch (error) {
        res.json({ connected: false });
      }
    } catch (error) {
      console.error("Error checking Google Meet status:", error);
      res.status(500).json({ error: "Failed to check Google Meet status" });
    }
  });

  // Create test meeting with Google Meet link
  app.post('/api/integrations/google-meet/test', isAuthenticated, async (req: any, res) => {
    try {
      const { createMeetingWithLink } = await import('./integrations/googleCalendar');
      
      // Create a test meeting 1 hour from now, lasting 30 minutes
      const startTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minutes duration
      
      const result = await createMeetingWithLink({
        summary: 'Test Meeting from Deleg8te.ai',
        description: 'This is a test meeting to verify Google Meet integration is working correctly.',
        startTime,
        endTime,
      });

      res.json({
        success: true,
        message: "Test meeting created successfully",
        meetLink: result.meetLink,
        meetingCode: result.meetingCode,
        eventId: result.event.id,
      });
    } catch (error: any) {
      console.error("Error creating test meeting:", error);
      res.status(500).json({ error: error.message || "Failed to create test meeting" });
    }
  });

  // Create meeting for a task
  app.post('/api/integrations/google-meet/create', isAuthenticated, async (req: any, res) => {
    try {
      // Validate request body
      const createMeetingSchema = z.object({
        taskId: z.string().min(1),
        startTime: z.string().datetime().or(z.number()),
        duration: z.number().positive().optional(),
        attendees: z.array(z.string().email()).optional(),
      });

      const parsed = createMeetingSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid request data",
          details: parsed.error.flatten().fieldErrors 
        });
      }

      const { taskId, startTime, duration, attendees } = parsed.data;

      const userId = req.user.claims.sub;
      const task = await storage.getTask(taskId);
      
      if (!task || task.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }

      const { createMeetingWithLink } = await import('./integrations/googleCalendar');
      
      const start = new Date(startTime);
      const durationMinutes = duration || 30; // Default 30 minutes
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
      
      const result = await createMeetingWithLink({
        summary: `Meeting: ${task.title}`,
        description: task.description || 'Task discussion meeting via Deleg8te.ai',
        startTime: start,
        endTime: end,
        attendees: attendees || [],
      });

      res.json({
        success: true,
        message: "Meeting created successfully",
        meetLink: result.meetLink,
        meetingCode: result.meetingCode,
        eventId: result.event.id,
      });
    } catch (error: any) {
      console.error("Error creating task meeting:", error);
      res.status(500).json({ error: error.message || "Failed to create meeting" });
    }
  });

  // ============ INTEGRATION ROUTES: GOOGLE DRIVE ============

  // Get Google Drive status
  app.get('/api/integrations/google-drive', isAuthenticated, async (req: any, res) => {
    try {
      const { getUncachableGoogleDriveClient } = await import('./integrations/googleDrive');
      
      try {
        await getUncachableGoogleDriveClient();
        res.json({
          connected: true,
          status: 'active',
          message: 'Google Drive is connected'
        });
      } catch (error) {
        res.json({ connected: false });
      }
    } catch (error) {
      console.error("Error checking Google Drive status:", error);
      res.status(500).json({ error: "Failed to check Google Drive status" });
    }
  });

  // Test Google Drive - create test folder
  app.post('/api/integrations/google-drive/test', isAuthenticated, async (req: any, res) => {
    try {
      const { createFolder } = await import('./integrations/googleDrive');
      
      const folder = await createFolder({
        folderName: `Deleg8te Test - ${new Date().toISOString().split('T')[0]}`,
      });

      res.json({
        success: true,
        message: "Test folder created successfully",
        folderId: folder.id,
        folderName: folder.name,
        webViewLink: folder.webViewLink,
      });
    } catch (error: any) {
      console.error("Error creating test folder:", error);
      res.status(500).json({ error: error.message || "Failed to create test folder" });
    }
  });

  // List files in Google Drive
  app.get('/api/integrations/google-drive/files', isAuthenticated, async (req: any, res) => {
    try {
      const { folderId, query, maxResults } = req.query;
      const { listFiles } = await import('./integrations/googleDrive');
      
      const files = await listFiles({
        folderId: folderId as string | undefined,
        query: query as string | undefined,
        maxResults: maxResults ? parseInt(maxResults as string) : undefined,
      });

      res.json({ files });
    } catch (error: any) {
      console.error("Error listing Drive files:", error);
      res.status(500).json({ error: error.message || "Failed to list files" });
    }
  });

  // Search files in Google Drive
  app.get('/api/integrations/google-drive/search', isAuthenticated, async (req: any, res) => {
    try {
      const { q, maxResults } = req.query;
      
      if (!q) {
        return res.status(400).json({ error: "Search query (q) is required" });
      }

      const { searchFiles } = await import('./integrations/googleDrive');
      
      const files = await searchFiles(
        q as string,
        maxResults ? parseInt(maxResults as string) : 20
      );

      res.json({ files });
    } catch (error: any) {
      console.error("Error searching Drive files:", error);
      res.status(500).json({ error: error.message || "Failed to search files" });
    }
  });

  // Export task to Google Drive as JSON
  app.post('/api/integrations/google-drive/export-task', isAuthenticated, async (req: any, res) => {
    try {
      const exportTaskSchema = z.object({
        taskId: z.string().min(1),
        folderId: z.string().optional(),
      });

      const parsed = exportTaskSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid request data",
          details: parsed.error.flatten().fieldErrors 
        });
      }

      const { taskId, folderId } = parsed.data;
      const userId = req.user.claims.sub;

      // Get task
      const task = await storage.getTask(taskId);
      if (!task || task.userId !== userId) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Get team member if assigned
      let teamMember = null;
      if (task.teamMemberId) {
        teamMember = await storage.getTeamMember(task.teamMemberId);
      }

      // Prepare task export data
      const exportData = {
        id: task.id,
        title: task.title,
        description: task.description,
        assignee: teamMember ? teamMember.name : 'Unassigned',
        impact: task.impact,
        urgency: task.urgency,
        status: task.status,
        progress: task.progress,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        smartObjectives: task.aiAnalysis,
        voiceTranscript: task.voiceTranscript,
      };

      const { exportTaskToJson } = await import('./integrations/googleDrive');
      
      const file = await exportTaskToJson(exportData, folderId);

      res.json({
        success: true,
        message: "Task exported to Google Drive",
        fileId: file.id,
        fileName: file.name,
        webViewLink: file.webViewLink,
      });
    } catch (error: any) {
      console.error("Error exporting task to Drive:", error);
      res.status(500).json({ error: error.message || "Failed to export task" });
    }
  });

  // Upload file to Google Drive
  app.post('/api/integrations/google-drive/upload', isAuthenticated, async (req: any, res) => {
    try {
      const uploadSchema = z.object({
        fileName: z.string().min(1),
        mimeType: z.string().min(1),
        fileContent: z.string(), // base64 encoded
        folderId: z.string().optional(),
      });

      const parsed = uploadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid request data",
          details: parsed.error.flatten().fieldErrors 
        });
      }

      const { fileName, mimeType, fileContent, folderId } = parsed.data;

      // Decode base64 content
      const buffer = Buffer.from(fileContent, 'base64');

      const { uploadFile } = await import('./integrations/googleDrive');
      
      const file = await uploadFile({
        fileName,
        mimeType,
        fileContent: buffer,
        folderId,
      });

      res.json({
        success: true,
        message: "File uploaded successfully",
        fileId: file.id,
        fileName: file.name,
        webViewLink: file.webViewLink,
        size: file.size,
      });
    } catch (error: any) {
      console.error("Error uploading to Drive:", error);
      res.status(500).json({ error: error.message || "Failed to upload file" });
    }
  });

  // ==================== NOTION INTEGRATION ====================
  
  // Get Notion connection status
  app.get('/api/integrations/notion', isAuthenticated, async (req: any, res) => {
    try {
      const { isNotionConnected } = await import('./integrations/notion');
      const connected = await isNotionConnected();
      
      res.json({
        connected,
        status: connected ? "Connected to Notion" : "Not connected",
      });
    } catch (error: any) {
      res.json({
        connected: false,
        status: "Not connected",
        message: error.message,
      });
    }
  });

  // List Notion databases
  app.get('/api/integrations/notion/databases', isAuthenticated, async (req: any, res) => {
    try {
      const { listNotionDatabases } = await import('./integrations/notion');
      const result = await listNotionDatabases();
      
      res.json({
        success: true,
        databases: result.results,
      });
    } catch (error: any) {
      console.error("Error listing Notion databases:", error);
      res.status(500).json({ error: error.message || "Failed to list databases" });
    }
  });

  // Get specific Notion database
  app.get('/api/integrations/notion/databases/:databaseId', isAuthenticated, async (req: any, res) => {
    try {
      const { databaseId } = req.params;
      const { getNotionDatabase } = await import('./integrations/notion');
      const database = await getNotionDatabase(databaseId);
      
      res.json({
        success: true,
        database,
      });
    } catch (error: any) {
      console.error("Error getting Notion database:", error);
      res.status(500).json({ error: error.message || "Failed to get database" });
    }
  });

  // Export task to Notion
  app.post('/api/integrations/notion/export-task', isAuthenticated, async (req: any, res) => {
    try {
      const exportSchema = z.object({
        taskId: z.string(),
        databaseId: z.string(),
      });

      const parsed = exportSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid request data",
          details: parsed.error.flatten().fieldErrors 
        });
      }

      const { taskId, databaseId } = parsed.data;
      const userId = req.user.claims.sub;

      // Get all user tasks and find the one we need
      const tasks = await storage.getTasks(userId);
      const task = tasks.find(t => t.id === taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Get assignee name if exists
      let assigneeName: string | undefined;
      if (task.teamMemberId) {
        const teamMembers = await storage.getTeamMembers(userId);
        const assignee = teamMembers.find(tm => tm.id === task.teamMemberId);
        assigneeName = assignee?.name;
      }

      const { createTaskInNotion } = await import('./integrations/notion');
      
      // Combine impact and urgency as priority
      const priority = task.impact === 'high' || task.urgency === 'high' ? 'High' :
                      task.impact === 'medium' || task.urgency === 'medium' ? 'Medium' : 'Low';
      
      const notionPage = await createTaskInNotion({
        title: task.title,
        description: task.description || undefined,
        priority: priority,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : undefined,
        assignee: assigneeName,
        databaseId,
      });

      res.json({
        success: true,
        message: "Task exported to Notion",
        pageId: notionPage.id,
        pageUrl: notionPage.url,
      });
    } catch (error: any) {
      console.error("Error exporting task to Notion:", error);
      res.status(500).json({ error: error.message || "Failed to export task" });
    }
  });

  // Query Notion database
  app.post('/api/integrations/notion/query', isAuthenticated, async (req: any, res) => {
    try {
      const querySchema = z.object({
        databaseId: z.string(),
        filter: z.any().optional(),
      });

      const parsed = querySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid request data",
          details: parsed.error.flatten().fieldErrors 
        });
      }

      const { databaseId, filter } = parsed.data;
      const { queryNotionDatabase } = await import('./integrations/notion');
      
      const result = await queryNotionDatabase(databaseId, filter);

      res.json({
        success: true,
        pages: result.results,
        hasMore: result.has_more,
        nextCursor: result.next_cursor,
      });
    } catch (error: any) {
      console.error("Error querying Notion database:", error);
      res.status(500).json({ error: error.message || "Failed to query database" });
    }
  });

  // Search Notion
  app.post('/api/integrations/notion/search', isAuthenticated, async (req: any, res) => {
    try {
      const searchSchema = z.object({
        query: z.string(),
      });

      const parsed = searchSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid request data",
          details: parsed.error.flatten().fieldErrors 
        });
      }

      const { query } = parsed.data;
      const { searchNotion } = await import('./integrations/notion');
      
      const result = await searchNotion(query);

      res.json({
        success: true,
        results: result.results,
      });
    } catch (error: any) {
      console.error("Error searching Notion:", error);
      res.status(500).json({ error: error.message || "Failed to search" });
    }
  });

  // Test Notion integration
  app.post('/api/integrations/notion/test', isAuthenticated, async (req: any, res) => {
    try {
      const { listNotionDatabases } = await import('./integrations/notion');
      const result = await listNotionDatabases();
      
      res.json({
        success: true,
        message: `Found ${result.results.length} databases in your Notion workspace`,
        databaseCount: result.results.length,
      });
    } catch (error: any) {
      console.error("Error testing Notion connection:", error);
      res.status(500).json({ error: error.message || "Failed to test Notion connection" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
