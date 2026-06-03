import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, CalendarCheck, CheckCircle2, ChevronRight, ListChecks, TrendingUp, UserPlus, Users, XCircle,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { DashboardCard } from "@/components/DashboardCard";
import { candidateService, dashboardService, interviewService, reportService, taskService } from "@/services";
import { StatusBadge } from "@/components/StatusBadge";
import { format, formatDistanceToNow } from "date-fns";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Talentflow" }] }),
  component: () => <AppShell><DashboardPage /></AppShell>,
});

const PIE_COLORS = ["oklch(0.55 0.24 305)", "oklch(0.78 0.16 78)", "oklch(0.65 0.17 240)", "oklch(0.72 0.18 150)", "oklch(0.63 0.23 25)", "oklch(0.6 0.05 280)"];

function DashboardPage() {
  const { data: stats } = useQuery({ queryKey: ["dashboard"], queryFn: () => dashboardService.get() });
  const { data: candidates = [] } = useQuery({ queryKey: ["candidates"], queryFn: () => candidateService.list() });
  const { data: interviews = [] } = useQuery({ queryKey: ["interviews"], queryFn: () => interviewService.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => taskService.list() });
  const { data: reports } = useQuery({ queryKey: ["reports"], queryFn: () => reportService.get() });

  const funnel = [
    { stage: "Applied", count: candidates.length },
    { stage: "Contacted", count: candidates.filter((c) => c.status === "CONTACTED").length + candidates.filter((c) => c.status !== "NEW").length },
    { stage: "Interview", count: candidates.filter((c) => c.status === "INTERVIEW" || c.status === "SELECTED").length },
    { stage: "Selected", count: candidates.filter((c) => c.status === "SELECTED").length },
  ];

  const distribution = ["NEW", "CONTACTED", "INTERVIEW", "SELECTED", "DROPPED", "ON_HOLD"].map((s) => ({
    name: s,
    value: candidates.filter((c) => c.status === s).length,
  }));

  const upcomingInterviews = interviews
    .filter((i) => i.status === "SCHEDULED")
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))
    .slice(0, 4);

  const dueTasks = tasks
    .filter((t) => t.status !== "DONE")
    .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
    .slice(0, 4);

  const recentActivity = candidates.slice(0, 5);

  return (
    <>
      <PageHeader
        title="Recruitment overview"
        description="Real-time pulse of your pipeline, team activity, and upcoming work."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardCard label="Total Candidates" value={stats?.totalCandidates ?? "—"} icon={<Users className="size-5" />} trend={12} accent="primary" />
        <DashboardCard label="Contacted" value={stats?.contactedCandidates ?? "—"} icon={<UserPlus className="size-5" />} trend={4} accent="info" />
        <DashboardCard label="Selected" value={stats?.selectedCandidates ?? "—"} icon={<CheckCircle2 className="size-5" />} trend={8} accent="success" />
        <DashboardCard label="Dropped" value={stats?.droppedCandidates ?? "—"} icon={<XCircle className="size-5" />} trend={-3} accent="danger" />
        <DashboardCard label="Follow-ups Today" value={stats?.followUpsToday ?? "—"} icon={<CalendarCheck className="size-5" />} trend={2} accent="accent" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Hiring trend */}
        <div className="card-elevated p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Hiring trend</h3>
              <p className="text-xs text-muted-foreground">Applied vs. interviewed vs. hired</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
              <TrendingUp className="size-3" /> +18% MoM
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reports?.hiringTrend ?? []}>
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.55 0.24 305)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="oklch(0.55 0.24 305)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.78 0.16 78)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="oklch(0.78 0.16 78)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 290)" />
                <XAxis dataKey="month" stroke="oklch(0.52 0.025 268)" fontSize={12} />
                <YAxis stroke="oklch(0.52 0.025 268)" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.9 0.02 290)" }} />
                <Area dataKey="applied" stroke="oklch(0.55 0.24 305)" fill="url(#g1)" strokeWidth={2} />
                <Area dataKey="interviewed" stroke="oklch(0.78 0.16 78)" fill="url(#g2)" strokeWidth={2} />
                <Area dataKey="hired" stroke="oklch(0.72 0.18 150)" fill="oklch(0.72 0.18 150 / 0.2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status distribution */}
        <div className="card-elevated p-5">
          <h3 className="text-base font-semibold text-foreground">Candidate status</h3>
          <p className="text-xs text-muted-foreground">Distribution across pipeline</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={88} paddingAngle={3}>
                  {distribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Funnel */}
        <div className="card-elevated p-5">
          <h3 className="text-base font-semibold text-foreground">Recruitment funnel</h3>
          <p className="text-xs text-muted-foreground">Conversion across stages</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 290)" />
                <XAxis type="number" stroke="oklch(0.52 0.025 268)" fontSize={12} />
                <YAxis type="category" dataKey="stage" stroke="oklch(0.52 0.025 268)" fontSize={12} width={80} />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="oklch(0.55 0.24 305)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming interviews */}
        <div className="card-elevated p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Upcoming interviews</h3>
            <Link to={"/interviews" as any} className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <ul className="space-y-2.5">
            {upcomingInterviews.map((i) => (
              <li key={i.id} className="flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3">
                <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <CalendarCheck className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{i.candidateName}</p>
                  <p className="truncate text-xs text-muted-foreground">{i.interviewType} • {i.interviewerName}</p>
                </div>
                <span className="text-xs text-muted-foreground">{format(new Date(i.scheduledAt), "MMM d, p")}</span>
              </li>
            ))}
            {upcomingInterviews.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No upcoming interviews.</p>}
          </ul>
        </div>

        {/* Tasks due */}
        <div className="card-elevated p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Tasks due</h3>
            <Link to={"/tasks" as any} className="text-xs font-medium text-primary hover:underline">View all</Link>
          </div>
          <ul className="space-y-2.5">
            {dueTasks.map((t) => (
              <li key={t.id} className="flex items-start gap-3 rounded-lg border border-border bg-background/60 p-3">
                <div className="mt-0.5 grid size-8 place-items-center rounded-md bg-accent/20 text-accent-foreground">
                  <ListChecks className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{t.title}</p>
                  <p className="text-xs text-muted-foreground">Due {format(new Date(t.dueDate), "MMM d")} • {t.assigneeName}</p>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{t.priority}</span>
              </li>
            ))}
            {dueTasks.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">No pending tasks.</p>}
          </ul>
        </div>
      </div>

      {/* Recent activity */}
      <div className="mt-6 card-elevated">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Recent candidates</h3>
          </div>
          <Link to={"/candidates" as any} className="inline-flex items-center text-xs font-medium text-primary hover:underline">
            View all <ChevronRight className="size-3" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recentActivity.map((c) => (
            <Link
              key={c.id}
              to={"/candidates/$id" as any}
              params={{ id: c.id } as any}
              className="flex items-center gap-3 p-4 transition hover:bg-muted/40"
            >
              <div className="grid size-10 place-items-center rounded-full gradient-primary text-sm font-semibold text-primary-foreground">
                {c.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">{c.code} • {c.category}</p>
              </div>
              <StatusBadge status={c.status} />
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
