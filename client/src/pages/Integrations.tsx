import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link2, Link2Off, ExternalLink, CheckCircle2, Zap, MessageSquare } from "lucide-react";
import { SiSlack } from "react-icons/si";

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

export default function Integrations() {
  const { toast } = useToast();
  const [connectingSlack, setConnectingSlack] = useState(false);

  const { data: slackStatus, isFetching: slackFetching, error: slackError, status } = useQuery<SlackStatus>({
    queryKey: ["/api/integrations/slack"],
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
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (integration.id === "slack") {
                          disconnectSlackMutation.mutate();
                        }
                      }}
                      disabled={disconnectSlackMutation.isPending}
                      className="flex-1"
                      data-testid={`button-disconnect-${integration.id}`}
                    >
                      <Link2Off className="h-4 w-4 mr-2" />
                      {disconnectSlackMutation.isPending ? "Disconnecting..." : "Disconnect"}
                    </Button>
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
                      }
                    }}
                    disabled={connectingSlack && integration.id === "slack"}
                    className="w-full"
                    data-testid={`button-connect-${integration.id}`}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {connectingSlack && integration.id === "slack" ? "Connecting..." : "Connect"}
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
              "Google Calendar (✅ Available)",
              "Email Parser (✅ Available)",
              "Asana",
              "Trello",
              "Microsoft Teams",
              "Google Meet",
              "Zoom",
              "GitHub",
              "Jira",
              "Linear",
              "Notion",
              "Airtable",
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
