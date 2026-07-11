import { navItems, currentUser, housekeepingNavItems } from "@/app/data";
import { AppShell } from "@/components/layout/AppShell";
import { ModuleSidebar } from "@/components/layout/ModuleSidebar";

export default function HousekeepingLayout({
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
          title="Housekeeping"
          subtitle="Rooms & guest services"
          items={housekeepingNavItems}
        />
      }
    >
      {children}
    </AppShell>
  );
}
