import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "../AppSidebar";

export default function AppSidebarExample() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-[600px] w-full">
        <AppSidebar activeItem="/" />
      </div>
    </SidebarProvider>
  );
}
