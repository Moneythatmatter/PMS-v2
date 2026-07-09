import { navItems, currentUser, frontOfficeNavItems } from "@/app/data";
import { AppShell } from "@/components/layout/AppShell";
import { ModuleSidebar } from "@/components/layout/ModuleSidebar";
import { FrontOfficeSubNav } from "@/components/frontoffice/FrontOfficeSubNav";

export default function FrontOfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      navItems={navItems}
      user={currentUser}
      subNav={<FrontOfficeSubNav />}
      moduleSidebar={
        <ModuleSidebar
          title="Front Office"
          subtitle="Module menu"
          items={frontOfficeNavItems}
        />
      }
    >
      {children}
    </AppShell>
  );
}
