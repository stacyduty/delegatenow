import { useState } from "react";
import TeamMemberCard from "@/components/TeamMemberCard";
import AddTeamMemberDialog from "@/components/AddTeamMemberDialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function Team() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data - todo: remove mock functionality
  const [teamMembers] = useState([
    {
      id: "1",
      name: "Sarah Chen",
      role: "Marketing Director",
      activeTasks: 3,
      completionRate: 92,
    },
    {
      id: "2",
      name: "Michael Torres",
      role: "Finance Manager",
      activeTasks: 5,
      completionRate: 87,
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      role: "Operations Lead",
      activeTasks: 2,
      completionRate: 95,
    },
    {
      id: "4",
      name: "David Kim",
      role: "Product Manager",
      activeTasks: 4,
      completionRate: 88,
    },
    {
      id: "5",
      name: "Jessica Wong",
      role: "Sales Director",
      activeTasks: 6,
      completionRate: 91,
    },
    {
      id: "6",
      name: "Alex Johnson",
      role: "HR Manager",
      activeTasks: 3,
      completionRate: 93,
    },
  ]);

  const handleAddMember = (member: { name: string; role: string; email: string }) => {
    console.log("Adding new team member:", member);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground">
            Manage your team and assign tasks (Unlimited on Executive Plan)
          </p>
        </div>
        <AddTeamMemberDialog onAdd={handleAddMember} />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search team members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-team"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {teamMembers.map((member) => (
          <TeamMemberCard
            key={member.id}
            {...member}
            onClick={() => console.log(`Clicked member: ${member.name}`)}
          />
        ))}
      </div>
    </div>
  );
}
