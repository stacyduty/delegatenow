import { useState } from "react";
import TaskCard from "@/components/TaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter } from "lucide-react";

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - todo: remove mock functionality
  const tasks = [
    {
      id: "1",
      title: "Develop Q1 Marketing Strategy",
      impact: "high" as const,
      urgency: "high" as const,
      assignee: { name: "Sarah Chen", avatar: "" },
      progress: 65,
      dueDate: "in 2 days",
      status: "in_progress" as const,
    },
    {
      id: "2",
      title: "Review Budget Allocations",
      impact: "high" as const,
      urgency: "medium" as const,
      assignee: { name: "Michael Torres", avatar: "" },
      progress: 30,
      dueDate: "in 5 days",
      status: "delegated" as const,
    },
    {
      id: "3",
      title: "Update Client Presentation Deck",
      impact: "medium" as const,
      urgency: "high" as const,
      assignee: { name: "Emily Rodriguez", avatar: "" },
      progress: 90,
      dueDate: "tomorrow",
      status: "review" as const,
    },
    {
      id: "4",
      title: "Prepare Quarterly Reports",
      impact: "high" as const,
      urgency: "medium" as const,
      assignee: { name: "David Kim", avatar: "" },
      progress: 45,
      dueDate: "in 1 week",
      status: "in_progress" as const,
    },
    {
      id: "5",
      title: "Team Training Session",
      impact: "medium" as const,
      urgency: "low" as const,
      assignee: { name: "Sarah Chen", avatar: "" },
      progress: 100,
      dueDate: "completed",
      status: "completed" as const,
    },
  ];

  const filterByStatus = (status: string) => {
    if (status === "all") return tasks;
    return tasks.filter((task) => task.status === status);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Active Tasks</h1>
        <p className="text-muted-foreground">Manage and track all delegated tasks</p>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-tasks"
          />
        </div>
        <Button variant="outline" data-testid="button-filter-tasks">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-tasks">All</TabsTrigger>
          <TabsTrigger value="delegated" data-testid="tab-delegated">Delegated</TabsTrigger>
          <TabsTrigger value="in_progress" data-testid="tab-in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="review" data-testid="tab-review">Review</TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                {...task}
                onClick={() => console.log(`Clicked task: ${task.title}`)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="delegated" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filterByStatus("delegated").map((task) => (
              <TaskCard
                key={task.id}
                {...task}
                onClick={() => console.log(`Clicked task: ${task.title}`)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filterByStatus("in_progress").map((task) => (
              <TaskCard
                key={task.id}
                {...task}
                onClick={() => console.log(`Clicked task: ${task.title}`)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="review" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filterByStatus("review").map((task) => (
              <TaskCard
                key={task.id}
                {...task}
                onClick={() => console.log(`Clicked task: ${task.title}`)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filterByStatus("completed").map((task) => (
              <TaskCard
                key={task.id}
                {...task}
                onClick={() => console.log(`Clicked task: ${task.title}`)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
