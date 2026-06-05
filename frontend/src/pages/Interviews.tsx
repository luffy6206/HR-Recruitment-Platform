
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarCheck, Plus, Video } from "lucide-react";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { candidateService, interviewService } from "@/services";
import { format, isFuture, isPast, isToday } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";



const schema = z.object({
  candidateId: z.string().min(1, "Choose a candidate"),
  interviewerName: z.string().min(2, "Interviewer name is required"),
  interviewType: z.enum(["HR", "TECHNICAL", "MANAGERIAL", "FINAL"]),
  scheduledAt: z.string().min(1, "Date is required"),
});
type Form = z.infer<typeof schema>;

export default function InterviewsPage() {
  const qc = useQueryClient();
  const { data: interviews = [] } = useQuery({ queryKey: ["interviews"], queryFn: () => interviewService.list() });
  const { data: candidates = [] } = useQuery({ queryKey: ["candidates"], queryFn: () => candidateService.list() });
  const [open, setOpen] = useState(false);

  const upcoming = interviews.filter((i) => i.status === "SCHEDULED" && isFuture(new Date(i.scheduledAt)));
  const today = interviews.filter((i) => isToday(new Date(i.scheduledAt)));
  const completed = interviews.filter((i) => i.status === "COMPLETED" || isPast(new Date(i.scheduledAt)));

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { candidateId: "", interviewerName: "", interviewType: "TECHNICAL", scheduledAt: "" },
  });

  const create = useMutation({
    mutationFn: (d: Form) => interviewService.create({ ...d, scheduledAt: new Date(d.scheduledAt).toISOString() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interviews"] });
      toast.success("Interview scheduled");
      setOpen(false); form.reset();
    },
  });

  return (
    <>
      <PageHeader
        title="Interviews"
        description="Schedule, track and review all interview activity."
        actions={
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95">
            <Plus className="size-4" /> Schedule interview
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Today" value={today.length} accent="primary" />
        <StatCard label="Upcoming" value={upcoming.length} accent="accent" />
        <StatCard label="Completed" value={completed.length} accent="success" />
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="bg-card">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4"><InterviewList items={upcoming} /></TabsContent>
        <TabsContent value="completed" className="mt-4"><InterviewList items={completed} /></TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Schedule new interview</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit((d) => create.mutate(d))} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Candidate</label>
              <select {...form.register("candidateId")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select candidate</option>
                {candidates.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
              </select>
              {form.formState.errors.candidateId && <p className="mt-1 text-xs text-destructive">{form.formState.errors.candidateId.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Interviewer name</label>
              <input {...form.register("interviewerName")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Type</label>
                <select {...form.register("interviewType")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  {["HR", "TECHNICAL", "MANAGERIAL", "FINAL"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Scheduled at</label>
                <input type="datetime-local" {...form.register("scheduledAt")} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted">Cancel</button>
              <button type="submit" disabled={create.isPending} className="rounded-lg gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95 disabled:opacity-60">Schedule</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: "primary" | "accent" | "success" }) {
  const cls = accent === "primary" ? "text-primary bg-primary/10" : accent === "accent" ? "text-accent-foreground bg-accent/20" : "text-success bg-success/10";
  return (
    <div className="card-elevated flex items-center gap-3 p-4">
      <div className={`grid size-10 place-items-center rounded-lg ${cls}`}><CalendarCheck className="size-4" /></div>
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{value}</p></div>
    </div>
  );
}

function InterviewList({ items }: { items: ReturnType<typeof Array<any>> }) {
  if (items.length === 0) return <p className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">No interviews here.</p>;
  return (
    <div className="card-elevated divide-y divide-border">
      {items.map((i: any) => (
        <div key={i.id} className="flex items-center gap-3 p-4">
          <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><Video className="size-4" /></div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{i.candidateName}</p>
            <p className="truncate text-xs text-muted-foreground">{i.interviewType} • {i.interviewerName}</p>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:inline">{format(new Date(i.scheduledAt), "EEE, MMM d • p")}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{i.status}</span>
        </div>
      ))}
    </div>
  );
}
