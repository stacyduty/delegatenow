import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardStats from "@/components/DashboardStats";
import VoiceButton from "@/components/VoiceButton";
import TaskCard from "@/components/TaskCard";
import VoiceOverlay from "@/components/VoiceOverlay";
import PriorityMatrix from "@/components/PriorityMatrix";
import { SubscriptionOnboarding } from "@/components/SubscriptionOnboarding";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Keyboard, Mic, Sparkles, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { Task, TeamMember, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DashboardStats {
  activeTasks: number;
  productivity: number;
  completedToday: number;
  teamSize: number;
}

export default function Dashboard() {
  const [voiceOverlayOpen, setVoiceOverlayOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textAnalysis, setTextAnalysis] = useState<any>(null);
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(false);
  const { toast } = useToast();

  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  // Show onboarding for new users without active subscription
  useEffect(() => {
    if (user) {
      const isActiveSubscription = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';
      if (!isActiveSubscription) {
        const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
        if (!hasSeenOnboarding) {
          setShowOnboarding(true);
        }
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

  const analyzeTextMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", "/api/tasks/analyze", { transcript: text });
      return await res.json();
    },
    onSuccess: (data) => {
      setTextAnalysis(data.analysis);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Task Created",
        description: `Created task: "${data.analysis.title}"`,
      });
    },
    onError: (error) => {
      console.error("Error analyzing task:", error);
      toast({
        title: "Error",
        description: "Failed to analyze task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAnalyzeText = () => {
    if (!textInput.trim()) {
      toast({
        title: "Empty Input",
        description: "Please enter a task description",
        variant: "destructive",
      });
      return;
    }
    analyzeTextMutation.mutate(textInput);
  };

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsStatsCollapsed(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

      {/* Collapsible Stats Section for Mobile */}
      <div className="md:block">
        <div className="flex items-center justify-between mb-4 md:hidden">
          <h3 className="font-semibold">Dashboard Stats</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsStatsCollapsed(!isStatsCollapsed)}
            data-testid="button-toggle-stats"
          >
            {isStatsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className={cn(
          "transition-all duration-300 overflow-hidden",
          isStatsCollapsed ? "max-h-0 md:max-h-none opacity-0 md:opacity-100" : "max-h-[500px] opacity-100"
        )}>
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
        </div>
      </div>

      {/* Voice & Text Delegation Section */}
      <div className="flex flex-col items-center gap-6 py-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Task Delegation</h2>
          <p className="text-muted-foreground">Choose voice or text - AI handles the rest</p>
        </div>

        <Tabs defaultValue="voice" className="w-full max-w-2xl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="voice" data-testid="tab-voice">
              <Mic className="h-4 w-4 mr-2" />
              Voice
            </TabsTrigger>
            <TabsTrigger value="text" data-testid="tab-text">
              <Keyboard className="h-4 w-4 mr-2" />
              Text
            </TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="mt-6">
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground text-center">
                Click to speak your task and let AI handle the rest
              </p>
              <VoiceButton
                state="idle"
                onToggle={() => setVoiceOverlayOpen(true)}
                data-testid="button-voice-activate"
              />
              <p className="text-sm text-muted-foreground">
                Or press <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border rounded">Space</kbd> to activate
              </p>
            </div>
          </TabsContent>

          <TabsContent value="text" className="mt-6 space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Type your task description and let AI analyze it
              </p>
              <Textarea
                placeholder="e.g., I need someone to develop the Q1 marketing strategy focusing on digital channels and customer acquisition. This is high priority and needs to be done within the next two weeks."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={4}
                className="resize-none"
                data-testid="textarea-task-input"
              />
              <Button
                onClick={handleAnalyzeText}
                disabled={analyzeTextMutation.isPending || !textInput.trim()}
                className="w-full"
                data-testid="button-analyze-text"
              >
                {analyzeTextMutation.isPending ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze with AI
                  </>
                )}
              </Button>
            </div>

            {textAnalysis && (
              <Card className="animate-in fade-in slide-in-from-bottom-4" data-testid="card-text-analysis">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-status-online" />
                      <h3 className="font-semibold">Task Created Successfully</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTextInput("");
                        setTextAnalysis(null);
                      }}
                      data-testid="button-dismiss-analysis"
                    >
                      Create Another
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Task Title:</span>
                      <p className="font-medium" data-testid="text-analysis-title">{textAnalysis.title}</p>
                    </div>
                    <div className="flex gap-4 flex-wrap">
                      <div>
                        <span className="text-sm text-muted-foreground block mb-1">Impact:</span>
                        <Badge
                          variant={textAnalysis.impact === "high" ? "destructive" : "secondary"}
                          data-testid="badge-analysis-impact"
                        >
                          {textAnalysis.impact}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground block mb-1">Urgency:</span>
                        <Badge
                          variant={textAnalysis.urgency === "high" ? "destructive" : "secondary"}
                          data-testid="badge-analysis-urgency"
                        >
                          {textAnalysis.urgency}
                        </Badge>
                      </div>
                    </div>
                    {textAnalysis.suggestedAssignee && (
                      <div>
                        <span className="text-sm text-muted-foreground">Suggested Assignee:</span>
                        <p className="font-medium" data-testid="text-analysis-assignee">
                          {textAnalysis.suggestedAssignee}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
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
