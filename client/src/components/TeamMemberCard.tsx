import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface TeamMemberCardProps {
  name: string;
  role: string;
  avatar?: string;
  activeTasks: number;
  completionRate: number;
  onClick?: () => void;
}

export default function TeamMemberCard({
  name,
  role,
  avatar,
  activeTasks,
  completionRate,
  onClick,
}: TeamMemberCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card
      className="p-6 hover-elevate active-elevate-2 cursor-pointer transition-all"
      onClick={onClick}
      data-testid={`card-team-member-${name.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="text-lg font-medium">{initials}</AvatarFallback>
        </Avatar>

        <div className="space-y-1">
          <h3 className="font-semibold" data-testid="text-member-name">{name}</h3>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>

        <div className="flex items-center gap-4 w-full justify-around pt-2 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-chart-1">{activeTasks}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <CheckCircle2 className="h-4 w-4 text-status-online" />
              <span className="text-2xl font-bold">{completionRate}%</span>
            </div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
