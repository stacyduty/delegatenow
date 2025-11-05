import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link2, Link2Off, ExternalLink, CheckCircle2, Zap, MessageSquare, Video } from "lucide-react";
import { SiSlack, SiGmail, SiGooglemeet } from "react-icons/si";

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
                      {integration.capabilities.slice(0, 3).map((capability, idx) => (
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
                    {integration.id !== "google-meet" && (
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
                      {integration.capabilities.slice(0, 3).map((capability, idx) => (
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
            We're building the integration ecosystem. More tools coming in the next 6 months:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Google Drive",
              "Asana",
              "Trello",
              "Microsoft Teams",
              "Discord",
              "Telegram Bot",
              "Zoom",
              "GitHub",
              "Jira",
              "Linear",
              "Notion",
              "Todoist",
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
