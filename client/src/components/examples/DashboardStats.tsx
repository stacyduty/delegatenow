import DashboardStats from "../DashboardStats";

export default function DashboardStatsExample() {
  return (
    <DashboardStats
      activeTasks={24}
      productivity={94}
      completedToday={8}
      teamSize={12}
    />
  );
}
