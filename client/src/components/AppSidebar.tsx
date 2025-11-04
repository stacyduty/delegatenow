import { Home, ListTodo, Users, BarChart3, Mic, Settings, Crown, ScrollText, Calendar, Mail } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Active Tasks",
    url: "/tasks",
    icon: ListTodo,
  },
  {
    title: "Team Members",
    url: "/team",
    icon: Users,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Delegation History",
    url: "/delegation-history",
    icon: ScrollText,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Email Tasks",
    url: "/email-tasks",
    icon: Mail,
  },
  {
    title: "Voice History",
    url: "/voice-history",
    icon: Mic,
  },
];

interface AppSidebarProps {
  activeItem?: string;
}

export default function AppSidebar({ activeItem = "/" }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            D8
          </div>
          <div>
            <h2 className="font-bold text-lg">Deleg8te.ai</h2>
            <p className="text-xs text-muted-foreground">WeighPay Group Inc.</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeItem === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-testid="link-settings">
                  <a href="/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
          <Crown className="h-4 w-4 text-chart-4" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Executive Plan</p>
            <p className="text-xs text-muted-foreground">$1/month/user</p>
          </div>
          <Badge variant="secondary" className="bg-status-online/20 text-status-online">
            Active
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
