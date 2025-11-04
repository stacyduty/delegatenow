import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, Paperclip, CheckSquare, Tag, History, Eye, X, Plus, Send 
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import type { Task, Comment, Attachment, Subtask, Tag as TagType, ActivityLog } from "@shared/schema";

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
  const [commentContent, setCommentContent] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Fetch related data
  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ['/api/tasks', task?.id, 'comments'],
    enabled: !!task,
  });

  const { data: attachments = [] } = useQuery<Attachment[]>({
    queryKey: ['/api/tasks', task?.id, 'attachments'],
    enabled: !!task,
  });

  const { data: subtasks = [] } = useQuery<Subtask[]>({
    queryKey: ['/api/tasks', task?.id, 'subtasks'],
    enabled: !!task,
  });

  const { data: taskTags = [] } = useQuery<TagType[]>({
    queryKey: ['/api/tasks', task?.id, 'tags'],
    enabled: !!task,
  });

  const { data: allTags = [] } = useQuery<TagType[]>({
    queryKey: ['/api/tags'],
    enabled: !!task,
  });

  const { data: activity = [] } = useQuery<ActivityLog[]>({
    queryKey: ['/api/tasks', task?.id, 'activity'],
    enabled: !!task,
  });

  // Mutations
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/tasks/${task?.id}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', task?.id, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', task?.id, 'activity'] });
      setCommentContent("");
    },
  });

  const addSubtaskMutation = useMutation({
    mutationFn: async (title: string) => {
      return apiRequest("POST", `/api/tasks/${task?.id}/subtasks`, { 
        title, 
        order: subtasks.length 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', task?.id, 'subtasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', task?.id, 'activity'] });
      setNewSubtaskTitle("");
    },
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: async (subtaskId: string) => {
      return apiRequest("PATCH", `/api/subtasks/${subtaskId}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', task?.id, 'subtasks'] });
    },
  });

  const addTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const response = await fetch(`/api/tasks/${task?.id}/tags/${tagId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to add tag');
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', task?.id, 'tags'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', task?.id, 'activity'] });
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const response = await fetch(`/api/tasks/${task?.id}/tags/${tagId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove tag');
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', task?.id, 'tags'] });
    },
  });

  if (!task) return null;

  const completedSubtasks = subtasks.filter(st => st.completed).length;
  const subtaskProgress = subtasks.length > 0 
    ? Math.round((completedSubtasks / subtasks.length) * 100) 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-task-detail">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-start justify-between gap-4">
            <div className="flex-1">
              <div>{task.title}</div>
              <div className="flex gap-2 mt-2">
                <Badge variant={task.impact === 'high' ? 'default' : 'outline'}>
                  {task.impact} impact
                </Badge>
                <Badge variant={task.urgency === 'high' ? 'destructive' : 'outline'}>
                  {task.urgency} urgency
                </Badge>
                <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                  {task.status}
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {task.description && (
          <div className="text-sm text-muted-foreground mb-4">
            {task.description}
          </div>
        )}

        <Tabs defaultValue="comments" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="comments" className="flex items-center gap-2" data-testid="tab-comments">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Comments</span>
              {comments.length > 0 && (
                <Badge variant="secondary" className="ml-1">{comments.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="subtasks" className="flex items-center gap-2" data-testid="tab-subtasks">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Subtasks</span>
              {subtasks.length > 0 && (
                <Badge variant="secondary" className="ml-1">{completedSubtasks}/{subtasks.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="attachments" className="flex items-center gap-2" data-testid="tab-attachments">
              <Paperclip className="h-4 w-4" />
              <span className="hidden sm:inline">Files</span>
              {attachments.length > 0 && (
                <Badge variant="secondary" className="ml-1">{attachments.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tags" className="flex items-center gap-2" data-testid="tab-tags">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Tags</span>
              {taskTags.length > 0 && (
                <Badge variant="secondary" className="ml-1">{taskTags.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2" data-testid="tab-activity">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
          </TabsList>

          {/* Comments Tab */}
          <TabsContent value="comments" className="space-y-4 mt-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No comments yet. Start the conversation!
                </div>
              ) : (
                comments.map((comment) => (
                  <Card key={comment.id} data-testid={`comment-${comment.id}`}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium">
                          {comment.userId ? 'Executive' : 'Team Member'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt!), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="flex-1 min-h-20"
                data-testid="textarea-new-comment"
              />
              <Button
                onClick={() => commentContent.trim() && addCommentMutation.mutate(commentContent)}
                disabled={!commentContent.trim() || addCommentMutation.isPending}
                data-testid="button-send-comment"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Subtasks Tab */}
          <TabsContent value="subtasks" className="space-y-4 mt-4">
            {subtasks.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">{subtaskProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300" 
                    style={{ width: `${subtaskProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <div 
                  key={subtask.id} 
                  className="flex items-center gap-2 p-2 rounded-md hover-elevate"
                  data-testid={`subtask-${subtask.id}`}
                >
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={() => toggleSubtaskMutation.mutate(subtask.id)}
                    data-testid={`checkbox-subtask-${subtask.id}`}
                  />
                  <span className={subtask.completed ? "line-through text-muted-foreground" : ""}>
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Add subtask..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSubtaskTitle.trim()) {
                    addSubtaskMutation.mutate(newSubtaskTitle);
                  }
                }}
                data-testid="input-new-subtask"
              />
              <Button
                onClick={() => newSubtaskTitle.trim() && addSubtaskMutation.mutate(newSubtaskTitle)}
                disabled={!newSubtaskTitle.trim() || addSubtaskMutation.isPending}
                data-testid="button-add-subtask"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Attachments Tab */}
          <TabsContent value="attachments" className="space-y-4 mt-4">
            <div className="text-center py-8 text-muted-foreground">
              <Paperclip className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>File attachments coming soon</p>
              <p className="text-xs mt-1">Object storage integration in progress</p>
            </div>
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Tags</span>
              </div>
              
              {taskTags.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No tags added yet
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {taskTags.map((tag) => (
                    <Badge 
                      key={tag.id} 
                      variant="outline"
                      style={{ borderColor: tag.color || undefined }}
                      className="flex items-center gap-1"
                      data-testid={`tag-${tag.id}`}
                    >
                      {tag.name}
                      <button
                        onClick={() => removeTagMutation.mutate(tag.id)}
                        className="ml-1 hover:text-destructive"
                        data-testid={`button-remove-tag-${tag.id}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Available Tags to Add */}
            {allTags.length > 0 && (
              <div className="space-y-3">
                <span className="text-sm font-medium">Add Tags</span>
                <div className="flex flex-wrap gap-2">
                  {allTags
                    .filter(tag => !taskTags.some(tt => tt.id === tag.id))
                    .map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => addTagMutation.mutate(tag.id)}
                        disabled={addTagMutation.isPending}
                        data-testid={`button-add-tag-${tag.id}`}
                      >
                        <Badge 
                          variant="outline"
                          style={{ borderColor: tag.color || undefined }}
                          className="cursor-pointer hover-elevate"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {tag.name}
                        </Badge>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-3 mt-4 max-h-96 overflow-y-auto">
            {activity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No activity yet
              </div>
            ) : (
              activity.map((log) => (
                <div key={log.id} className="flex gap-3 text-sm" data-testid={`activity-${log.id}`}>
                  <div className="flex-shrink-0 w-2 h-2 mt-1.5 rounded-full bg-primary" />
                  <div className="flex-1">
                    <div className="font-medium">{log.action.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.createdAt!), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
