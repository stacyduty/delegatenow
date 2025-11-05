import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link2, Link2Off, ExternalLink, CheckCircle2, Zap, MessageSquare, Video, FolderOpen } from "lucide-react";
import { 
  SiSlack, 
  SiGmail, 
  SiGooglemeet, 
  SiGoogledrive,
  SiMicrosoftoutlook,
  SiZendesk,
  SiDropbox,
  SiTwilio,
  SiAsana,
  SiHubspot,
  SiJira,
  SiLinear,
  SiConfluence,
  SiGithub,
  SiNotion,
  SiDiscord,
  SiMicrosoftonedrive,
  SiMicrosoftsharepoint,
  SiTrello,
  SiGooglesheets,
  SiGoogledocs
} from "react-icons/si";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  connected: boolean;
  teamName?: string;
  lastSync?: Date;
  capabilities: string[];
  tier: "free" | "pro";
}

interface SlackStatus {
  connected: boolean;
  status?: string;
  teamName?: string;
  lastSync?: string;
}

interface GmailStatus {
  connected: boolean;
  status?: string;
  emailAddress?: string;
  lastSync?: string;
}

interface GoogleMeetStatus {
  connected: boolean;
  status?: string;
  message?: string;
}

interface GoogleDriveStatus {
  connected: boolean;
  status?: string;
  message?: string;
}

export default function Integrations() {
  const { toast } = useToast();
  const [connectingSlack, setConnectingSlack] = useState(false);
  const [connectingGmail, setConnectingGmail] = useState(false);

  const { data: slackStatus, isFetching: slackFetching, error: slackError, status } = useQuery<SlackStatus>({
    queryKey: ["/api/integrations/slack"],
  });

  const { data: gmailStatus, isFetching: gmailFetching } = useQuery<GmailStatus>({
    queryKey: ["/api/integrations/gmail"],
  });

  const { data: googleMeetStatus, isFetching: googleMeetFetching } = useQuery<GoogleMeetStatus>({
    queryKey: ["/api/integrations/google-meet"],
  });

  const { data: googleDriveStatus, isFetching: googleDriveFetching } = useQuery<GoogleDriveStatus>({
    queryKey: ["/api/integrations/google-drive"],
  });

  const testSlackMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/integrations/slack/test", "POST", {});
    },
    onSuccess: () => {
      toast({
        title: "Test notification sent",
        description: "Check your Slack #general channel!",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to send test notification",
        description: error.message,
      });
    },
  });

  const disconnectSlackMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/integrations/slack", "DELETE", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/slack"] });
      toast({
        title: "Slack disconnected",
        description: "Your Slack integration has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to disconnect",
        description: error.message,
      });
    },
  });

  const handleConnectSlack = async () => {
    setConnectingSlack(true);
    try {
      const response = await fetch("/api/integrations/slack/install");
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: "Failed to initiate Slack connection",
      });
      setConnectingSlack(false);
    }
  };

  // Gmail mutations
  const testGmailMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/integrations/gmail/test", "POST", {});
    },
    onSuccess: () => {
      toast({
        title: "Test email sent",
        description: "Check your inbox!",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to send test email",
        description: error.message,
      });
    },
  });

  const syncGmailMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/integrations/gmail/sync", "POST", {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/gmail"] });
      toast({
        title: "Gmail synced",
        description: `Synced ${data.synced} emails, created ${data.tasksCreated} tasks`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to sync Gmail",
        description: error.message,
      });
    },
  });

  const disconnectGmailMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/integrations/gmail", "DELETE", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/gmail"] });
      toast({
        title: "Gmail disconnected",
        description: "Your Gmail integration has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to disconnect",
        description: error.message,
      });
    },
  });

  const handleConnectGmail = async () => {
    setConnectingGmail(true);
    try {
      const response = await fetch("/api/integrations/gmail/install");
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: "Failed to initiate Gmail connection",
      });
      setConnectingGmail(false);
    }
  };

  // Google Meet mutations
  const testGoogleMeetMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/integrations/google-meet/test", "POST", {});
    },
    onSuccess: (data: any) => {
      toast({
        title: "Test meeting created",
        description: data.meetLink ? `Meeting link: ${data.meetLink}` : "Meeting created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to create test meeting",
        description: error.message,
      });
    },
  });

  // Google Drive mutations
  const testGoogleDriveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/integrations/google-drive/test", "POST", {});
    },
    onSuccess: (data: any) => {
      toast({
        title: "Test folder created",
        description: data.webViewLink ? `Folder: ${data.folderName}` : "Test folder created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to create test folder",
        description: error.message,
      });
    },
  });

  const integrations: Integration[] = [
    {
      id: "slack",
      name: "Slack",
      description: "Get real-time task notifications in your Slack workspace. Automatically notifies your team when tasks are created, assigned, or completed.",
      icon: SiSlack,
      color: "bg-[#4A154B]",
      connected: slackStatus?.connected || false,
      teamName: slackStatus?.teamName,
      lastSync: slackStatus?.lastSync ? new Date(slackStatus.lastSync) : undefined,
      capabilities: [
        "Task assignment notifications",
        "Real-time updates in channels",
        "Team collaboration alerts",
        "Rich task formatting with impact/urgency",
      ],
      tier: "free",
    },
    {
      id: "gmail",
      name: "Gmail",
      description: "Create tasks from labeled emails and send task updates via email. Auto-process emails with the 'Deleg8te' label using AI to extract actionable tasks.",
      icon: SiGmail,
      color: "bg-[#EA4335]",
      connected: gmailStatus?.connected || false,
      teamName: gmailStatus?.emailAddress,
      lastSync: gmailStatus?.lastSync ? new Date(gmailStatus.lastSync) : undefined,
      capabilities: [
        "Auto-create tasks from labeled emails",
        "Send task updates via email",
        "AI-powered email parsing",
        "Smart task extraction from email content",
      ],
      tier: "free",
    },
    {
      id: "google-meet",
      name: "Google Meet",
      description: "Instantly create video meeting links for task discussions. Automatically generate Google Meet links and add them to your calendar events for seamless team collaboration.",
      icon: SiGooglemeet,
      color: "bg-[#00897B]",
      connected: googleMeetStatus?.connected || false,
      capabilities: [
        "Auto-generate Meet links for tasks",
        "Calendar integration for meetings",
        "One-click meeting creation",
        "Share meeting links with team",
      ],
      tier: "free",
    },
    {
      id: "google-drive",
      name: "Google Drive",
      description: "Attach files from Google Drive to tasks and export task data to Drive. Seamlessly manage task documents, export reports, and share files with your team.",
      icon: SiGoogledrive,
      color: "bg-[#4285F4]",
      connected: googleDriveStatus?.connected || false,
      capabilities: [
        "Attach Drive files to tasks",
        "Export task data as JSON",
        "Upload files to Drive folders",
        "Search and browse Drive files",
      ],
      tier: "free",
    },
    {
      id: "outlook",
      name: "Outlook",
      description: "Sync tasks with Outlook email and calendar. Turn emails into tasks, send task reminders via Outlook, and integrate with your Microsoft 365 workflow.",
      icon: SiMicrosoftoutlook,
      color: "bg-[#0078D4]",
      connected: false,
      capabilities: [
        "Create tasks from Outlook emails",
        "Send task notifications via email",
        "Calendar integration for deadlines",
        "Microsoft 365 ecosystem sync",
      ],
      tier: "free",
    },
    {
      id: "zendesk",
      name: "Zendesk",
      description: "Convert customer support tickets into delegated tasks. Automatically create tasks from high-priority tickets and keep your team aligned with customer needs.",
      icon: SiZendesk,
      color: "bg-[#03363D]",
      connected: false,
      capabilities: [
        "Auto-create tasks from tickets",
        "Priority-based task creation",
        "Customer context in tasks",
        "Support team delegation",
      ],
      tier: "free",
    },
    {
      id: "dropbox",
      name: "Dropbox",
      description: "Store and share task-related files with Dropbox. Upload documents, attach files to tasks, and collaborate with your team using Dropbox's reliable file storage.",
      icon: SiDropbox,
      color: "bg-[#0061FF]",
      connected: false,
      capabilities: [
        "Attach Dropbox files to tasks",
        "Upload task documents",
        "Share files with team members",
        "Access files from anywhere",
      ],
      tier: "free",
    },
    {
      id: "twilio",
      name: "Twilio",
      description: "Send SMS task reminders and notifications via Twilio. Keep your team updated on urgent tasks with instant text messages and phone notifications.",
      icon: SiTwilio,
      color: "bg-[#F22F46]",
      connected: false,
      capabilities: [
        "SMS task notifications",
        "Urgent task alerts via text",
        "Phone call reminders",
        "Multi-channel task updates",
      ],
      tier: "free",
    },
    {
      id: "asana",
      name: "Asana",
      description: "Two-way sync with Asana projects. Import Asana tasks as templates, export delegated tasks to Asana, and keep both platforms in sync for unified project management.",
      icon: SiAsana,
      color: "bg-[#F06A6A]",
      connected: false,
      capabilities: [
        "Import Asana tasks as templates",
        "Export tasks to Asana projects",
        "Two-way task synchronization",
        "Unified project management",
      ],
      tier: "free",
    },
    {
      id: "hubspot",
      name: "HubSpot",
      description: "Connect your CRM workflow with task delegation. Create tasks from HubSpot deals, contacts, and activities to align sales and operations teams.",
      icon: SiHubspot,
      color: "bg-[#FF7A59]",
      connected: false,
      capabilities: [
        "Create tasks from CRM activities",
        "Deal-based task automation",
        "Contact-linked task delegation",
        "Sales-ops alignment",
      ],
      tier: "free",
    },
    {
      id: "jira",
      name: "Jira",
      description: "Bridge executive delegation with engineering execution. Convert high-level strategic tasks into Jira issues and track technical implementation progress.",
      icon: SiJira,
      color: "bg-[#0052CC]",
      connected: false,
      capabilities: [
        "Convert tasks to Jira issues",
        "Track engineering progress",
        "Strategic-to-tactical alignment",
        "Development team integration",
      ],
      tier: "free",
    },
    {
      id: "linear",
      name: "Linear",
      description: "Seamlessly delegate to product and engineering teams using Linear. Create Linear issues from executive tasks and maintain velocity across strategic initiatives.",
      icon: SiLinear,
      color: "bg-[#5E6AD2]",
      connected: false,
      capabilities: [
        "Create Linear issues from tasks",
        "Product team delegation",
        "Issue tracking and velocity",
        "Engineering workflow integration",
      ],
      tier: "free",
    },
    {
      id: "confluence",
      name: "Confluence",
      description: "Link tasks to Confluence documentation. Attach knowledge base articles, meeting notes, and project docs to provide context for delegated work.",
      icon: SiConfluence,
      color: "bg-[#172B4D]",
      connected: false,
      capabilities: [
        "Link tasks to documentation",
        "Attach knowledge base articles",
        "Context-rich task delegation",
        "Team documentation access",
      ],
      tier: "free",
    },
    {
      id: "github",
      name: "GitHub",
      description: "Connect code repositories with task delegation. Create GitHub issues from tasks, track commits, and align executive priorities with development work.",
      icon: SiGithub,
      color: "bg-[#181717]",
      connected: false,
      capabilities: [
        "Create GitHub issues from tasks",
        "Track repository activity",
        "Code-task alignment",
        "Developer team delegation",
      ],
      tier: "free",
    },
    {
      id: "notion",
      name: "Notion",
      description: "Sync tasks with Notion databases and workspaces. Export task data, link to Notion pages, and maintain a unified knowledge base across your organization.",
      icon: SiNotion,
      color: "bg-[#000000]",
      connected: false,
      capabilities: [
        "Sync tasks to Notion databases",
        "Link to Notion workspace pages",
        "Unified knowledge management",
        "Team workspace integration",
      ],
      tier: "free",
    },
    {
      id: "discord",
      name: "Discord",
      description: "Send task notifications to Discord servers. Keep your team informed in their preferred communication channel with real-time task updates and reminders.",
      icon: SiDiscord,
      color: "bg-[#5865F2]",
      connected: false,
      capabilities: [
        "Task notifications to channels",
        "Bot-based task reminders",
        "Team server integration",
        "Real-time update alerts",
      ],
      tier: "free",
    },
    {
      id: "onedrive",
      name: "OneDrive",
      description: "Store task files in Microsoft OneDrive. Seamlessly integrate with Microsoft 365, share documents, and access files across all your devices.",
      icon: SiMicrosoftonedrive,
      color: "bg-[#0078D4]",
      connected: false,
      capabilities: [
        "Store files in OneDrive",
        "Microsoft 365 integration",
        "Cross-device file access",
        "Document sharing",
      ],
      tier: "free",
    },
    {
      id: "sharepoint",
      name: "SharePoint",
      description: "Manage team documents and collaboration spaces. Connect tasks to SharePoint sites, libraries, and lists for enterprise-grade document management.",
      icon: SiMicrosoftsharepoint,
      color: "bg-[#0078D4]",
      connected: false,
      capabilities: [
        "Link tasks to SharePoint sites",
        "Document library integration",
        "Enterprise collaboration",
        "Team site management",
      ],
      tier: "free",
    },
    {
      id: "trello",
      name: "Trello",
      description: "Import Trello boards and convert cards into delegated tasks. Bring visual task management into your delegation workflow with one-click imports.",
      icon: SiTrello,
      color: "bg-[#0079BF]",
      connected: false,
      capabilities: [
        "Import Trello boards",
        "Convert cards to tasks",
        "Visual task management",
        "Board-based delegation",
      ],
      tier: "free",
    },
    {
      id: "google-sheets",
      name: "Google Sheets",
      description: "Export task data to spreadsheets and create custom reports. Analyze delegation patterns, track team performance, and generate insights from task data.",
      icon: SiGooglesheets,
      color: "bg-[#34A853]",
      connected: false,
      capabilities: [
        "Export tasks to spreadsheets",
        "Custom reporting and analytics",
        "Data visualization",
        "Performance tracking",
      ],
      tier: "free",
    },
    {
      id: "google-docs",
      name: "Google Docs",
      description: "Link Google Docs to tasks for detailed briefings. Attach project plans, meeting notes, and specifications to provide comprehensive context for delegated work.",
      icon: SiGoogledocs,
      color: "bg-[#4285F4]",
      connected: false,
      capabilities: [
        "Link Docs to tasks",
        "Detailed task briefings",
        "Collaborative documentation",
        "Context-rich delegation",
      ],
      tier: "free",
    },
  ];

  const connectedIntegrations = integrations.filter((i) => i.connected);
  const availableIntegrations = integrations.filter((i) => !i.connected);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-integrations">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect Deleg8te.ai with your favorite tools to streamline your workflow
        </p>
      </div>

      {(status === 'pending' || slackFetching) && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Loading integrations...</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="animate-pulse">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-muted" />
                  <div className="space-y-2">
                    <div className="h-4 w-20 rounded bg-muted" />
                    <div className="h-3 w-16 rounded bg-muted" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-12 w-full rounded bg-muted" />
                <div className="h-16 w-full rounded bg-muted" />
                <div className="h-9 w-full rounded bg-muted" />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {status === 'error' && !slackFetching && (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Failed to load integrations</CardTitle>
            <CardDescription>
              Could not fetch integration status. Please refresh the page to try again.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {status === 'success' && connectedIntegrations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold">Connected</h2>
            <Badge variant="secondary">{connectedIntegrations.length}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connectedIntegrations.map((integration) => (
              <Card key={integration.id} className="hover-elevate" data-testid={`card-integration-${integration.id}`}>
                <CardHeader className="space-y-0 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`${integration.color} flex h-10 w-10 items-center justify-center rounded-md`}>
                        <integration.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {integration.teamName || "Connected"}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {integration.description}
                  </p>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Capabilities:</p>
                    <ul className="space-y-1">
                      {integration.capabilities.map((capability, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs">
                          <Zap className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{capability}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {integration.id === "slack" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testSlackMutation.mutate()}
                        disabled={testSlackMutation.isPending}
                        className="flex-1"
                        data-testid="button-test-slack"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {testSlackMutation.isPending ? "Sending..." : "Test"}
                      </Button>
                    )}
                    {integration.id === "gmail" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testGmailMutation.mutate()}
                          disabled={testGmailMutation.isPending}
                          className="flex-1"
                          data-testid="button-test-gmail"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {testGmailMutation.isPending ? "Sending..." : "Test"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => syncGmailMutation.mutate()}
                          disabled={syncGmailMutation.isPending}
                          className="flex-1"
                          data-testid="button-sync-gmail"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          {syncGmailMutation.isPending ? "Syncing..." : "Sync"}
                        </Button>
                      </>
                    )}
                    {integration.id === "google-meet" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testGoogleMeetMutation.mutate()}
                        disabled={testGoogleMeetMutation.isPending}
                        className="flex-1"
                        data-testid="button-test-google-meet"
                      >
                        <Video className="h-4 w-4 mr-2" />
                        {testGoogleMeetMutation.isPending ? "Creating..." : "Test"}
                      </Button>
                    )}
                    {integration.id === "google-drive" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testGoogleDriveMutation.mutate()}
                        disabled={testGoogleDriveMutation.isPending}
                        className="flex-1"
                        data-testid="button-test-google-drive"
                      >
                        <FolderOpen className="h-4 w-4 mr-2" />
                        {testGoogleDriveMutation.isPending ? "Creating..." : "Test"}
                      </Button>
                    )}
                    {integration.id !== "google-meet" && integration.id !== "google-drive" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (integration.id === "slack") {
                            disconnectSlackMutation.mutate();
                          } else if (integration.id === "gmail") {
                            disconnectGmailMutation.mutate();
                          }
                        }}
                        disabled={disconnectSlackMutation.isPending || disconnectGmailMutation.isPending}
                        className="flex-1"
                        data-testid={`button-disconnect-${integration.id}`}
                      >
                        <Link2Off className="h-4 w-4 mr-2" />
                        {disconnectSlackMutation.isPending ? "Disconnecting..." : "Disconnect"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {status === 'success' && availableIntegrations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Available Integrations</h2>
            <Badge variant="secondary">{availableIntegrations.length}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableIntegrations.map((integration) => (
              <Card key={integration.id} className="hover-elevate" data-testid={`card-integration-${integration.id}`}>
                <CardHeader className="space-y-0 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`${integration.color} flex h-10 w-10 items-center justify-center rounded-md`}>
                        <integration.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <CardDescription className="text-xs">Not connected</CardDescription>
                      </div>
                    </div>
                    {integration.tier === "pro" && (
                      <Badge variant="default">PRO</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {integration.description}
                  </p>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Capabilities:</p>
                    <ul className="space-y-1">
                      {integration.capabilities.map((capability, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs">
                          <Zap className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{capability}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    onClick={() => {
                      if (integration.id === "slack") {
                        handleConnectSlack();
                      } else if (integration.id === "gmail") {
                        handleConnectGmail();
                      } else if (integration.id === "google-meet") {
                        toast({
                          title: "Connect Google Calendar",
                          description: "Google Meet uses Google Calendar integration. Please connect Google Calendar from the Tools pane to enable Google Meet.",
                        });
                      } else if (integration.id === "google-drive") {
                        toast({
                          title: "Connect Google Drive",
                          description: "Please connect Google Drive from the Tools pane (left sidebar) to enable file management features.",
                        });
                      } else {
                        toast({
                          title: `Connect ${integration.name}`,
                          description: `Please connect ${integration.name} from the Tools pane (left sidebar) to enable this integration.`,
                        });
                      }
                    }}
                    disabled={(connectingSlack && integration.id === "slack") || (connectingGmail && integration.id === "gmail")}
                    className="w-full"
                    data-testid={`button-connect-${integration.id}`}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {((connectingSlack && integration.id === "slack") || (connectingGmail && integration.id === "gmail")) ? "Connecting..." : "Connect"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Coming Soon: More Integrations
          </CardTitle>
          <CardDescription>
            More productivity tools coming soon to expand your delegation ecosystem:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Microsoft Teams",
              "Telegram Bot",
              "Zoom",
              "Todoist",
              "Monday.com",
              "ClickUp",
            ].map((tool, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-primary">•</span>
                {tool}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
