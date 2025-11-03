import { useState } from "react";
import DashboardStats from "@/components/DashboardStats";
import VoiceButton from "@/components/VoiceButton";
import TaskCard from "@/components/TaskCard";
import VoiceOverlay from "@/components/VoiceOverlay";
import PriorityMatrix from "@/components/PriorityMatrix";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Dashboard() {
  const [voiceOverlayOpen, setVoiceOverlayOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "processing">("idle");
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);

  const handleToggleVoice = () => {
    if (voiceState === "idle") {
      setVoiceState("listening");
      
      setTimeout(() => {
        setTranscript("I need someone to develop the Q1 marketing strategy focusing on digital channels and customer acquisition. This is high priority and needs to be done within the next two weeks.");
        setVoiceState("processing");
        
        setTimeout(() => {
          setAnalysis({
            title: "Develop Q1 Marketing Strategy",
            impact: "high",
            urgency: "high",
            suggestedAssignee: "Sarah Chen - Marketing Director",
          });
          setVoiceState("idle");
        }, 2000);
      }, 3000);
    }
  };

  // Mock data - todo: remove mock functionality
  const recentTasks = [
    {
      id: "1",
      title: "Develop Q1 Marketing Strategy",
      impact: "high" as const,
      urgency: "high" as const,
      assignee: { name: "Sarah Chen", avatar: "" },
      progress: 65,
      dueDate: "in 2 days",
      status: "in_progress" as const,
    },
    {
      id: "2",
      title: "Review Budget Allocations",
      impact: "high" as const,
      urgency: "medium" as const,
      assignee: { name: "Michael Torres", avatar: "" },
      progress: 30,
      dueDate: "in 5 days",
      status: "delegated" as const,
    },
    {
      id: "3",
      title: "Update Client Presentation Deck",
      impact: "medium" as const,
      urgency: "high" as const,
      assignee: { name: "Emily Rodriguez", avatar: "" },
      progress: 90,
      dueDate: "tomorrow",
      status: "review" as const,
    },
  ];

  const matrixTasks = {
    highImpactHighUrgency: [
      { id: "1", title: "Q1 Marketing Strategy", assignee: "Sarah Chen" },
      { id: "2", title: "Client Presentation", assignee: "Emily Rodriguez" },
    ],
    highImpactLowUrgency: [
      { id: "3", title: "Annual Budget Planning", assignee: "Michael Torres" },
    ],
    lowImpactHighUrgency: [
      { id: "4", title: "Update Team Calendar", assignee: "David Kim" },
    ],
    lowImpactLowUrgency: [],
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Executive Dashboard</h1>
          <p className="text-muted-foreground">AI-powered task delegation at your command</p>
        </div>
      </div>

      <DashboardStats
        activeTasks={24}
        productivity={94}
        completedToday={8}
        teamSize={12}
      />

      <div className="flex flex-col items-center gap-6 py-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Voice Delegation</h2>
          <p className="text-muted-foreground">Click to speak your task and let AI handle the rest</p>
        </div>
        <VoiceButton
          state="idle"
          onToggle={() => setVoiceOverlayOpen(true)}
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recentTasks.map((task) => (
            <TaskCard
              key={task.id}
              {...task}
              onClick={() => console.log(`Clicked task: ${task.title}`)}
            />
          ))}
        </div>
      </div>

      <PriorityMatrix
        tasks={matrixTasks}
        onTaskClick={(id) => console.log(`Matrix task clicked: ${id}`)}
      />

      <VoiceOverlay
        isOpen={voiceOverlayOpen}
        onClose={() => {
          setVoiceOverlayOpen(false);
          setVoiceState("idle");
          setTranscript("");
          setAnalysis(null);
        }}
        state={voiceState}
        onToggleVoice={handleToggleVoice}
        transcript={transcript}
        analysis={analysis}
      />
    </div>
  );
}
