import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { analyzeVoiceTask } from "./openai";
import {
  insertTaskSchema,
  insertTeamMemberSchema,
  insertNotificationSchema,
  insertVoiceHistorySchema,
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
if (!process.env.STRIPE_PRICE_ID) {
  throw new Error('Missing required Stripe secret: STRIPE_PRICE_ID');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

  // Create task manually (without AI analysis)
  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        userId: userId,
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
      const updates = validatedUpdates;
      
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

  const httpServer = createServer(app);

  return httpServer;
}
