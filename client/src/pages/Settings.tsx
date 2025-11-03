import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Crown, CreditCard, Bell, User, Shield } from "lucide-react";
import { useState } from "react";

interface User {
  id: string;
  username: string;
  email: string;
  subscriptionStatus: string;
  subscriptionId: string | null;
}

export default function Settings() {
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [taskAssignments, setTaskAssignments] = useState(true);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const cancelSubscription = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/subscription/cancel");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Subscription Canceled",
        description: "Your subscription has been canceled successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  const isActiveSubscription = user?.subscriptionStatus === "active" || user?.subscriptionStatus === "trialing";

  return (
    <div className="space-y-6" data-testid="page-settings">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-settings">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid gap-6">
        <Card data-testid="card-account">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Account Information</CardTitle>
            </div>
            <CardDescription>Your profile and account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-sm text-muted-foreground">Username</Label>
              <div className="text-base font-medium" data-testid="text-username">{user?.username}</div>
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label className="text-sm text-muted-foreground">Email</Label>
              <div className="text-base font-medium" data-testid="text-email">{user?.email}</div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-subscription">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <CardTitle>Subscription</CardTitle>
            </div>
            <CardDescription>Manage your Executive Plan subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-medium">Executive Plan</div>
                <div className="text-sm text-muted-foreground">$1/month • Unlimited team members</div>
              </div>
              <Badge 
                variant={isActiveSubscription ? "default" : "secondary"}
                data-testid="badge-subscription-status"
              >
                {isActiveSubscription ? "Active" : user?.subscriptionStatus || "Inactive"}
              </Badge>
            </div>

            {isActiveSubscription && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Benefits</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>✓ Unlimited team members</li>
                      <li>✓ AI-powered task analysis</li>
                      <li>✓ Voice delegation</li>
                      <li>✓ Real-time notifications</li>
                      <li>✓ Advanced analytics</li>
                    </ul>
                  </div>
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => cancelSubscription.mutate()}
                    disabled={cancelSubscription.isPending}
                    data-testid="button-cancel-subscription"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {cancelSubscription.isPending ? "Canceling..." : "Cancel Subscription"}
                  </Button>
                </div>
              </>
            )}

            {!isActiveSubscription && (
              <>
                <Separator />
                <Button 
                  className="w-full"
                  data-testid="button-upgrade"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade to Executive Plan
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-notifications">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Configure how you receive alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications" className="text-base cursor-pointer">
                  Email Notifications
                </Label>
                <div className="text-sm text-muted-foreground">
                  Receive email alerts for task updates
                </div>
              </div>
              <Switch
                id="email-notifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                data-testid="switch-email-notifications"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications" className="text-base cursor-pointer">
                  Push Notifications
                </Label>
                <div className="text-sm text-muted-foreground">
                  Get push notifications on your device
                </div>
              </div>
              <Switch
                id="push-notifications"
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
                data-testid="switch-push-notifications"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="task-assignments" className="text-base cursor-pointer">
                  Task Assignments
                </Label>
                <div className="text-sm text-muted-foreground">
                  Notify when tasks are assigned to team members
                </div>
              </div>
              <Switch
                id="task-assignments"
                checked={taskAssignments}
                onCheckedChange={setTaskAssignments}
                data-testid="switch-task-assignments"
              />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-security">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Password</Label>
              <div className="flex items-center gap-2">
                <div className="text-sm">••••••••••••</div>
                <Button variant="outline" size="sm" data-testid="button-change-password">
                  Change Password
                </Button>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Two-Factor Authentication</Label>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Not Enabled</Badge>
                <Button variant="outline" size="sm" data-testid="button-enable-2fa">
                  Enable 2FA
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
