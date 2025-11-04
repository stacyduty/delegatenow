import { db } from "./db";
import { 
  type User, type InsertUser, type UpsertUser,
  type TeamMember, type InsertTeamMember,
  type Task, type InsertTask,
  type Notification, type InsertNotification,
  type VoiceHistory, type InsertVoiceHistory,
  type CalendarEvent, type InsertCalendarEvent,
  type EmailInbox, type InsertEmailInbox,
  type Comment, type InsertComment,
  type Attachment, type InsertAttachment,
  type Subtask, type InsertSubtask,
  type Tag, type InsertTag,
  type TaskTag, type InsertTaskTag,
  type ActivityLog, type InsertActivityLog,
  type TaskWatcher, type InsertTaskWatcher,
  type TaskTemplate, type InsertTaskTemplate,
  type RecurringTaskPattern, type InsertRecurringTaskPattern,
  users, teamMembers, tasks, notifications, voiceHistory, calendarEvents, emailInbox,
  comments, attachments, subtasks, tags, taskTags, activityLog, taskWatchers, taskTemplates, recurringTaskPatterns
} from "@shared/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Team member operations
  getTeamMembers(userId: string): Promise<TeamMember[]>;
  getTeamMember(id: string): Promise<TeamMember | undefined>;
  getTeamMemberByEmail(email: string): Promise<TeamMember | undefined>;
  getTeamMemberByInvitationToken(token: string): Promise<TeamMember | undefined>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: string, member: Partial<TeamMember>): Promise<TeamMember | undefined>;
  deleteTeamMember(id: string): Promise<void>;
  
  // Task operations
  getTasks(userId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;
  
  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  
  // Voice history operations
  getVoiceHistory(userId: string): Promise<VoiceHistory[]>;
  createVoiceHistory(history: InsertVoiceHistory): Promise<VoiceHistory>;
  
  // Calendar event operations
  getCalendarEvents(userId: string): Promise<CalendarEvent[]>;
  getCalendarEvent(id: string): Promise<CalendarEvent | undefined>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  deleteCalendarEvent(id: string): Promise<void>;
  
  // Email inbox operations
  getEmailInbox(userId: string): Promise<EmailInbox[]>;
  getEmailByMessageId(messageId: string): Promise<EmailInbox | undefined>;
  createEmail(email: InsertEmailInbox): Promise<EmailInbox>;
  updateEmail(id: string, email: Partial<EmailInbox>): Promise<EmailInbox | undefined>;
  
  // TIER 1: Comment operations
  getComments(taskId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: string, comment: Partial<Comment>): Promise<Comment | undefined>;
  deleteComment(id: string): Promise<void>;
  
  // TIER 1: Attachment operations
  getAttachments(taskId: string): Promise<Attachment[]>;
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  deleteAttachment(id: string): Promise<void>;
  
  // TIER 1: Subtask operations
  getSubtasks(taskId: string): Promise<Subtask[]>;
  createSubtask(subtask: InsertSubtask): Promise<Subtask>;
  updateSubtask(id: string, subtask: Partial<Subtask>): Promise<Subtask | undefined>;
  deleteSubtask(id: string): Promise<void>;
  toggleSubtask(id: string): Promise<Subtask | undefined>;
  
  // TIER 2: Tag operations
  getTags(userId: string): Promise<Tag[]>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTag(id: string, tag: Partial<Tag>): Promise<Tag | undefined>;
  deleteTag(id: string): Promise<void>;
  
  // TIER 2: Task-Tag operations
  getTaskTags(taskId: string): Promise<Tag[]>;
  addTaskTag(taskTag: InsertTaskTag): Promise<void>;
  removeTaskTag(taskId: string, tagId: string): Promise<void>;
  
  // TIER 2: Activity Log operations
  getActivityLog(taskId: string): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  // TIER 2: Task Watcher operations
  getTaskWatchers(taskId: string): Promise<TaskWatcher[]>;
  addTaskWatcher(watcher: InsertTaskWatcher): Promise<void>;
  removeTaskWatcher(taskId: string, userId?: string, teamMemberId?: string): Promise<void>;
  
  // TIER 3: Task Template operations
  getTaskTemplates(userId: string): Promise<TaskTemplate[]>;
  getTaskTemplate(id: string): Promise<TaskTemplate | undefined>;
  createTaskTemplate(template: InsertTaskTemplate): Promise<TaskTemplate>;
  updateTaskTemplate(id: string, template: Partial<TaskTemplate>): Promise<TaskTemplate | undefined>;
  deleteTaskTemplate(id: string): Promise<void>;
  
  // TIER 3: Recurring Task Pattern operations
  getRecurringTaskPatterns(userId: string): Promise<RecurringTaskPattern[]>;
  getRecurringTaskPattern(taskId: string): Promise<RecurringTaskPattern | undefined>;
  createRecurringTaskPattern(pattern: InsertRecurringTaskPattern): Promise<RecurringTaskPattern>;
  updateRecurringTaskPattern(id: string, pattern: Partial<RecurringTaskPattern>): Promise<RecurringTaskPattern | undefined>;
  deleteRecurringTaskPattern(id: string): Promise<void>;
}

export class DbStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email!)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, user: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Team member operations
  async getTeamMembers(userId: string): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).where(eq(teamMembers.userId, userId));
  }

  async getTeamMember(id: string): Promise<TeamMember | undefined> {
    const result = await db.select().from(teamMembers).where(eq(teamMembers.id, id)).limit(1);
    return result[0];
  }

  async getTeamMemberByEmail(email: string): Promise<TeamMember | undefined> {
    const result = await db.select().from(teamMembers).where(eq(teamMembers.email, email)).limit(1);
    return result[0];
  }

  async getTeamMemberByInvitationToken(token: string): Promise<TeamMember | undefined> {
    const result = await db.select().from(teamMembers).where(eq(teamMembers.invitationToken, token)).limit(1);
    return result[0];
  }

  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const result = await db.insert(teamMembers).values(member).returning();
    return result[0];
  }

  async updateTeamMember(id: string, member: Partial<TeamMember>): Promise<TeamMember | undefined> {
    const result = await db.update(teamMembers).set(member).where(eq(teamMembers.id, id)).returning();
    return result[0];
  }

  async deleteTeamMember(id: string): Promise<void> {
    await db.delete(teamMembers).where(eq(teamMembers.id, id));
  }

  // Task operations
  async getTasks(userId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    return result[0];
  }

  async createTask(task: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values(task).returning();
    return result[0];
  }

  async updateTask(id: string, task: Partial<Task>): Promise<Task | undefined> {
    const result = await db.update(tasks).set({ ...task, updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
    return result[0];
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notification).returning();
    return result[0];
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  // Voice history operations
  async getVoiceHistory(userId: string): Promise<VoiceHistory[]> {
    return await db.select().from(voiceHistory).where(eq(voiceHistory.userId, userId)).orderBy(desc(voiceHistory.createdAt));
  }

  async createVoiceHistory(history: InsertVoiceHistory): Promise<VoiceHistory> {
    const result = await db.insert(voiceHistory).values(history).returning();
    return result[0];
  }

  // Calendar event operations
  async getCalendarEvents(userId: string): Promise<CalendarEvent[]> {
    return await db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId)).orderBy(desc(calendarEvents.startTime));
  }

  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    const result = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id)).limit(1);
    return result[0];
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const result = await db.insert(calendarEvents).values(event).returning();
    return result[0];
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  }

  // Email inbox operations
  async getEmailInbox(userId: string): Promise<EmailInbox[]> {
    return await db.select().from(emailInbox).where(eq(emailInbox.userId, userId)).orderBy(desc(emailInbox.receivedAt));
  }

  async getEmailByMessageId(messageId: string): Promise<EmailInbox | undefined> {
    const result = await db.select().from(emailInbox).where(eq(emailInbox.messageId, messageId)).limit(1);
    return result[0];
  }

  async createEmail(email: InsertEmailInbox): Promise<EmailInbox> {
    const result = await db.insert(emailInbox).values(email).returning();
    return result[0];
  }

  async updateEmail(id: string, email: Partial<EmailInbox>): Promise<EmailInbox | undefined> {
    const result = await db.update(emailInbox).set(email).where(eq(emailInbox.id, id)).returning();
    return result[0];
  }

  // TIER 1: Comment operations
  async getComment(id: string): Promise<Comment | undefined> {
    const result = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
    return result[0];
  }

  async getComments(taskId: string): Promise<Comment[]> {
    return await db.select().from(comments).where(eq(comments.taskId, taskId)).orderBy(comments.createdAt);
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values(comment).returning();
    return result[0];
  }

  async updateComment(id: string, comment: Partial<Comment>): Promise<Comment | undefined> {
    const result = await db.update(comments).set({ ...comment, updatedAt: new Date() }).where(eq(comments.id, id)).returning();
    return result[0];
  }

  async deleteComment(id: string): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  // TIER 1: Attachment operations
  async getAttachment(id: string): Promise<Attachment | undefined> {
    const result = await db.select().from(attachments).where(eq(attachments.id, id)).limit(1);
    return result[0];
  }

  async getAttachments(taskId: string): Promise<Attachment[]> {
    return await db.select().from(attachments).where(eq(attachments.taskId, taskId)).orderBy(attachments.createdAt);
  }

  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    const result = await db.insert(attachments).values(attachment).returning();
    return result[0];
  }

  async deleteAttachment(id: string): Promise<void> {
    await db.delete(attachments).where(eq(attachments.id, id));
  }

  // TIER 1: Subtask operations
  async getSubtask(id: string): Promise<Subtask | undefined> {
    const result = await db.select().from(subtasks).where(eq(subtasks.id, id)).limit(1);
    return result[0];
  }

  async getSubtasks(taskId: string): Promise<Subtask[]> {
    return await db.select().from(subtasks).where(eq(subtasks.taskId, taskId)).orderBy(subtasks.order, subtasks.createdAt);
  }

  async createSubtask(subtask: InsertSubtask): Promise<Subtask> {
    const result = await db.insert(subtasks).values(subtask).returning();
    return result[0];
  }

  async updateSubtask(id: string, subtask: Partial<Subtask>): Promise<Subtask | undefined> {
    const result = await db.update(subtasks).set(subtask).where(eq(subtasks.id, id)).returning();
    return result[0];
  }

  async deleteSubtask(id: string): Promise<void> {
    await db.delete(subtasks).where(eq(subtasks.id, id));
  }

  async toggleSubtask(id: string): Promise<Subtask | undefined> {
    const subtask = await db.select().from(subtasks).where(eq(subtasks.id, id)).limit(1).then(r => r[0]);
    if (!subtask) return undefined;
    const result = await db.update(subtasks).set({ 
      completed: !subtask.completed,
      completedAt: !subtask.completed ? new Date() : null
    }).where(eq(subtasks.id, id)).returning();
    return result[0];
  }

  // TIER 2: Tag operations
  async getTags(userId: string): Promise<Tag[]> {
    return await db.select().from(tags).where(eq(tags.userId, userId)).orderBy(tags.name);
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const result = await db.insert(tags).values(tag).returning();
    return result[0];
  }

  async updateTag(id: string, tag: Partial<Tag>): Promise<Tag | undefined> {
    const result = await db.update(tags).set(tag).where(eq(tags.id, id)).returning();
    return result[0];
  }

  async deleteTag(id: string): Promise<void> {
    await db.delete(tags).where(eq(tags.id, id));
  }

  // TIER 2: Task-Tag operations
  async getTaskTags(taskId: string): Promise<Tag[]> {
    const result = await db
      .select({ tag: tags })
      .from(taskTags)
      .innerJoin(tags, eq(taskTags.tagId, tags.id))
      .where(eq(taskTags.taskId, taskId));
    return result.map(r => r.tag);
  }

  async addTaskTag(taskTag: InsertTaskTag): Promise<void> {
    await db.insert(taskTags).values(taskTag).onConflictDoNothing();
  }

  async removeTaskTag(taskId: string, tagId: string): Promise<void> {
    await db.delete(taskTags).where(and(eq(taskTags.taskId, taskId), eq(taskTags.tagId, tagId)));
  }

  // TIER 2: Activity Log operations
  async getActivityLog(taskId: string): Promise<ActivityLog[]> {
    return await db.select().from(activityLog).where(eq(activityLog.taskId, taskId)).orderBy(desc(activityLog.createdAt));
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const result = await db.insert(activityLog).values(log).returning();
    return result[0];
  }

  // TIER 2: Task Watcher operations
  async getTaskWatchers(taskId: string): Promise<TaskWatcher[]> {
    return await db.select().from(taskWatchers).where(eq(taskWatchers.taskId, taskId));
  }

  async addTaskWatcher(watcher: InsertTaskWatcher): Promise<void> {
    await db.insert(taskWatchers).values(watcher).onConflictDoNothing();
  }

  async removeTaskWatcher(taskId: string, userId?: string, teamMemberId?: string): Promise<void> {
    if (userId) {
      await db.delete(taskWatchers).where(and(eq(taskWatchers.taskId, taskId), eq(taskWatchers.userId, userId)));
    } else if (teamMemberId) {
      await db.delete(taskWatchers).where(and(eq(taskWatchers.taskId, taskId), eq(taskWatchers.teamMemberId, teamMemberId)));
    }
  }

  // TIER 3: Task Template operations
  async getTaskTemplates(userId: string): Promise<TaskTemplate[]> {
    return await db.select().from(taskTemplates).where(eq(taskTemplates.userId, userId)).orderBy(taskTemplates.name);
  }

  async getTaskTemplate(id: string): Promise<TaskTemplate | undefined> {
    const result = await db.select().from(taskTemplates).where(eq(taskTemplates.id, id)).limit(1);
    return result[0];
  }

  async createTaskTemplate(template: InsertTaskTemplate): Promise<TaskTemplate> {
    const result = await db.insert(taskTemplates).values(template).returning();
    return result[0];
  }

  async updateTaskTemplate(id: string, template: Partial<TaskTemplate>): Promise<TaskTemplate | undefined> {
    const result = await db.update(taskTemplates).set(template).where(eq(taskTemplates.id, id)).returning();
    return result[0];
  }

  async deleteTaskTemplate(id: string): Promise<void> {
    await db.delete(taskTemplates).where(eq(taskTemplates.id, id));
  }

  // TIER 3: Recurring Task Pattern operations
  async getRecurringTaskPatterns(userId: string): Promise<RecurringTaskPattern[]> {
    const userTasks = await this.getTasks(userId);
    const taskIds = userTasks.map(t => t.id);
    if (taskIds.length === 0) return [];
    return await db.select().from(recurringTaskPatterns).where(inArray(recurringTaskPatterns.taskId, taskIds));
  }

  async getRecurringTaskPattern(taskId: string): Promise<RecurringTaskPattern | undefined> {
    const result = await db.select().from(recurringTaskPatterns).where(eq(recurringTaskPatterns.taskId, taskId)).limit(1);
    return result[0];
  }

  async createRecurringTaskPattern(pattern: InsertRecurringTaskPattern): Promise<RecurringTaskPattern> {
    const result = await db.insert(recurringTaskPatterns).values(pattern).returning();
    return result[0];
  }

  async updateRecurringTaskPattern(id: string, pattern: Partial<RecurringTaskPattern>): Promise<RecurringTaskPattern | undefined> {
    const result = await db.update(recurringTaskPatterns).set(pattern).where(eq(recurringTaskPatterns.id, id)).returning();
    return result[0];
  }

  async deleteRecurringTaskPattern(id: string): Promise<void> {
    await db.delete(recurringTaskPatterns).where(eq(recurringTaskPatterns.id, id));
  }
}

export const storage = new DbStorage();
