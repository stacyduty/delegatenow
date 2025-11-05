export interface IntegrationMetadata {
  id: string;
  name: string;
  description: string;
  category: "communication" | "productivity" | "crm" | "storage" | "automation";
  logoUrl: string;
  isPremium: boolean; // PRO-only integrations
  status: "active" | "beta" | "coming_soon";
  authType: "oauth2" | "api_key" | "webhook";
  authUrl?: string;
  scopes?: string[];
  documentationUrl?: string;
}

export const INTEGRATION_REGISTRY: Record<string, IntegrationMetadata> = {
  slack: {
    id: "slack",
    name: "Slack",
    description: "Post task updates to Slack channels and create tasks from Slack messages",
    category: "communication",
    logoUrl: "https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg",
    isPremium: false,
    status: "active",
    authType: "oauth2",
    authUrl: "https://slack.com/oauth/v2/authorize",
    scopes: ["chat:write", "channels:read", "commands", "users:read"],
    documentationUrl: "https://api.slack.com/docs",
  },

  gmail: {
    id: "gmail",
    name: "Gmail",
    description: "Auto-create tasks from labeled emails and send task updates via email",
    category: "communication",
    logoUrl: "https://cdn.worldvectorlogo.com/logos/gmail-icon.svg",
    isPremium: false,
    status: "coming_soon",
    authType: "oauth2",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.send"],
  },

  google_drive: {
    id: "google_drive",
    name: "Google Drive",
    description: "Attach Drive files to tasks and auto-save task exports to Drive folders",
    category: "storage",
    logoUrl: "https://cdn.worldvectorlogo.com/logos/google-drive-2020.svg",
    isPremium: false,
    status: "coming_soon",
    authType: "oauth2",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  },

  microsoft_teams: {
    id: "microsoft_teams",
    name: "Microsoft Teams",
    description: "Post to Teams channels and create tasks from Teams messages",
    category: "communication",
    logoUrl: "https://cdn.worldvectorlogo.com/logos/microsoft-teams.svg",
    isPremium: false,
    status: "coming_soon",
    authType: "oauth2",
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    scopes: ["ChannelMessage.Send", "Team.ReadBasic.All"],
  },

  trello: {
    id: "trello",
    name: "Trello",
    description: "One-click import Trello boards and convert cards to delegated tasks",
    category: "productivity",
    logoUrl: "https://cdn.worldvectorlogo.com/logos/trello.svg",
    isPremium: false,
    status: "coming_soon",
    authType: "oauth2",
    authUrl: "https://trello.com/1/authorize",
    scopes: ["read", "write"],
  },

  todoist: {
    id: "todoist",
    name: "Todoist",
    description: "Import Todoist tasks as delegation templates and two-way sync personal tasks",
    category: "productivity",
    logoUrl: "https://cdn.worldvectorlogo.com/logos/todoist-icon.svg",
    isPremium: false,
    status: "coming_soon",
    authType: "oauth2",
    authUrl: "https://todoist.com/oauth/authorize",
    scopes: ["data:read_write"],
  },

  notion: {
    id: "notion",
    name: "Notion",
    description: "Sync tasks to Notion databases and use Notion as knowledge base for task context",
    category: "productivity",
    logoUrl: "https://cdn.worldvectorlogo.com/logos/notion-logo-1.svg",
    isPremium: false,
    status: "coming_soon",
    authType: "oauth2",
    authUrl: "https://api.notion.com/v1/oauth/authorize",
    scopes: ["read_content", "update_content"],
  },

  discord: {
    id: "discord",
    name: "Discord",
    description: "Send task notifications to Discord servers and use bot commands for task creation",
    category: "communication",
    logoUrl: "https://cdn.worldvectorlogo.com/logos/discord-6.svg",
    isPremium: false,
    status: "coming_soon",
    authType: "oauth2",
    authUrl: "https://discord.com/api/oauth2/authorize",
    scopes: ["bot", "messages.read", "messages.write"],
  },

  telegram: {
    id: "telegram",
    name: "Telegram",
    description: "Personal task reminders and voice-to-task via Telegram voice messages",
    category: "communication",
    logoUrl: "https://cdn.worldvectorlogo.com/logos/telegram-1.svg",
    isPremium: false,
    status: "coming_soon",
    authType: "api_key",
  },

  zapier: {
    id: "zapier",
    name: "Zapier",
    description: "Connect to 6,000+ apps via Zapier workflows (requires PRO plan for custom webhooks)",
    category: "automation",
    logoUrl: "https://cdn.worldvectorlogo.com/logos/zapier.svg",
    isPremium: true,
    status: "active",
    authType: "webhook",
    documentationUrl: "https://zapier.com/apps/deleg8te/integrations",
  },

  make: {
    id: "make",
    name: "Make",
    description: "Visual automation platform for 1,500+ apps (requires PRO plan for custom webhooks)",
    category: "automation",
    logoUrl: "https://www.make.com/en/brand-assets/make-logo.svg",
    isPremium: true,
    status: "active",
    authType: "webhook",
    documentationUrl: "https://make.com/en/integrations/deleg8te",
  },
};

export function getIntegration(id: string): IntegrationMetadata | undefined {
  return INTEGRATION_REGISTRY[id];
}

export function getActiveIntegrations(): IntegrationMetadata[] {
  return Object.values(INTEGRATION_REGISTRY).filter((integration) => integration.status === "active");
}

export function getAllIntegrations(): IntegrationMetadata[] {
  return Object.values(INTEGRATION_REGISTRY);
}

export function getIntegrationsByCategory(category: string): IntegrationMetadata[] {
  return Object.values(INTEGRATION_REGISTRY).filter((integration) => integration.category === category);
}
