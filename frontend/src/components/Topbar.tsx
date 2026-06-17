import { Bell, LogOut, Menu, Search, Settings, User as UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { notificationService, searchService } from "@/services";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { socketService } from "@/services/socket";
import { toast } from "sonner";

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  useEffect(() => {
    console.log("[Topbar] Setting up socket event listeners");
    socketService.onNotificationReceived((notification) => {
      console.log("[Topbar] Socket notification received:", notification);
      console.log("[Topbar] Invalidating 'notifications' query...");
      qc.invalidateQueries({ queryKey: ["notifications"] });
      
      if (notification.type === "ASSIGNMENT") {
        console.log("[Topbar] Triggering toast for assignment...");
        toast.info("New Candidate Assigned", {
          description: notification.message,
          action: {
            label: "View",
            onClick: () => navigate("/candidates"),
          },
        });
      }
    });

    return () => {
      console.log("[Topbar] Cleaning up socket event listeners");
      socketService.offNotificationReceived();
    };
  }, [qc, navigate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    setShowSearchDropdown(Boolean(debouncedSearch));
  }, [debouncedSearch]);

  const { data: searchResults = [], isFetching: isSearching } = useQuery<{
    id: string;
    type: string;
    title: string;
    subtitle: string;
    path: string;
  }[]>({
    queryKey: ["search", debouncedSearch],
    queryFn: () => searchService.global(debouncedSearch),
    enabled: Boolean(debouncedSearch),
    staleTime: 10000,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.list(),
    refetchInterval: 10000,
  });
  const markOne = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const deleteOne = useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAll = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const clearAll = useMutation({
    mutationFn: () => notificationService.clearAll(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const assignmentNotifications = notifications.filter((n) => n.type === "ASSIGNMENT" && !n.read);
  const unreadAssignmentCount = assignmentNotifications.length;
  const otherNotifications = notifications.filter((n) => n.type !== "ASSIGNMENT" || n.read);

  const extractCandidateName = (message: string) => {
    return message.split(" assigned to you by ")[0] || "Unknown Candidate";
  };

  const extractPerformerName = (message: string) => {
    return message.split(" assigned to you by ")[1] || "System Admin";
  };

  const initials = user?.name ? user.name.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("") || "U" : "U";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-6">
      <button
        onClick={onToggleSidebar}
        className="grid size-9 place-items-center rounded-lg border border-border bg-card text-foreground/70 hover:bg-muted lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="size-4" />
      </button>

      <div className="hidden flex-1 md:block">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            onFocus={() => setShowSearchDropdown(Boolean(searchText.trim()))}
            placeholder="Search candidates, interviews, tasks…"
            className="w-full rounded-lg border border-input bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
          />
          {showSearchDropdown && (
            <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
              {isSearching ? (
                <div className="p-3 text-sm text-muted-foreground">Searching…</div>
              ) : searchResults.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">No results found.</div>
              ) : (
                <div className="divide-y divide-border">
                  {searchResults.map((result: any) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => {
                        navigate(result.path);
                        setSearchText("");
                        setDebouncedSearch("");
                        setShowSearchDropdown(false);
                      }}
                      className="flex w-full flex-col items-start gap-1 px-3 py-3 text-left transition hover:bg-muted"
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {result.type}
                      </span>
                      <span className="text-sm font-medium text-foreground">{result.title}</span>
                      <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative grid size-9 place-items-center rounded-lg border border-border bg-card text-foreground/70 transition hover:bg-muted">
              <Bell className="size-4" />
              {unreadAssignmentCount > 0 && (
                <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                  {unreadAssignmentCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96">
            <DropdownMenuLabel className="flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {unreadAssignmentCount > 0
                    ? `${unreadAssignmentCount} New Candidate${unreadAssignmentCount > 1 ? "s" : ""} Assigned`
                    : "Notifications"}
                </div>
                <div className="text-xs text-muted-foreground">{notifications.filter(n => !n.read).length} unread total</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => markAll.mutate()} className="text-xs text-primary underline">Mark all</button>
                <button onClick={() => clearAll.mutate()} className="text-xs text-destructive underline">Clear all</button>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-auto">
              {notifications.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">You're all caught up.</div>
              )}
              
              {/* Grouped Assignment Notifications */}
              {unreadAssignmentCount > 0 && (
                <div className="border-b border-border bg-primary/5 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-foreground">New Candidate Assignments</div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(assignmentNotifications[0].createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {assignmentNotifications.map((n) => (
                      <div key={n.id} className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                          <span className="truncate">{extractCandidateName(n.body)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => markOne.mutate(n.id)}
                          className="shrink-0 text-[10px] font-semibold text-primary hover:underline"
                        >
                          Mark read
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5 text-[10px] text-muted-foreground">
                    Assigned by {extractPerformerName(assignmentNotifications[0].body)}
                  </div>
                </div>
              )}

              {/* Other Notifications */}
              {otherNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start justify-between gap-3 border-b border-border px-4 py-3 transition ${n.read ? "bg-transparent opacity-90" : "bg-primary/5"}`}
                >
                  <button
                    type="button"
                    onClick={() => !n.read && markOne.mutate(n.id)}
                    className="min-w-0 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium text-foreground">{n.title}</div>
                      <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{n.body}</div>
                  </button>
                  <div className="flex flex-col gap-1 text-right">
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => markOne.mutate(n.id)}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteOne.mutate(n.id)}
                      className="text-[11px] font-semibold text-destructive hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-lg border border-border bg-card py-1.5 pl-1.5 pr-3 text-sm transition hover:bg-muted">
              <span className="grid size-7 place-items-center rounded-md gradient-primary text-xs font-semibold text-primary-foreground">
                {initials}
              </span>
              <span className="hidden text-left leading-tight md:block">
                <span className="block text-sm font-medium text-foreground">{user?.name}</span>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">{user?.role}</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium">{user?.name}</div>
              <div className="text-xs font-normal text-muted-foreground">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <UserIcon className="mr-2 size-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 size-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { logout(); navigate("/login"); }} className="text-destructive">
              <LogOut className="mr-2 size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
