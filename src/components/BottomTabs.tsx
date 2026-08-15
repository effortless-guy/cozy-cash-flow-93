import { Link } from "@tanstack/react-router";
import { Wallet, Repeat, BookUser, Settings as SettingsIcon, LogOut } from "lucide-react";
import { useAuth } from "../lib/auth-store";

const tabs = [
  { to: "/", label: "Money", icon: Wallet, exact: true },
  { to: "/subscriptions", label: "Subs", icon: Repeat, exact: false },
  { to: "/khatabook", label: "Khatabook", icon: BookUser, exact: false },
  { to: "/networth", label: "Net Worth", icon: Wallet, exact: false },
  { to: "/settings", label: "Settings", icon: SettingsIcon, exact: false },
] as const;

export function BottomTabs() {
  const { auth, logout } = useAuth();
  
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-md dark:bg-black/40">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: t.exact }}
              onClick={() => {
                // UI state is now auto-persisted via useUIState
              }}
              className="group relative flex flex-1 flex-col items-center gap-1.5 text-muted-foreground data-[status=active]:text-foreground"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-foreground scale-x-0 group-data-[status=active]:scale-x-100 transition-transform duration-200" />
              <Icon className="h-5 w-5" strokeWidth={2} />
              <span className="text-[10px] font-semibold uppercase tracking-widest">
                {t.label}
              </span>
            </Link>
          );
        })}

        {auth?.isEnabled && (
          <button
            onClick={logout}
            className="group flex flex-1 flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-5 w-5" strokeWidth={2} />
            <span className="text-[10px] font-semibold uppercase tracking-widest">
              Lock
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}
