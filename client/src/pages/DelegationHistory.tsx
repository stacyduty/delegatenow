import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, Clock, DollarSign, Calendar, User } from "lucide-react";
import type { Task, TeamMember } from "@shared/schema";
import { format } from "date-fns";

export default function DelegationHistory() {
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  // Sort tasks by creation date (newest first)
  const sortedTasks = [...tasks].sort((a, b) => 
    new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
  );

  const getTeamMemberName = (id: string | null) => {
    if (!id) return "Unassigned";
    const member = teamMembers.find(tm => tm.id === id);
    return member?.name || "Unknown";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      completed: "default",
      in_progress: "secondary",
      review: "secondary",
      delegated: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status.replace("_", " ")}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-delegation-history">Delegation History & Audit Log</h1>
        <p className="text-muted-foreground">Complete audit trail of all task delegations with acceptance records</p>
      </div>

      <Card data-testid="card-audit-log">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Compliance & Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-md" />
              ))}
            </div>
          ) : sortedTasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8" data-testid="text-no-history">
              No delegation history yet. Create tasks to see audit records here.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Delegate</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Accepted</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Spending Limit</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTasks.map((task) => (
                    <TableRow key={task.id} data-testid={`row-task-${task.id}`}>
                      <TableCell className="font-medium">
                        <div className="max-w-xs">
                          <div className="font-semibold">{task.title}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {task.impact} impact
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {task.urgency} urgency
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{getTeamMemberName(task.teamMemberId)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {task.createdAt ? format(new Date(task.createdAt), "MMM d, yyyy") : "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {task.acceptedAt ? (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            {format(new Date(task.acceptedAt), "MMM d, yyyy")}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Pending
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {task.expiryDate ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(task.expiryDate), "MMM d, yyyy")}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No expiry</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {task.spendingLimit ? (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                            }).format(Number(task.spendingLimit))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No limit</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audit & Compliance Benefits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
            <p><strong>Formal Acceptance Records:</strong> Permanent timestamps for legal and compliance requirements</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
            <p><strong>Authority Limits:</strong> Optional spending caps ensure delegations stay within financial authority</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
            <p><strong>Expiry Tracking:</strong> Automatic expiry dates with 7-day and 30-day warnings</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
            <p><strong>Complete Audit Trail:</strong> Every delegation action is logged for governance and risk management</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
