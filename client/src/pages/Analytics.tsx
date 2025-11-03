import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity, TrendingUp, Users, Target } from "lucide-react";

interface Task {
  id: string;
  title: string;
  status: string;
  impact: "low" | "medium" | "high";
  urgency: "low" | "medium" | "high";
  progress: number;
  completedAt: string | null;
  createdAt: string;
}

interface TeamMember {
  id: string;
  name: string;
  completionRate: number;
  tasksAssigned: number;
}

interface DashboardStats {
  activeTasks: number;
  productivity: number;
  completedToday: number;
  teamSize: number;
}

export default function Analytics() {
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: teamMembers = [], isLoading: teamLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (tasksLoading || teamLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  const statusDistribution = [
    { name: "Delegated", value: tasks.filter(t => t.status === "delegated").length, color: "hsl(var(--chart-1))" },
    { name: "In Progress", value: tasks.filter(t => t.status === "in_progress").length, color: "hsl(var(--chart-2))" },
    { name: "Review", value: tasks.filter(t => t.status === "review").length, color: "hsl(var(--chart-3))" },
    { name: "Completed", value: tasks.filter(t => t.status === "completed").length, color: "hsl(var(--chart-4))" },
  ].filter(item => item.value > 0);

  const impactUrgencyMatrix = [
    { 
      name: "High Impact / High Urgency", 
      value: tasks.filter(t => t.impact === "high" && t.urgency === "high").length,
      color: "hsl(var(--destructive))"
    },
    { 
      name: "High Impact / Low Urgency", 
      value: tasks.filter(t => t.impact === "high" && (t.urgency === "low" || t.urgency === "medium")).length,
      color: "hsl(var(--chart-2))"
    },
    { 
      name: "Low Impact / High Urgency", 
      value: tasks.filter(t => (t.impact === "low" || t.impact === "medium") && t.urgency === "high").length,
      color: "hsl(var(--chart-3))"
    },
    { 
      name: "Low Impact / Low Urgency", 
      value: tasks.filter(t => (t.impact === "low" || t.impact === "medium") && (t.urgency === "low" || t.urgency === "medium")).length,
      color: "hsl(var(--muted))"
    },
  ].filter(item => item.value > 0);

  const teamPerformance = teamMembers
    .map(member => ({
      name: member.name,
      completionRate: member.completionRate,
      tasksAssigned: member.tasksAssigned,
    }))
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 10);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const taskCompletionTrend = last7Days.map(date => {
    const completed = tasks.filter(t => {
      if (!t.completedAt) return false;
      return t.completedAt.split('T')[0] === date;
    }).length;
    
    const created = tasks.filter(t => {
      return t.createdAt.split('T')[0] === date;
    }).length;

    const dateObj = new Date(date);
    return {
      date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completed,
      created,
    };
  });

  const avgCompletionRate = teamMembers.length > 0
    ? Math.round(teamMembers.reduce((sum, m) => sum + m.completionRate, 0) / teamMembers.length)
    : 0;

  const totalTasksCompleted = tasks.filter(t => t.status === "completed").length;
  const completionRate = tasks.length > 0 
    ? Math.round((totalTasksCompleted / tasks.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-analytics">Analytics</h1>
        <p className="text-muted-foreground">Insights and performance metrics for your team</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-tasks">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeTasks} active
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-completion-rate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {totalTasksCompleted} completed
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-team-productivity">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Productivity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.productivity}%</div>
            <p className="text-xs text-muted-foreground">
              Avg completion rate
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-team-size">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.teamSize}</div>
            <p className="text-xs text-muted-foreground">
              Active members
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="team" data-testid="tab-team">Team Performance</TabsTrigger>
          <TabsTrigger value="priority" data-testid="tab-priority">Priority Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card data-testid="card-task-trends">
              <CardHeader>
                <CardTitle>Task Trends (7 Days)</CardTitle>
                <CardDescription>Tasks created vs completed</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={taskCompletionTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px"
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="created" stroke="hsl(var(--chart-1))" name="Created" strokeWidth={2} />
                    <Line type="monotone" dataKey="completed" stroke="hsl(var(--chart-2))" name="Completed" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card data-testid="card-status-distribution">
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
                <CardDescription>Current task breakdown by status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card data-testid="card-team-performance">
            <CardHeader>
              <CardTitle>Top Team Performers</CardTitle>
              <CardDescription>Team members ranked by completion rate</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={teamPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} className="text-xs" />
                  <YAxis dataKey="name" type="category" width={150} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px"
                    }}
                  />
                  <Legend />
                  <Bar dataKey="completionRate" fill="hsl(var(--chart-1))" name="Completion Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priority" className="space-y-4">
          <Card data-testid="card-priority-matrix">
            <CardHeader>
              <CardTitle>Impact/Urgency Matrix</CardTitle>
              <CardDescription>Task distribution by impact and urgency</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={impactUrgencyMatrix}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" angle={-45} textAnchor="end" height={100} />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px"
                    }}
                  />
                  <Bar dataKey="value" name="Tasks">
                    {impactUrgencyMatrix.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
