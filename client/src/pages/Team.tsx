import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import TeamMemberCard from "@/components/TeamMemberCard";
import AddTeamMemberDialog from "@/components/AddTeamMemberDialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import type { TeamMember } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Team() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: teamMembers = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team-members"],
  });

  const addMemberMutation = useMutation({
    mutationFn: async (member: { name: string; role: string; email: string }) => {
      const res = await apiRequest("POST", "/api/team-members", member);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      toast({
        title: "Team member added",
        description: "New team member has been added successfully.",
      });
    },
    onError: (error) => {
      console.error("Error adding team member:", error);
      toast({
        title: "Error",
        description: "Failed to add team member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return teamMembers;
    const query = searchQuery.toLowerCase();
    return teamMembers.filter(member => 
      member.name.toLowerCase().includes(query) ||
      member.role.toLowerCase().includes(query)
    );
  }, [teamMembers, searchQuery]);

  const handleAddMember = (member: { name: string; role: string; email: string }) => {
    addMemberMutation.mutate(member);
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

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" data-testid={`skeleton-member-${i}`} />
          ))}
        </div>
      ) : filteredMembers.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {filteredMembers.map((member) => (
            <TeamMemberCard
              key={member.id}
              name={member.name}
              role={member.role}
              activeTasks={member.activeTasks || 0}
              completionRate={member.completionRate || 0}
              onClick={() => console.log(`Clicked member: ${member.name}`)}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8" data-testid="text-no-members">
          {searchQuery ? "No team members found matching your search." : "No team members yet. Add your first team member!"}
        </p>
      )}
    </div>
  );
}
