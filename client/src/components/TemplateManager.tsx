import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { TaskTemplate } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function TemplateManager() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState<"low" | "medium" | "high">("medium");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("medium");
  const { toast } = useToast();

  const { data: templates = [] } = useQuery<TaskTemplate[]>({
    queryKey: ['/api/templates'],
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string | null;
      impact: string;
      urgency: string;
    }) => {
      return apiRequest('POST', '/api/templates', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      setTitle("");
      setDescription("");
      setImpact("medium");
      setUrgency("medium");
      toast({
        title: "Template created",
        description: "Your task template has been saved.",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      toast({
        title: "Template deleted",
        description: "The template has been removed.",
      });
    },
  });

  const handleCreateTemplate = () => {
    if (!title.trim()) return;
    createTemplateMutation.mutate({
      title: title.trim(),
      description: description.trim() || null,
      impact,
      urgency,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-manage-templates">
          <FileText className="h-4 w-4 mr-2" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-template-manager">
        <DialogHeader>
          <DialogTitle>Task Templates</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Template */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create New Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input
                  placeholder="Template title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="input-template-title"
                />
              </div>

              <div>
                <Label>Description (optional)</Label>
                <Textarea
                  placeholder="Template description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-20"
                  data-testid="textarea-template-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Impact</Label>
                  <Select value={impact} onValueChange={(v) => setImpact(v as any)}>
                    <SelectTrigger data-testid="select-template-impact">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Urgency</Label>
                  <Select value={urgency} onValueChange={(v) => setUrgency(v as any)}>
                    <SelectTrigger data-testid="select-template-urgency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleCreateTemplate}
                disabled={!title.trim() || createTemplateMutation.isPending}
                className="w-full"
                data-testid="button-save-template"
              >
                <Plus className="h-4 w-4 mr-2" />
                Save Template
              </Button>
            </CardContent>
          </Card>

          {/* Existing Templates */}
          <div className="space-y-3">
            <Label>Saved Templates</Label>
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No templates yet. Create your first template above!
              </p>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <Card key={template.id} data-testid={`template-${template.id}`}>
                    <CardHeader className="py-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm">{template.title}</CardTitle>
                          {template.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {template.description}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs px-2 py-0.5 bg-muted rounded">
                              {template.impact} impact
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-muted rounded">
                              {template.urgency} urgency
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTemplateMutation.mutate(template.id)}
                          data-testid={`button-delete-template-${template.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
