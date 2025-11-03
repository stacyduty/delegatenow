import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "assignment" | "update" | "completion" | "message";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationBellProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllRead?: () => void;
}

const notificationTypeColors = {
  assignment: "bg-chart-1/20 text-chart-1",
  update: "bg-chart-2/20 text-chart-2",
  completion: "bg-status-online/20 text-status-online",
  message: "bg-chart-4/20 text-chart-4",
};

export default function NotificationBell({
  notifications,
  onMarkAsRead,
  onMarkAllRead,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-primary hover:text-primary"
              onClick={onMarkAllRead}
              data-testid="button-mark-all-read"
            >
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover-elevate cursor-pointer transition-colors",
                    !notification.read && "bg-muted/30"
                  )}
                  onClick={() => onMarkAsRead?.(notification.id)}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", notificationTypeColors[notification.type])}
                      >
                        {notification.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{notification.time}</span>
                    </div>
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
