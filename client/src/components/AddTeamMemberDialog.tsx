import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

interface AddTeamMemberDialogProps {
  onAdd?: (member: { name: string; role: string; email: string }) => void;
}

export default function AddTeamMemberDialog({ onAdd }: AddTeamMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && role && email) {
      onAdd?.({ name, role, email });
      setName("");
      setRole("");
      setEmail("");
      setOpen(false);
      console.log("Added team member:", { name, role, email });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-team-member">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add a new team member to assign tasks to. Unlimited members on Executive Plan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sarah Chen"
              required
              data-testid="input-member-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Marketing Director"
              required
              data-testid="input-member-role"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@company.com"
              required
              data-testid="input-member-email"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" data-testid="button-submit-member">
              Add Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
