import { navItems, currentUser, accountsNavItems } from "@/app/data";
import { AppShell } from "@/components/layout/AppShell";
import { ModuleSidebar } from "@/components/layout/ModuleSidebar";
import { AccountsSubNav } from "@/components/accounts/AccountsSubNav";

export default function AccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      navItems={navItems}
      user={currentUser}
      subNav={<AccountsSubNav />}
      moduleSidebar={
        <ModuleSidebar
          title="Accounts"
          subtitle="Accounts Module"
          items={accountsNavItems}
        />
      }
    >
      {children}
    </AppShell>
  );
}
