import { navItems, currentUser } from "@/app/data";
import { maintenanceNavItems } from "@/app/data/navigation/maintenance";
import { AppShell } from "@/components/layout/AppShell";
import { ModuleSidebar } from "@/components/layout/ModuleSidebar";

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      navItems={navItems}
      user={currentUser}
      moduleSidebar={
        <ModuleSidebar
          title="Maintenance"
          subtitle="Engineering & Work Orders"
          items={maintenanceNavItems}
        />
      }
    >
      {children}
    </AppShell>
  );
}
