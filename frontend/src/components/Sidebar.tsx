import { Link, useLocation } from "react-router-dom";
import {
  Activity, Bell, Briefcase, CalendarCheck, ChartPie, LayoutDashboard, ListChecks, Settings, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type NavItem = { to: string; label: string; icon: typeof Users; adminOnly?: boolean };
const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/candidates", label: "Candidates", icon: Users },
  { to: "/interviews", label: "Interviews", icon: CalendarCheck },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/reports", label: "Reports", icon: ChartPie, adminOnly: true },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/activity", label: "Activity Logs", icon: Activity, adminOnly: true },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();
  const pathname = location.pathname;
  const { user } = useAuth();

  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden",
          open ? "block" : "hidden",
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.62_0.22_320)] shadow-glow">
            <Briefcase className="size-4.5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">Talentflow</p>
            <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60">Recruit OS</p>
          </div>
        </div>

        <nav className="scrollbar-thin flex-1 overflow-y-auto p-3">
          <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Workspace
          </p>
          <ul className="space-y-0.5">
            {NAV.filter((n) => !n.adminOnly || user?.role === "ADMIN").map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className={cn("size-4 transition-transform group-hover:scale-110", active && "text-primary")} />
                    <span className="font-medium">{item.label}</span>
                    {active && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="m-3 rounded-xl bg-sidebar-accent/40 p-4">
          <p className="text-xs font-semibold text-sidebar-accent-foreground">Need help?</p>
          <p className="mt-1 text-[11px] leading-relaxed text-sidebar-foreground/60">
            Check the playbook or ping your account manager.
          </p>
          <button className="mt-3 w-full rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90">
            Open Playbook
          </button>
        </div>
      </aside>
    </>
  );
}
