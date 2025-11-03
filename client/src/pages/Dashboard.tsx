import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardStats from "@/components/DashboardStats";
import VoiceButton from "@/components/VoiceButton";
import TaskCard from "@/components/TaskCard";
import VoiceOverlay from "@/components/VoiceOverlay";
import PriorityMatrix from "@/components/PriorityMatrix";
import { SubscriptionOnboarding } from "@/components/SubscriptionOnboarding";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Task, TeamMember, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
  activeTasks: number;
  productivity: number;
  completedToday: number;
  teamSize: number;
}

export default function Dashboard() {
  const [voiceOverlayOpen, setVoiceOverlayOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  // Show onboarding for new users without active subscription
  useEffect(() => {
    if (user && !user.subscriptionStatus) {
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [user]);

  const handleOnboardingClose = (open: boolean) => {
    setShowOnboarding(open);
    if (!open) {
      localStorage.setItem('hasSeenOnboarding', 'true');
    }
  };

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  // Get recent 3 tasks
  const recentTasks = tasks
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 3)
    .map(task => {
      const teamMember = teamMembers.find(tm => tm.id === task.teamMemberId);
      return {
        id: task.id,
        title: task.title,
        impact: task.impact as "low" | "medium" | "high",
        urgency: task.urgency as "low" | "medium" | "high",
        assignee: teamMember ? { name: teamMember.name, avatar: teamMember.avatar || "" } : undefined,
        progress: task.progress || 0,
        dueDate: task.dueDate ? formatDistanceToNow(new Date(task.dueDate), { addSuffix: true }) : "No due date",
        status: task.status as "delegated" | "in_progress" | "review" | "completed",
      };
    });

  // Organize tasks for priority matrix
  const matrixTasks = {
    highImpactHighUrgency: tasks
      .filter(t => t.impact === "high" && t.urgency === "high" && t.status !== "completed")
      .map(t => {
        const teamMember = teamMembers.find(tm => tm.id === t.teamMemberId);
        return { id: t.id, title: t.title, assignee: teamMember?.name || "Unassigned" };
      }),
    highImpactLowUrgency: tasks
      .filter(t => t.impact === "high" && t.urgency === "low" && t.status !== "completed")
      .map(t => {
        const teamMember = teamMembers.find(tm => tm.id === t.teamMemberId);
        return { id: t.id, title: t.title, assignee: teamMember?.name || "Unassigned" };
      }),
    lowImpactHighUrgency: tasks
      .filter(t => t.impact === "low" && t.urgency === "high" && t.status !== "completed")
      .map(t => {
        const teamMember = teamMembers.find(tm => tm.id === t.teamMemberId);
        return { id: t.id, title: t.title, assignee: teamMember?.name || "Unassigned" };
      }),
    lowImpactLowUrgency: tasks
      .filter(t => t.impact === "low" && t.urgency === "low" && t.status !== "completed")
      .map(t => {
        const teamMember = teamMembers.find(tm => tm.id === t.teamMemberId);
        return { id: t.id, title: t.title, assignee: teamMember?.name || "Unassigned" };
      }),
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">Executive Dashboard</h1>
          <p className="text-muted-foreground">AI-powered task delegation at your command</p>
        </div>
      </div>

      {statsLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" data-testid={`skeleton-stat-${i}`} />
          ))}
        </div>
      ) : (
        <DashboardStats
          activeTasks={stats?.activeTasks || 0}
          productivity={stats?.productivity || 0}
          completedToday={stats?.completedToday || 0}
          teamSize={stats?.teamSize || 0}
        />
      )}

      <div className="flex flex-col items-center gap-6 py-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Voice Delegation</h2>
          <p className="text-muted-foreground">Click to speak your task and let AI handle the rest</p>
        </div>
        <VoiceButton
          state="idle"
          onToggle={() => setVoiceOverlayOpen(true)}
          data-testid="button-voice-activate"
        />
        <p className="text-sm text-muted-foreground">Or press <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border rounded">Space</kbd> to activate</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recent Tasks</h2>
          <Button variant="outline" data-testid="button-view-all-tasks">
            View All
          </Button>
        </div>
        {tasksLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" data-testid={`skeleton-task-${i}`} />
            ))}
          </div>
        ) : recentTasks.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recentTasks.map((task) => (
              <TaskCard
                key={task.id}
                {...task}
                onClick={() => console.log(`Clicked task: ${task.title}`)}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8" data-testid="text-no-tasks">
            No tasks yet. Use voice delegation to create your first task!
          </p>
        )}
      </div>

      <PriorityMatrix
        tasks={matrixTasks}
        onTaskClick={(id) => console.log(`Matrix task clicked: ${id}`)}
      />

      <VoiceOverlay
        isOpen={voiceOverlayOpen}
        onClose={() => setVoiceOverlayOpen(false)}
      />

      <SubscriptionOnboarding 
        open={showOnboarding}
        onOpenChange={handleOnboardingClose}
      />
    </div>
  );
}
