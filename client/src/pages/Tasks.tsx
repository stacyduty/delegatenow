import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import TaskCard from "@/components/TaskCard";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import { TagManager } from "@/components/TagManager";
import { TemplateManager } from "@/components/TemplateManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter } from "lucide-react";
import type { Task, TeamMember } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const formattedTasks = useMemo(() => {
    return tasks.map(task => {
      const teamMember = teamMembers.find(tm => tm.id === task.teamMemberId);
      return {
        id: task.id,
        title: task.title,
        impact: task.impact as "low" | "medium" | "high",
        urgency: task.urgency as "low" | "medium" | "high",
        assignee: teamMember ? { name: teamMember.name, avatar: teamMember.avatar || "" } : undefined,
        progress: task.progress || 0,
        dueDate: task.dueDate ? formatDistanceToNow(new Date(task.dueDate), { addSuffix: true }) : "No due date",
        status: task.status as "delegated" | "in_progress" | "review" | "completed",
      };
    });
  }, [tasks, teamMembers]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return formattedTasks;
    const query = searchQuery.toLowerCase();
    return formattedTasks.filter(task => 
      task.title.toLowerCase().includes(query) ||
      task.assignee?.name.toLowerCase().includes(query)
    );
  }, [formattedTasks, searchQuery]);

  const filterByStatus = (status: string) => {
    if (status === "all") return filteredTasks;
    return filteredTasks.filter((task) => task.status === status);
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
        <div className="flex gap-2">
          <TagManager />
          <TemplateManager />
          <Button variant="outline" data-testid="button-filter-tasks">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
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
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-lg" data-testid={`skeleton-task-${i}`} />
              ))}
            </div>
          ) : filteredTasks.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  {...task}
                  onClick={() => {
                  const fullTask = tasks.find(t => t.id === task.id);
                  setSelectedTask(fullTask || null);
                  setIsDetailModalOpen(true);
                }}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8" data-testid="text-no-tasks">
              {searchQuery ? "No tasks found matching your search." : "No tasks yet. Create tasks using voice delegation!"}
            </p>
          )}
        </TabsContent>

        <TabsContent value="delegated" className="space-y-6 mt-6">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          ) : filterByStatus("delegated").length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filterByStatus("delegated").map((task) => (
                <TaskCard
                  key={task.id}
                  {...task}
                  onClick={() => {
                  const fullTask = tasks.find(t => t.id === task.id);
                  setSelectedTask(fullTask || null);
                  setIsDetailModalOpen(true);
                }}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No delegated tasks.</p>
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-6 mt-6">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          ) : filterByStatus("in_progress").length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filterByStatus("in_progress").map((task) => (
                <TaskCard
                  key={task.id}
                  {...task}
                  onClick={() => {
                  const fullTask = tasks.find(t => t.id === task.id);
                  setSelectedTask(fullTask || null);
                  setIsDetailModalOpen(true);
                }}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No tasks in progress.</p>
          )}
        </TabsContent>

        <TabsContent value="review" className="space-y-6 mt-6">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          ) : filterByStatus("review").length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filterByStatus("review").map((task) => (
                <TaskCard
                  key={task.id}
                  {...task}
                  onClick={() => {
                  const fullTask = tasks.find(t => t.id === task.id);
                  setSelectedTask(fullTask || null);
                  setIsDetailModalOpen(true);
                }}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No tasks in review.</p>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-6 mt-6">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          ) : filterByStatus("completed").length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filterByStatus("completed").map((task) => (
                <TaskCard
                  key={task.id}
                  {...task}
                  onClick={() => {
                  const fullTask = tasks.find(t => t.id === task.id);
                  setSelectedTask(fullTask || null);
                  setIsDetailModalOpen(true);
                }}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No completed tasks.</p>
          )}
        </TabsContent>
      </Tabs>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      />
    </div>
  );
}
