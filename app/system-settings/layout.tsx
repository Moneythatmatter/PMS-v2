import { navItems, currentUser, systemSettingsNavItems } from "@/app/data";
import { AppShell } from "@/components/layout/AppShell";
import { ModuleSidebar } from "@/components/layout/ModuleSidebar";

export default function SystemSettingsLayout({
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
          title="System Settings"
          subtitle="Administration & audit"
          items={systemSettingsNavItems}
        />
      }
    >
      {children}
    </AppShell>
  );
}
