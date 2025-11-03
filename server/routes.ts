import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeVoiceTask } from "./openai";
import {
  insertTaskSchema,
  insertTeamMemberSchema,
  insertNotificationSchema,
  insertVoiceHistorySchema,
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Simple middleware to ensure demo user exists (temporary until proper auth is implemented)
async function ensureDemoUser(req: any, res: any, next: any) {
  try {
    let user = await storage.getUserByEmail("demo@weighpay.com");
    if (!user) {
      user = await storage.createUser({
        username: "demo",
        email: "demo@weighpay.com",
        password: "demo", // In production, this would be hashed
      });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Error ensuring demo user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply demo user middleware to all API routes
  app.use("/api", ensureDemoUser);

  // ============ TASK ROUTES ============
  
  // Get all tasks for the user
  app.get("/api/tasks", async (req: any, res) => {
    try {
      const tasks = await storage.getTasks(req.user.id);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  // Get a single task
  app.get("/api/tasks/:id", async (req: any, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task || task.userId !== req.user.id) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });

  // Create task with AI analysis from voice transcript
  app.post("/api/tasks/analyze", async (req: any, res) => {
    try {
      const { transcript } = req.body;
      if (!transcript) {
        return res.status(400).json({ error: "Transcript is required" });
      }

      // Get team members for AI to suggest assignee
      const teamMembers = await storage.getTeamMembers(req.user.id);
      const teamMemberNames = teamMembers.map(tm => tm.name);

      // Analyze task with AI
      const startTime = Date.now();
      const analysis = await analyzeVoiceTask(transcript, teamMemberNames);
      const processingTime = Date.now() - startTime;

      // Find suggested team member
      let suggestedTeamMember = null;
      if (analysis.suggestedAssignee) {
        suggestedTeamMember = teamMembers.find(
          tm => tm.name.toLowerCase() === analysis.suggestedAssignee?.toLowerCase()
        );
      }

      // Create the task
      const task = await storage.createTask({
        userId: req.user.id,
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

      // Record voice history
      await storage.createVoiceHistory({
        userId: req.user.id,
        taskId: task.id,
        transcript,
        processingTime,
        success: true,
      });

      // Create notification if assigned to team member
      if (suggestedTeamMember) {
        await storage.createNotification({
          userId: req.user.id,
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
      console.error("Error analyzing task:", error);
      res.status(500).json({ error: "Failed to analyze task" });
    }
  });

  // Create task manually (without AI analysis)
  app.post("/api/tasks", async (req: any, res) => {
    try {
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        userId: req.user.id,
      });

      const task = await storage.createTask(validatedData);

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
  app.patch("/api/tasks/:id", async (req: any, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task || task.userId !== req.user.id) {
        return res.status(404).json({ error: "Task not found" });
      }

      const updates = req.body;
      
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
              userId: req.user.id,
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
          userId: req.user.id,
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
  app.delete("/api/tasks/:id", async (req: any, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task || task.userId !== req.user.id) {
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

  // ============ TEAM MEMBER ROUTES ============

  // Get all team members
  app.get("/api/team-members", async (req: any, res) => {
    try {
      const members = await storage.getTeamMembers(req.user.id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  // Get single team member
  app.get("/api/team-members/:id", async (req: any, res) => {
    try {
      const member = await storage.getTeamMember(req.params.id);
      if (!member || member.userId !== req.user.id) {
        return res.status(404).json({ error: "Team member not found" });
      }
      res.json(member);
    } catch (error) {
      console.error("Error fetching team member:", error);
      res.status(500).json({ error: "Failed to fetch team member" });
    }
  });

  // Create team member
  app.post("/api/team-members", async (req: any, res) => {
    try {
      const validatedData = insertTeamMemberSchema.parse({
        ...req.body,
        userId: req.user.id,
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
  app.patch("/api/team-members/:id", async (req: any, res) => {
    try {
      const member = await storage.getTeamMember(req.params.id);
      if (!member || member.userId !== req.user.id) {
        return res.status(404).json({ error: "Team member not found" });
      }

      const updatedMember = await storage.updateTeamMember(req.params.id, req.body);
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating team member:", error);
      res.status(500).json({ error: "Failed to update team member" });
    }
  });

  // Delete team member
  app.delete("/api/team-members/:id", async (req: any, res) => {
    try {
      const member = await storage.getTeamMember(req.params.id);
      if (!member || member.userId !== req.user.id) {
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
  app.get("/api/notifications", async (req: any, res) => {
    try {
      const notifications = await storage.getNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", async (req: any, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/read-all", async (req: any, res) => {
    try {
      await storage.markAllNotificationsRead(req.user.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  // ============ VOICE HISTORY ROUTES ============

  // Get voice history
  app.get("/api/voice-history", async (req: any, res) => {
    try {
      const history = await storage.getVoiceHistory(req.user.id);
      res.json(history);
    } catch (error) {
      console.error("Error fetching voice history:", error);
      res.status(500).json({ error: "Failed to fetch voice history" });
    }
  });

  // ============ USER/SUBSCRIPTION ROUTES ============

  // Get current user
  app.get("/api/user", async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Get dashboard stats
  app.get("/api/dashboard/stats", async (req: any, res) => {
    try {
      const tasks = await storage.getTasks(req.user.id);
      const teamMembers = await storage.getTeamMembers(req.user.id);

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

  const httpServer = createServer(app);

  return httpServer;
}
