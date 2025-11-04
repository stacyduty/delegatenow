import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Tag } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#ec4899", // pink
];

export function TagManager() {
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0]);
  const { toast } = useToast();

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ['/api/tags'],
  });

  const createTagMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      return apiRequest('POST', '/api/tags', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
      setNewTagName("");
      setSelectedColor(DEFAULT_COLORS[0]);
      toast({
        title: "Tag created",
        description: "Your new tag has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create tag. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    createTagMutation.mutate({
      name: newTagName.trim(),
      color: selectedColor,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-manage-tags">
          <TagIcon className="h-4 w-4 mr-2" />
          Manage Tags
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-testid="modal-tag-manager">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create New Tag */}
          <div className="space-y-3">
            <Label>Create New Tag</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTagName.trim()) {
                    handleCreateTag();
                  }
                }}
                data-testid="input-new-tag-name"
              />
              <Button
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || createTagMutation.isPending}
                data-testid="button-create-tag"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Color</Label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-md border-2 transition-all ${
                      selectedColor === color ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    data-testid={`color-${color}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Existing Tags */}
          <div className="space-y-2">
            <Label>Your Tags</Label>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tags yet. Create your first tag above!
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    style={{ borderColor: tag.color || undefined }}
                    className="flex items-center gap-1"
                    data-testid={`existing-tag-${tag.id}`}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
