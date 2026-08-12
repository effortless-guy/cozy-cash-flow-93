import { Link } from "@tanstack/react-router";
import { Wallet, Repeat, BookUser, Settings as SettingsIcon } from "lucide-react";

const tabs = [
  { to: "/", label: "Salary", icon: Wallet, exact: true },
  { to: "/subscriptions", label: "Subs", icon: Repeat, exact: false },
  { to: "/khatabook", label: "Khatabook", icon: BookUser, exact: false },
  { to: "/networth", label: "Net Worth", icon: Wallet, exact: false },
  { to: "/settings", label: "Settings", icon: SettingsIcon, exact: false },

] as const;

export function BottomTabs() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-between px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: t.exact }}
              className="group flex flex-1 flex-col items-center gap-1.5 text-muted-foreground data-[status=active]:text-foreground"
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
              <span className="text-[10px] font-semibold uppercase tracking-widest">
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}