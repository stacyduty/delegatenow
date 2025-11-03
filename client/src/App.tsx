import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import Dashboard from "@/pages/Dashboard";
import Tasks from "@/pages/Tasks";
import Team from "@/pages/Team";
import Analytics from "@/pages/Analytics";
import DelegationHistory from "@/pages/DelegationHistory";
import Calendar from "@/pages/Calendar";
import Settings from "@/pages/Settings";
import VoiceHistory from "@/pages/VoiceHistory";
import Landing from "@/pages/Landing";
import ProblemFlowDemo from "@/pages/ProblemFlowDemo";
import TeamMemberLogin from "@/pages/TeamMemberLogin";
import AcceptInvitation from "@/pages/AcceptInvitation";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from "react";
import { syncPendingMutations, setupOnlineListener } from "@/lib/offlineSync";
import { initDB } from "@/lib/offlineStorage";

// Protected route component
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path?: string }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/landing" />;
  }

  return <Component {...rest} />;
}

function Router() {
  const [location] = useLocation();

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/landing" component={Landing} />
      <Route path="/flow" component={ProblemFlowDemo} />
      <Route path="/team-login" component={TeamMemberLogin} />
      <Route path="/accept-invitation" component={AcceptInvitation} />
      
      {/* Protected routes */}
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/tasks">
        <ProtectedRoute component={Tasks} />
      </Route>
      <Route path="/team">
        <ProtectedRoute component={Team} />
      </Route>
      <Route path="/analytics">
        <ProtectedRoute component={Analytics} />
      </Route>
      <Route path="/delegation-history">
        <ProtectedRoute component={DelegationHistory} />
      </Route>
      <Route path="/calendar">
        <ProtectedRoute component={Calendar} />
      </Route>
      <Route path="/voice-history">
        <ProtectedRoute component={VoiceHistory} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();

  useEffect(() => {
    async function initializeOffline() {
      try {
        await initDB();
        
        await syncPendingMutations();
        queryClient.invalidateQueries({ queryKey: ['pendingMutations'] });
        console.log('Initial sync complete');
      } catch (err) {
        console.error('Failed to initialize offline functionality:', err);
      }
    }

    initializeOffline();

    const cleanup = setupOnlineListener(() => {
      syncPendingMutations()
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['pendingMutations'] });
          console.log('Successfully synced pending mutations on reconnect');
        })
        .catch((err) => console.error('Failed to sync mutations:', err));
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_MUTATIONS') {
          syncPendingMutations().then(() => {
            queryClient.invalidateQueries({ queryKey: ['pendingMutations'] });
          });
        }
      });
    }

    return cleanup;
  }, []);

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

  // Public pages don't need sidebar
  const isPublicPage = location === "/landing" || location === "/flow" || location === "/team-login" || location === "/accept-invitation";

  if (isPublicPage) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

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
              <OfflineIndicator />
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
