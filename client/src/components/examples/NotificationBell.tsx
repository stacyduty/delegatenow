import { useState } from "react";
import NotificationBell from "../NotificationBell";

export default function NotificationBellExample() {
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "assignment" as const,
      title: "New task assigned",
      message: "You delegated 'Q1 Marketing Strategy' to Sarah Chen",
      time: "2m ago",
      read: false,
    },
    {
      id: "2",
      type: "completion" as const,
      title: "Task completed",
      message: "Emily Rodriguez completed 'Update Client Presentation Deck'",
      time: "1h ago",
      read: false,
    },
    {
      id: "3",
      type: "update" as const,
      title: "Progress update",
      message: "Michael Torres updated 'Review Budget Allocations' to 45%",
      time: "3h ago",
      read: true,
    },
  ]);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    console.log(`Marked notification ${id} as read`);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    console.log("Marked all notifications as read");
  };

  return (
    <NotificationBell
      notifications={notifications}
      onMarkAsRead={handleMarkAsRead}
      onMarkAllRead={handleMarkAllRead}
    />
  );
}
