import crypto from "crypto";
import type { Webhook } from "@shared/schema";

export type EventType =
  | "task.created"
  | "task.updated"
  | "task.completed"
  | "task.assigned"
  | "task.delegated"
  | "team_member.added"
  | "notification.sent";

export interface IntegrationEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  userId: string;
  data: any;
}

function generateEventId(): string {
  return `evt_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
}

function generateHMAC(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

async function sendWebhook(webhook: Webhook, event: IntegrationEvent): Promise<void> {
  try {
    const payload = JSON.stringify(event);
    const signature = generateHMAC(payload, webhook.secret);

    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Deleg8te-Signature": `sha256=${signature}`,
        "X-Deleg8te-Event": event.type,
        "User-Agent": "Deleg8te-Webhooks/1.0",
      },
      body: payload,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(`Webhook ${webhook.id} failed:`, response.status, await response.text());
      // Note: Could increment failureCount in database here
    }
  } catch (error) {
    console.error(`Webhook ${webhook.id} error:`, error);
    // Note: Could increment failureCount in database here
  }
}

export async function emitEvent(
  type: EventType,
  data: any,
  userId: string,
  storage: any // IStorage interface
): Promise<void> {
  const event: IntegrationEvent = {
    id: generateEventId(),
    type,
    timestamp: new Date(),
    userId,
    data,
  };

  console.log(`[Event] ${type}:`, event.id);

  // Get user's configured webhooks
  try {
    const webhooks = await storage.getWebhooksByUser(userId);
    const activeWebhooks = webhooks.filter(
      (webhook: Webhook) => webhook.enabled && webhook.events.includes(type)
    );

    // Send to all matching webhooks asynchronously (don't block main flow)
    for (const webhook of activeWebhooks) {
      sendWebhook(webhook, event).catch(console.error);
    }

    // Execute automation rules (PRO feature)
    const automationRules = await storage.getAutomationRulesByUser(userId);
    const activeRules = automationRules.filter(
      (rule: any) => rule.enabled && rule.trigger.event === type
    );

    for (const rule of activeRules) {
      executeAutomationRule(rule, event, storage).catch(console.error);
    }
  } catch (error) {
    console.error("Error emitting event:", error);
  }
}

async function executeAutomationRule(
  rule: any,
  event: IntegrationEvent,
  storage: any
): Promise<void> {
  console.log(`[Automation] Executing rule: ${rule.name}`);

  // Check conditions
  const conditions = rule.trigger.conditions || [];
  for (const condition of conditions) {
    if (!evaluateCondition(condition, event.data)) {
      console.log(`[Automation] Rule ${rule.name} condition not met`);
      return;
    }
  }

  // Execute actions
  for (const action of rule.actions) {
    try {
      await executeAction(action, event, storage);
    } catch (error) {
      console.error(`[Automation] Action failed:`, error);
    }
  }

  // Update execution count
  await storage.updateAutomationRule(rule.id, {
    executionCount: rule.executionCount + 1,
    lastExecutedAt: new Date(),
  });
}

function evaluateCondition(condition: any, data: any): boolean {
  const { field, operator, value } = condition;
  const fieldValue = getNestedProperty(data, field);

  switch (operator) {
    case "equals":
      return fieldValue === value;
    case "not_equals":
      return fieldValue !== value;
    case "contains":
      return String(fieldValue).includes(value);
    case "greater_than":
      return Number(fieldValue) > Number(value);
    case "less_than":
      return Number(fieldValue) < Number(value);
    default:
      return false;
  }
}

function getNestedProperty(obj: any, path: string): any {
  return path.split(".").reduce((current, prop) => current?.[prop], obj);
}

async function executeAction(action: any, event: IntegrationEvent, storage: any): Promise<void> {
  switch (action.type) {
    case "slack_notify":
      // Will be implemented with Slack integration
      console.log("[Automation] Slack notification (not yet implemented)");
      break;

    case "reassign_task":
      if (event.type === "task.created" || event.type === "task.assigned") {
        const { teamMemberId } = action.config;
        await storage.updateTask(event.data.task.id, { teamMemberId });
        console.log(`[Automation] Reassigned task to ${teamMemberId}`);
      }
      break;

    case "update_status":
      if (event.type.startsWith("task.")) {
        const { status } = action.config;
        await storage.updateTask(event.data.task.id, { status });
        console.log(`[Automation] Updated task status to ${status}`);
      }
      break;

    case "send_notification":
      const { userId, message } = action.config;
      await storage.createNotification({
        userId: userId || event.userId,
        type: "automation",
        title: "Automation Trigger",
        message,
        link: `/tasks/${event.data.task?.id || ""}`,
        isRead: false,
      });
      console.log(`[Automation] Sent notification`);
      break;

    default:
      console.log(`[Automation] Unknown action type: ${action.type}`);
  }
}
