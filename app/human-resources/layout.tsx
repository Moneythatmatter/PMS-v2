import { navItems, currentUser } from "@/app/data";
import { humanResourcesNavItems } from "@/app/data/navigation/humanResources";
import { AppShell } from "@/components/layout/AppShell";
import { ModuleSidebar } from "@/components/layout/ModuleSidebar";

export default function HumanResourcesLayout({
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
          title="Human Resource"
          subtitle="HR Management System"
          items={humanResourcesNavItems}
        />
      }
    >
      {children}
    </AppShell>
  );
}
