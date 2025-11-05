import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, index, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - executives who own the account (Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionStatus: text("subscription_status").default("inactive"), // inactive, active, cancelled, trialing
  subscriptionId: text("subscription_id"),
  subscriptionTier: text("subscription_tier").default("executive"), // executive ($1/mo), pro ($3/mo), enterprise ($9/mo)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  stripeCustomerId: true,
  subscriptionStatus: true,
  subscriptionId: true,
  subscriptionTier: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

// Team members - unlimited for Executive Plan subscribers
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull(), // Job role/title (e.g., "Marketing Manager", "Software Engineer")
  avatar: text("avatar"),
  
  // Authentication fields
  passwordHash: text("password_hash"), // bcrypt hash
  invitationStatus: text("invitation_status").default("pending"), // pending, accepted, declined
  invitationToken: text("invitation_token"), // Secure token for email invitation
  invitedAt: timestamp("invited_at"),
  acceptedAt: timestamp("accepted_at"),
  lastLoginAt: timestamp("last_login_at"),
  
  // Permissions
  accountType: text("account_type").default("team_member"), // team_member (limited access) vs executive (full access)
  
  // Performance tracking
  activeTasks: integer("active_tasks").default(0),
  completedTasks: integer("completed_tasks").default(0),
  completionRate: integer("completion_rate").default(0), // percentage
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  passwordHash: true,
  invitationStatus: true,
  invitationToken: true,
  invitedAt: true,
  acceptedAt: true,
  lastLoginAt: true,
  accountType: true,
  activeTasks: true,
  completedTasks: true,
  completionRate: true,
  createdAt: true,
});

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

// Tasks - voice-delegated with AI analysis
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  teamMemberId: varchar("team_member_id").references(() => teamMembers.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  voiceTranscript: text("voice_transcript"),
  
  // AI-generated fields
  impact: text("impact").notNull(), // low, medium, high
  urgency: text("urgency").notNull(), // low, medium, high
  aiAnalysis: text("ai_analysis"), // JSON string with SMART breakdown
  suggestedAssignee: text("suggested_assignee"),
  
  // Status tracking
  status: text("status").notNull().default("delegated"), // delegated, in_progress, review, completed
  progress: integer("progress").default(0), // 0-100
  
  // Compliance & Governance fields
  acceptedAt: timestamp("accepted_at"), // Formal acceptance timestamp for audit trail
  expiryDate: timestamp("expiry_date"), // When delegation authority expires
  spendingLimit: numeric("spending_limit", { precision: 15, scale: 2 }), // Optional financial authority cap
  
  // Dates
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// Notifications - in-app alerts for team communication
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  taskId: varchar("task_id").references(() => tasks.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // task_assigned, task_updated, task_completed, team_message
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Voice history - tracking all voice delegations
export const voiceHistory = pgTable("voice_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  taskId: varchar("task_id").references(() => tasks.id, { onDelete: "set null" }),
  transcript: text("transcript").notNull(),
  processingTime: integer("processing_time"), // milliseconds
  success: boolean("success").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVoiceHistorySchema = createInsertSchema(voiceHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertVoiceHistory = z.infer<typeof insertVoiceHistorySchema>;
export type VoiceHistory = typeof voiceHistory.$inferSelect;

// Calendar Events - synced from Google Calendar
export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  taskId: varchar("task_id").references(() => tasks.id, { onDelete: "set null" }),
  googleEventId: text("google_event_id").unique(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  attendees: text("attendees").array(),
  location: text("location"),
  status: text("status").default("confirmed"), // confirmed, tentative, cancelled
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;

// Email inbox - tracking emails that create tasks
export const emailInbox = pgTable("email_inbox", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  taskId: varchar("task_id").references(() => tasks.id, { onDelete: "set null" }),
  
  // Email metadata
  messageId: text("message_id").unique(), // Email provider's message ID for deduplication
  from: text("from").notNull(), // Sender email address
  fromName: text("from_name"), // Sender display name
  subject: text("subject").notNull(),
  bodyText: text("body_text"), // Plain text body
  bodyHtml: text("body_html"), // HTML body
  receivedAt: timestamp("received_at").notNull(),
  
  // Processing status
  status: text("status").default("pending"), // pending, processed, failed, ignored
  processedAt: timestamp("processed_at"),
  errorMessage: text("error_message"),
  
  // AI extraction results
  extractedTask: jsonb("extracted_task"), // Structured task data from AI
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmailInboxSchema = createInsertSchema(emailInbox).omit({
  id: true,
  createdAt: true,
});

export type InsertEmailInbox = z.infer<typeof insertEmailInboxSchema>;
export type EmailInbox = typeof emailInbox.$inferSelect;

// TIER 1: Comments - discussion threads on tasks
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  teamMemberId: varchar("team_member_id").references(() => teamMembers.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  mentions: text("mentions").array(), // Array of mentioned user/team member IDs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

// TIER 1: Attachments - file uploads on tasks
export const attachments = pgTable("attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  teamMemberId: varchar("team_member_id").references(() => teamMembers.id, { onDelete: "set null" }),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(), // bytes
  fileType: text("file_type").notNull(), // MIME type
  objectPath: text("object_path").notNull(), // Path in object storage
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAttachmentSchema = createInsertSchema(attachments).omit({
  id: true,
  createdAt: true,
});

export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Attachment = typeof attachments.$inferSelect;

// TIER 1: Subtasks - checklist items for breaking down tasks
export const subtasks = pgTable("subtasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completed: boolean("completed").default(false),
  order: integer("order").notNull().default(0), // For manual ordering
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertSubtaskSchema = createInsertSchema(subtasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertSubtask = z.infer<typeof insertSubtaskSchema>;
export type Subtask = typeof subtasks.$inferSelect;

// TIER 2: Tags - custom labels for task categorization
export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").default("#3b82f6"), // Hex color code
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
});

export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;

// TIER 2: Task-Tags junction table (many-to-many)
export const taskTags = pgTable("task_tags", {
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  tagId: varchar("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskTagSchema = createInsertSchema(taskTags).omit({
  createdAt: true,
});

export type InsertTaskTag = z.infer<typeof insertTaskTagSchema>;
export type TaskTag = typeof taskTags.$inferSelect;

// TIER 2: Activity Log - per-task change history
export const activityLog = pgTable("activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  teamMemberId: varchar("team_member_id").references(() => teamMembers.id, { onDelete: "set null" }),
  action: text("action").notNull(), // status_changed, assigned, reassigned, comment_added, attachment_added, etc.
  details: jsonb("details"), // Structured data about the change
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  createdAt: true,
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLog.$inferSelect;

// TIER 2: Task Watchers - follow tasks without being assigned
export const taskWatchers = pgTable("task_watchers", {
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  teamMemberId: varchar("team_member_id").references(() => teamMembers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskWatcherSchema = createInsertSchema(taskWatchers).omit({
  createdAt: true,
});

export type InsertTaskWatcher = z.infer<typeof insertTaskWatcherSchema>;
export type TaskWatcher = typeof taskWatchers.$inferSelect;

// TIER 3: Task Templates - reusable task structures
export const taskTemplates = pgTable("task_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  impact: text("impact").notNull().default("medium"),
  urgency: text("urgency").notNull().default("medium"),
  subtaskTemplates: jsonb("subtask_templates"), // Array of subtask titles
  tagIds: text("tag_ids").array(), // Array of tag IDs
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskTemplateSchema = createInsertSchema(taskTemplates).omit({
  id: true,
  createdAt: true,
});

export type InsertTaskTemplate = z.infer<typeof insertTaskTemplateSchema>;
export type TaskTemplate = typeof taskTemplates.$inferSelect;

// TIER 3: Recurring Tasks - add recurrence fields to tasks
// Note: Using existing tasks table, adding recurrence support via new fields
export const recurringTaskPatterns = pgTable("recurring_task_patterns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }).unique(),
  frequency: text("frequency").notNull(), // daily, weekly, monthly, yearly
  interval: integer("interval").default(1), // Every X days/weeks/months
  daysOfWeek: text("days_of_week").array(), // For weekly: ['monday', 'friday']
  dayOfMonth: integer("day_of_month"), // For monthly: 15 (15th of month)
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"), // null = never ends
  lastGenerated: timestamp("last_generated"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRecurringTaskPatternSchema = createInsertSchema(recurringTaskPatterns).omit({
  id: true,
  lastGenerated: true,
  createdAt: true,
});

export type InsertRecurringTaskPattern = z.infer<typeof insertRecurringTaskPatternSchema>;
export type RecurringTaskPattern = typeof recurringTaskPatterns.$inferSelect;

// ============ INTEGRATION ECOSYSTEM & PRO TIER TABLES ============

// User Integrations - OAuth connections to third-party services
export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  integrationId: varchar("integration_id").notNull(), // 'slack', 'gmail', 'trello', etc.
  credentials: text("credentials"), // Encrypted OAuth tokens/API keys (JSON string)
  settings: jsonb("settings"), // Integration-specific configuration
  status: varchar("status").notNull().default("active"), // active, error, disabled
  lastSyncAt: timestamp("last_sync_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type Integration = typeof integrations.$inferSelect;

// Custom Webhooks - PRO feature for user-configured webhook endpoints
export const webhooks = pgTable("webhooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(), // User-friendly name
  url: varchar("url").notNull(), // Webhook endpoint
  events: text("events").array().notNull(), // ['task.created', 'task.updated', etc.]
  secret: varchar("secret").notNull(), // For HMAC signing
  enabled: boolean("enabled").notNull().default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  failureCount: integer("failure_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWebhookSchema = createInsertSchema(webhooks).omit({
  id: true,
  secret: true, // Generated server-side
  lastTriggeredAt: true,
  failureCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type Webhook = typeof webhooks.$inferSelect;

// API Keys - PRO feature for public API access
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  key: varchar("key").notNull().unique(), // sk_live_... or sk_test_...
  name: varchar("name").notNull(), // User-defined name
  environment: varchar("environment").notNull().default("production"), // production, development
  lastUsedAt: timestamp("last_used_at"),
  requestCount: integer("request_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  key: true, // Generated server-side
  lastUsedAt: true,
  requestCount: true,
  createdAt: true,
});

export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

// Automation Rules - PRO feature for if/then task automation
export const automationRules = pgTable("automation_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  trigger: jsonb("trigger").notNull(), // { event: 'task.created', conditions: [...] }
  actions: jsonb("actions").notNull(), // [{ type: 'slack_notify', config: {...} }, ...]
  enabled: boolean("enabled").notNull().default(true),
  executionCount: integer("execution_count").notNull().default(0),
  lastExecutedAt: timestamp("last_executed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAutomationRuleSchema = createInsertSchema(automationRules).omit({
  id: true,
  executionCount: true,
  lastExecutedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAutomationRule = z.infer<typeof insertAutomationRuleSchema>;
export type AutomationRule = typeof automationRules.$inferSelect;
