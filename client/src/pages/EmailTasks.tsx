import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle2, XCircle, Clock, AlertCircle, Plus, Send } from "lucide-react";
import { format } from "date-fns";
import { useState as useStateReact } from "react";
import type { EmailInbox } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function EmailTasks() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useStateReact(false);
  const [emailForm, setEmailForm] = useStateReact({
    from: "",
    subject: "",
    bodyText: "",
  });

  const { data: emails = [], isLoading } = useQuery<EmailInbox[]>({
    queryKey: ["/api/emails"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: { from: string; subject: string; bodyText: string }) => {
      const response = await fetch("/api/emails/create-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create task");
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.shouldCreateTask) {
        toast({
          title: "Task Created",
          description: `Created task "${data.task.title}" from email`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/emails"] });
        queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
        setShowCreateDialog(false);
        setEmailForm({ from: "", subject: "", bodyText: "" });
      } else {
        toast({
          title: "Email Not Converted",
          description: data.reason || "Email does not require task creation",
          variant: "default",
        });
      }
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
    createTaskMutation.mutate(emailForm);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return <Badge variant="default" className="gap-1" data-testid={`badge-status-processed`}><CheckCircle2 className="w-3 h-3" /> Processed</Badge>;
      case "pending":
        return <Badge variant="secondary" className="gap-1" data-testid={`badge-status-pending`}><Clock className="w-3 h-3" /> Pending</Badge>;
      case "failed":
        return <Badge variant="destructive" className="gap-1" data-testid={`badge-status-failed`}><XCircle className="w-3 h-3" /> Failed</Badge>;
      case "ignored":
        return <Badge variant="outline" className="gap-1" data-testid={`badge-status-ignored`}><AlertCircle className="w-3 h-3" /> Ignored</Badge>;
      default:
        return <Badge variant="outline" data-testid={`badge-status-${status}`}>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Email Tasks</h1>
            <p className="text-muted-foreground">Loading emails...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Tasks</h1>
          <p className="text-muted-foreground">AI-powered task creation from emails</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-task">
              <Plus className="w-4 h-4 mr-2" />
              Create from Email
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Task from Email</DialogTitle>
              <DialogDescription>
                Paste an email to convert it into a delegated task using AI analysis
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="from">From Email</Label>
                <Input
                  id="from"
                  type="email"
                  placeholder="sender@example.com"
                  value={emailForm.from}
                  onChange={(e) => setEmailForm({ ...emailForm, from: e.target.value })}
                  required
                  data-testid="input-email-from"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Email subject line"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  required
                  data-testid="input-email-subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodyText">Email Body</Label>
                <Textarea
                  id="bodyText"
                  placeholder="Paste the email content here..."
                  value={emailForm.bodyText}
                  onChange={(e) => setEmailForm({ ...emailForm, bodyText: e.target.value })}
                  required
                  rows={10}
                  data-testid="textarea-email-body"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  data-testid="button-submit"
                >
                  {createTaskMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Create Task
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {emails.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No email tasks yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating a task from an email using the button above
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {emails.map((email) => (
            <Card key={email.id} className="hover-elevate" data-testid={`card-email-${email.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <CardTitle className="text-lg" data-testid={`text-subject-${email.id}`}>
                        {email.subject}
                      </CardTitle>
                    </div>
                    <CardDescription data-testid={`text-from-${email.id}`}>
                      From: {email.fromName || email.from}
                      {email.fromName && <span className="text-xs"> ({email.from})</span>}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(email.status || "pending")}
                    <span className="text-xs text-muted-foreground" data-testid={`text-date-${email.id}`}>
                      {format(new Date(email.receivedAt), "MMM dd, yyyy h:mm a")}
                    </span>
                  </div>
                </div>
              </CardHeader>

              {email.bodyText && (
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Email Content:</h4>
                      <p className="text-sm text-muted-foreground line-clamp-3" data-testid={`text-body-${email.id}`}>
                        {email.bodyText}
                      </p>
                    </div>

                    {email.extractedTask && (
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-medium mb-2">AI Analysis:</h4>
                        <div className="text-sm space-y-1">
                          {email.status === 'processed' && email.taskId ? (
                            <p className="text-green-600 dark:text-green-400" data-testid={`text-task-created-${email.id}`}>
                              ✓ Task created successfully
                            </p>
                          ) : null}
                          {email.status === 'ignored' ? (
                            <p className="text-muted-foreground" data-testid={`text-reason-${email.id}`}>
                              {(email.extractedTask as any).reason || "Email did not require task creation"}
                            </p>
                          ) : null}
                          {email.status === 'failed' && email.errorMessage ? (
                            <p className="text-destructive" data-testid={`text-error-${email.id}`}>
                              Error: {email.errorMessage}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
