import TeamMemberCard from "../TeamMemberCard";

export default function TeamMemberCardExample() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <TeamMemberCard
        name="Sarah Chen"
        role="Marketing Director"
        activeTasks={3}
        completionRate={92}
        onClick={() => console.log("Clicked: Sarah Chen")}
      />
      <TeamMemberCard
        name="Michael Torres"
        role="Finance Manager"
        activeTasks={5}
        completionRate={87}
        onClick={() => console.log("Clicked: Michael Torres")}
      />
      <TeamMemberCard
        name="Emily Rodriguez"
        role="Operations Lead"
        activeTasks={2}
        completionRate={95}
        onClick={() => console.log("Clicked: Emily Rodriguez")}
      />
      <TeamMemberCard
        name="David Kim"
        role="Product Manager"
        activeTasks={4}
        completionRate={88}
        onClick={() => console.log("Clicked: David Kim")}
      />
    </div>
  );
}
