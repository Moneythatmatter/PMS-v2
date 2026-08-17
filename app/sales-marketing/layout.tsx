import { navItems, currentUser } from "@/app/data";
import { salesMarketingNavItems } from "@/app/data/navigation/salesMarketing";
import { AppShell } from "@/components/layout/AppShell";
import { ModuleSidebar } from "@/components/layout/ModuleSidebar";

export default function SalesMarketingLayout({
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
          title="Sales & Marketing"
          subtitle="Hospitality CRM & Banquets"
          items={salesMarketingNavItems}
        />
      }
    >
      {children}
    </AppShell>
  );
}
