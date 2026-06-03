import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { taskService } from "@/services";
import type { Task, TaskStatus } from "@/types";
import { format, isPast } from "date-fns";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Tasks — Talentflow" }] }),
  component: () => <AppShell><TasksPage /></AppShell>,
});

const COLUMNS: { id: TaskStatus; label: string; tone: string }[] = [
  { id: "TODO", label: "To do", tone: "bg-info/10 text-info" },
  { id: "IN_PROGRESS", label: "In progress", tone: "bg-primary/10 text-primary" },
  { id: "REVIEW", label: "Review", tone: "bg-accent/20 text-accent-foreground" },
  { id: "DONE", label: "Done", tone: "bg-success/10 text-success" },
];

const PRIO_TONE: Record<Task["priority"], string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-info/10 text-info",
  HIGH: "bg-accent/20 text-accent-foreground",
  URGENT: "bg-destructive/10 text-destructive",
};

function TasksPage() {
  const qc = useQueryClient();
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => taskService.list() });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => taskService.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const due = tasks.filter((t) => isPast(new Date(t.dueDate)) && t.status !== "DONE").length;
  const done = tasks.filter((t) => t.status === "DONE").length;
  const inFlight = tasks.filter((t) => t.status === "IN_PROGRESS").length;

  return (
    <>
      <PageHeader title="Tasks" description="Kanban view of recruitment work across your team." />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Mini label="Total" value={tasks.length} icon={<Clock className="size-4" />} />
        <Mini label="In progress" value={inFlight} icon={<Loader2 className="size-4" />} />
        <Mini label="Overdue" value={due} icon={<Clock className="size-4" />} tone="text-destructive" />
        <Mini label="Done" value={done} icon={<CheckCircle2 className="size-4" />} tone="text-success" />
      </div>

      <div className="scrollbar-thin grid grid-cols-1 gap-4 overflow-x-auto md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="card-elevated flex min-h-[60vh] flex-col p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${col.tone}`}>{col.label}</span>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
              </div>
              <ul className="scrollbar-thin flex-1 space-y-2 overflow-y-auto">
                {items.map((t) => (
                  <li key={t.id} className="group rounded-xl border border-border bg-background/50 p-3 transition hover:border-primary/40 hover:shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{t.title}</p>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase ${PRIO_TONE[t.priority]}`}>{t.priority}</span>
                    </div>
                    {t.description && <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>}
                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Due {format(new Date(t.dueDate), "MMM d")}</span>
                      <span>{t.assigneeName}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-1">
                      {COLUMNS.filter((c) => c.id !== col.id).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => update.mutate({ id: t.id, status: c.id })}
                          className="rounded-md border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground transition hover:border-primary hover:text-primary"
                        >→ {c.label}</button>
                      ))}
                    </div>
                  </li>
                ))}
                {items.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">No tasks</p>}
              </ul>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Mini({ label, value, icon, tone = "text-primary" }: { label: string; value: number; icon: React.ReactNode; tone?: string }) {
  return (
    <div className="card-elevated flex items-center gap-3 p-4">
      <span className={`grid size-9 place-items-center rounded-lg bg-muted ${tone}`}>{icon}</span>
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-semibold">{value}</p></div>
    </div>
  );
}
