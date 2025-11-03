import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Clock, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  id: string;
  title: string;
  impact: "low" | "medium" | "high";
  urgency: "low" | "medium" | "high";
  assignee: {
    name: string;
    avatar?: string;
  };
  progress: number;
  dueDate: string;
  status: "delegated" | "in_progress" | "review" | "completed";
  onClick?: () => void;
}

const impactColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-chart-4/20 text-chart-4",
  high: "bg-chart-1/20 text-chart-1",
};

const urgencyColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-chart-4/20 text-chart-4",
  high: "bg-destructive/20 text-destructive",
};

const statusColors = {
  delegated: "bg-muted text-muted-foreground",
  in_progress: "bg-chart-2/20 text-chart-2",
  review: "bg-chart-4/20 text-chart-4",
  completed: "bg-status-online/20 text-status-online",
};

export default function TaskCard({
  title,
  impact,
  urgency,
  assignee,
  progress,
  dueDate,
  status,
  onClick,
}: TaskCardProps) {
  const initials = assignee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card
      className={cn(
        "p-6 hover-elevate active-elevate-2 cursor-pointer transition-all",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
      data-testid={`card-task-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-semibold text-lg line-clamp-2 flex-1" data-testid="text-task-title">
            {title}
          </h3>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className={cn("text-xs", impactColors[impact])}>
            Impact: {impact}
          </Badge>
          <Badge variant="secondary" className={cn("text-xs", urgencyColors[urgency])}>
            Urgency: {urgency}
          </Badge>
          <Badge variant="secondary" className={cn("text-xs", statusColors[status])}>
            {status.replace("_", " ")}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={assignee.avatar} alt={assignee.name} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{assignee.name}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" data-testid="progress-task" />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Due {dueDate}</span>
        </div>
      </div>
    </Card>
  );
}
