
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { notificationService } from "@/services";
import { Bell, CheckCheck, CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";



const ICONS = {
  INFO: { I: Info, c: "text-info bg-info/10" },
  SUCCESS: { I: CheckCircle2, c: "text-success bg-success/10" },
  WARNING: { I: AlertTriangle, c: "text-accent-foreground bg-accent/20" },
  DANGER: { I: XCircle, c: "text-destructive bg-destructive/10" },
  ASSIGNMENT: { I: Bell, c: "text-primary bg-primary/10" },
  SYSTEM: { I: Info, c: "text-muted-foreground bg-muted/20" },
} as const;

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({ queryKey: ["notifications"], queryFn: () => notificationService.list() });
  const markAll = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markOne = useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const deleteOne = useMutation({
    mutationFn: (id: string) => notificationService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = items.filter((n) => !n.read).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        description={`${unread} unread`}
        actions={
          <button onClick={() => markAll.mutate()} disabled={unread === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">
            <CheckCheck className="size-4" /> Mark all read
          </button>
        }
      />

      {items.length === 0 ? (
        <div className="card-elevated grid place-items-center p-12 text-center">
          <Bell className="mb-2 size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">You're all caught up.</p>
        </div>
      ) : (
        <div className="card-elevated divide-y divide-border">
          {items.map((n) => {
            const { I, c } = ICONS[n.type];
            return (
              <div key={n.id} className={cn("flex items-start justify-between gap-3 border-b border-border p-4 transition", !n.read && "bg-primary/5") }>
                <button
                  type="button"
                  onClick={() => !n.read && markOne.mutate(n.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("mt-0.5 grid size-9 place-items-center rounded-lg", c)}><I className="size-4" /></span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        {!n.read && <span className="size-1.5 rounded-full bg-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{n.body}</p>
                    </div>
                  </div>
                </button>
                <div className="flex flex-col items-end gap-2">
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markOne.mutate(n.id)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Mark as read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteOne.mutate(n.id)}
                    className="text-xs font-semibold text-destructive hover:underline"
                  >
                    Clear
                  </button>
                  <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
