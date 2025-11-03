import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  subtitle?: string;
  icon?: React.ReactNode;
}

function StatCard({ title, value, change, subtitle, icon }: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card className="p-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        
        <div className="flex items-end gap-2">
          <h2 className="text-4xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
            {value}
          </h2>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium pb-1",
              isPositive && "text-status-online",
              isNegative && "text-destructive"
            )}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : isNegative ? (
                <TrendingDown className="h-4 w-4" />
              ) : null}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>

        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </Card>
  );
}

interface DashboardStatsProps {
  activeTasks: number;
  productivity: number;
  completedToday: number;
  teamSize: number;
}

export default function DashboardStats({
  activeTasks,
  productivity,
  completedToday,
  teamSize,
}: DashboardStatsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Active Tasks"
        value={activeTasks}
        change={12}
        subtitle="Delegated this week"
      />
      <StatCard
        title="Team Productivity"
        value={`${productivity}%`}
        change={5}
        subtitle="Above target"
      />
      <StatCard
        title="Completed Today"
        value={completedToday}
        change={-3}
        subtitle="Tasks finished"
      />
      <StatCard
        title="Team Size"
        value={teamSize}
        subtitle="Active members"
      />
    </div>
  );
}
