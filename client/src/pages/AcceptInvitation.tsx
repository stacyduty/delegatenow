import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { CheckCircle2 } from "lucide-react";

export default function AcceptInvitation() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");

  useEffect(() => {
    // Get token from URL query params
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get('token');
    if (inviteToken) {
      setToken(inviteToken);
    }
  }, []);

  const acceptMutation = useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      const response = await fetch('/api/team-members/accept-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to accept invitation');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setMemberEmail(data.email);
      setAccepted(true);
      toast({
        title: "Invitation Accepted",
        description: "Your account has been activated successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast({
        title: "Invalid Link",
        description: "This invitation link is invalid or expired",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords match",
        variant: "destructive",
      });
      return;
    }

    acceptMutation.mutate({ token, password });
  };

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-status-online/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-status-online" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Account Activated!</CardTitle>
            <CardDescription className="text-center">
              Your invitation has been accepted successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Your email</p>
              <p className="font-medium mt-1">{memberEmail}</p>
            </div>
            <Button 
              onClick={() => setLocation("/team-login")}
              className="w-full"
              data-testid="button-go-to-login"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center h-16 w-16 rounded-lg bg-primary text-primary-foreground font-bold text-2xl">
              D8
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Accept Your Invitation</CardTitle>
          <CardDescription className="text-center">
            Set your password to activate your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-password"
                required
              />
              <p className="text-xs text-muted-foreground">
                Choose a strong password with at least 8 characters
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                data-testid="input-confirm-password"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={acceptMutation.isPending || !token}
              data-testid="button-accept-invitation"
            >
              {acceptMutation.isPending ? "Activating..." : "Activate Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
