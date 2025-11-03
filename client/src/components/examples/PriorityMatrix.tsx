import PriorityMatrix from "../PriorityMatrix";

export default function PriorityMatrixExample() {
  const tasks = {
    highImpactHighUrgency: [
      { id: "1", title: "Q1 Marketing Strategy", assignee: "Sarah Chen" },
      { id: "2", title: "Client Presentation", assignee: "Emily Rodriguez" },
    ],
    highImpactLowUrgency: [
      { id: "3", title: "Annual Budget Planning", assignee: "Michael Torres" },
    ],
    lowImpactHighUrgency: [
      { id: "4", title: "Update Team Calendar", assignee: "David Kim" },
    ],
    lowImpactLowUrgency: [
      { id: "5", title: "Office Supplies Order", assignee: "Admin Team" },
    ],
  };

  return <PriorityMatrix tasks={tasks} onTaskClick={(id) => console.log(`Clicked task: ${id}`)} />;
}
