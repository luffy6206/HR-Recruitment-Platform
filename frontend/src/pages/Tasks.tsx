import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { taskService } from "@/services";
import type { Task, TaskStatus } from "@/types";
import { format, isPast } from "date-fns";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";



const COLUMNS: { id: TaskStatus; label: string; tone: string }[] = [
  { id: "ASSIGNED", label: "Assigned", tone: "bg-info/10 text-info" },
  { id: "SUBMITTED", label: "Submitted", tone: "bg-primary/10 text-primary" },
  { id: "PASSED", label: "Passed", tone: "bg-success/10 text-success" },
  { id: "FAILED", label: "Failed", tone: "bg-destructive/10 text-destructive" },
];

export default function TasksPage() {
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => taskService.list() });

  const assigned = tasks.filter((t) => t.status === "ASSIGNED").length;
  const submitted = tasks.filter((t) => t.status === "SUBMITTED").length;
  const passed = tasks.filter((t) => t.status === "PASSED").length;
  const failed = tasks.filter((t) => t.status === "FAILED").length;

  return (
    <>
      <PageHeader title="Candidate Assessments" description="Track assessment tasks assigned to candidates." />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Mini label="Assigned" value={assigned} icon={<Clock className="size-4" />} tone="text-info" />
        <Mini label="To Review" value={submitted} icon={<Loader2 className="size-4" />} tone="text-primary" />
        <Mini label="Passed" value={passed} icon={<CheckCircle2 className="size-4" />} tone="text-success" />
        <Mini label="Failed" value={failed} icon={<XCircle className="size-4" />} tone="text-destructive" />
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
                    <p className="text-sm font-medium text-foreground">{t.title}</p>
                    {t.candidateName && <p className="mt-1 text-xs text-muted-foreground">Candidate: {t.candidateName}</p>}
                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{t.startDate ? `Start ${format(new Date(t.startDate), "MMM d")}` : "—"}</span>
                      <span>{t.assigneeName}</span>
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
