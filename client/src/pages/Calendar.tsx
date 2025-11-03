import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus, RefreshCw, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Calendar() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: events, isLoading } = useQuery({
    queryKey: ['/api/calendar/events'],
    retry: false,
  });

  const { data: tasks } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const syncTaskToCalendar = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}/sync-to-calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sync task');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      toast({
        title: "Synced to Calendar",
        description: "Task deadline has been added to your Google Calendar",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync task to calendar",
        variant: "destructive",
      });
    },
  });

  const tasksWithDueDates = (tasks as any[] | undefined)?.filter((task: any) => task.dueDate && task.status !== 'completed') || [];

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="heading-calendar">
              <CalendarIcon className="w-8 h-8 text-primary" />
              Calendar Integration
            </h1>
            <p className="text-muted-foreground mt-2">
              View and sync your tasks with Google Calendar
            </p>
          </div>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] })}
            variant="outline"
            data-testid="button-refresh-calendar"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card data-testid="card-upcoming-events">
            <CardHeader>
              <CardTitle>Upcoming Calendar Events</CardTitle>
              <CardDescription>
                Events from your Google Calendar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading calendar events...
                </div>
              ) : events && Array.isArray(events) && events.length > 0 ? (
                <div className="space-y-3">
                  {events.slice(0, 10).map((event: any) => (
                    <div 
                      key={event.id} 
                      className="p-4 border rounded-md space-y-2 hover-elevate"
                      data-testid={`event-${event.id}`}
                    >
                      <div className="font-semibold">{event.summary}</div>
                      <div className="text-sm text-muted-foreground">
                        {event.start?.dateTime 
                          ? format(new Date(event.start.dateTime), 'PPp')
                          : event.start?.date 
                          ? format(new Date(event.start.date), 'PP')
                          : 'No date'}
                      </div>
                      {event.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {event.description}
                        </div>
                      )}
                      {event.status && (
                        <Badge variant={event.status === 'confirmed' ? 'default' : 'secondary'}>
                          {event.status}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto" />
                  <div className="text-muted-foreground">
                    No upcoming events found
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Create tasks with due dates and sync them to your calendar
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-tasks-to-sync">
            <CardHeader>
              <CardTitle>Tasks with Due Dates</CardTitle>
              <CardDescription>
                Sync these tasks to your Google Calendar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tasksWithDueDates.length > 0 ? (
                <div className="space-y-3">
                  {tasksWithDueDates.map((task: any) => (
                    <div 
                      key={task.id} 
                      className="p-4 border rounded-md space-y-3 hover-elevate"
                      data-testid={`task-sync-${task.id}`}
                    >
                      <div>
                        <div className="font-semibold">{task.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Due: {format(new Date(task.dueDate), 'PPp')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {task.impact} impact
                        </Badge>
                        <Badge variant="outline">
                          {task.urgency} urgency
                        </Badge>
                      </div>
                      <Button
                        onClick={() => syncTaskToCalendar.mutate(task.id)}
                        disabled={syncTaskToCalendar.isPending}
                        size="sm"
                        className="w-full"
                        data-testid={`button-sync-task-${task.id}`}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Sync to Calendar
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto" />
                  <div className="text-muted-foreground">
                    No tasks with due dates
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add due dates to your tasks to sync them with your calendar
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-calendar-features">
          <CardHeader>
            <CardTitle>Calendar Features</CardTitle>
            <CardDescription>
              Powerful integration with Google Calendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Two-Way Sync</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  View your Google Calendar events and create new events from tasks
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Deadline Tracking</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatically create calendar reminders for task deadlines
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Team Availability</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Check team member availability before scheduling meetings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
