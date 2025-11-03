import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import Dashboard from "@/pages/Dashboard";
import Tasks from "@/pages/Tasks";
import Team from "@/pages/Team";
import NotFound from "@/pages/not-found";
import { useState } from "react";

function Router() {
  const [location] = useLocation();

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/team" component={Team} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();

  // Mock notifications - todo: remove mock functionality
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
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar activeItem={location} />
            <div className="flex flex-col flex-1">
              <header className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-40">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <div className="flex items-center gap-2">
                  <NotificationBell
                    notifications={notifications}
                    onMarkAsRead={handleMarkAsRead}
                    onMarkAllRead={handleMarkAllRead}
                  />
                  <ThemeToggle />
                </div>
              </header>
              <main className="flex-1 overflow-auto">
                <div className="container mx-auto p-6 max-w-[1600px]">
                  <Router />
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
