import TaskCard from "../TaskCard";

export default function TaskCardExample() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <TaskCard
        id="1"
        title="Develop Q1 Marketing Strategy"
        impact="high"
        urgency="high"
        assignee={{ name: "Sarah Chen", avatar: "" }}
        progress={65}
        dueDate="in 2 days"
        status="in_progress"
        onClick={() => console.log("Task clicked: Q1 Marketing Strategy")}
      />
      <TaskCard
        id="2"
        title="Review Budget Allocations"
        impact="high"
        urgency="medium"
        assignee={{ name: "Michael Torres", avatar: "" }}
        progress={30}
        dueDate="in 5 days"
        status="delegated"
        onClick={() => console.log("Task clicked: Budget Allocations")}
      />
      <TaskCard
        id="3"
        title="Update Client Presentation Deck"
        impact="medium"
        urgency="high"
        assignee={{ name: "Emily Rodriguez", avatar: "" }}
        progress={90}
        dueDate="tomorrow"
        status="review"
        onClick={() => console.log("Task clicked: Client Presentation")}
      />
    </div>
  );
}
