import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  assignee: string;
}

interface PriorityMatrixProps {
  tasks: {
    highImpactHighUrgency: Task[];
    highImpactLowUrgency: Task[];
    lowImpactHighUrgency: Task[];
    lowImpactLowUrgency: Task[];
  };
  onTaskClick?: (taskId: string) => void;
}

function QuadrantCard({
  title,
  description,
  tasks,
  color,
  onTaskClick,
}: {
  title: string;
  description: string;
  tasks: Task[];
  color: string;
  onTaskClick?: (taskId: string) => void;
}) {
  return (
    <Card className={cn("p-4 h-full min-h-[250px]", color)}>
      <div className="space-y-3 h-full flex flex-col">
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="space-y-2 flex-1 overflow-auto">
          {tasks.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tasks</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="p-2 rounded-md bg-background/50 hover-elevate cursor-pointer"
                onClick={() => onTaskClick?.(task.id)}
                data-testid={`matrix-task-${task.id}`}
              >
                <p className="text-sm font-medium line-clamp-1">{task.title}</p>
                <p className="text-xs text-muted-foreground">{task.assignee}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

export default function PriorityMatrix({ tasks, onTaskClick }: PriorityMatrixProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Priority Matrix</h2>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-chart-1"></div>
            <span className="text-muted-foreground">Impact</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive"></div>
            <span className="text-muted-foreground">Urgency</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <QuadrantCard
          title="Do Now"
          description="High Impact + High Urgency"
          tasks={tasks.highImpactHighUrgency}
          color="bg-destructive/5 border-destructive/20"
          onTaskClick={onTaskClick}
        />
        <QuadrantCard
          title="Plan"
          description="High Impact + Low Urgency"
          tasks={tasks.highImpactLowUrgency}
          color="bg-chart-1/5 border-chart-1/20"
          onTaskClick={onTaskClick}
        />
        <QuadrantCard
          title="Quick Action"
          description="Low Impact + High Urgency"
          tasks={tasks.lowImpactHighUrgency}
          color="bg-chart-4/5 border-chart-4/20"
          onTaskClick={onTaskClick}
        />
        <QuadrantCard
          title="Defer/Delete"
          description="Low Impact + Low Urgency"
          tasks={tasks.lowImpactLowUrgency}
          color="bg-muted/30 border-muted"
          onTaskClick={onTaskClick}
        />
      </div>
    </div>
  );
}
