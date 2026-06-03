import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { reportService } from "@/services";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — Talentflow" }] }),
  component: () => <AppShell><ReportsPage /></AppShell>,
});

const COLORS = ["oklch(0.55 0.24 305)", "oklch(0.78 0.16 78)", "oklch(0.65 0.17 240)", "oklch(0.72 0.18 150)", "oklch(0.63 0.23 25)"];

function ReportsPage() {
  const { data } = useQuery({ queryKey: ["reports"], queryFn: () => reportService.get() });

  return (
    <>
      <PageHeader title="Reports & analytics" description="Hiring funnel, source mix, conversion and HR productivity." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Selection rate" value={`${data?.selectionRate ?? "—"}%`} tone="text-success" />
        <Kpi label="Conversion rate" value={`${data?.conversionRate ?? "—"}%`} tone="text-primary" />
        <Kpi label="Active candidates" value="312" tone="text-accent-foreground" />
        <Kpi label="Avg. time-to-hire" value="14d" tone="text-info" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card-elevated p-5 lg:col-span-2">
          <h3 className="text-base font-semibold">Hiring trend</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <LineChart data={data?.hiringTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 290)" />
                <XAxis dataKey="month" fontSize={12} stroke="oklch(0.52 0.025 268)" />
                <YAxis fontSize={12} stroke="oklch(0.52 0.025 268)" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="applied" stroke="oklch(0.55 0.24 305)" strokeWidth={2} />
                <Line type="monotone" dataKey="interviewed" stroke="oklch(0.78 0.16 78)" strokeWidth={2} />
                <Line type="monotone" dataKey="hired" stroke="oklch(0.72 0.18 150)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-elevated p-5">
          <h3 className="text-base font-semibold">Source mix</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data?.sourceMix ?? []} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {(data?.sourceMix ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 card-elevated p-5">
        <h3 className="text-base font-semibold">HR productivity</h3>
        <p className="text-xs text-muted-foreground">Calls, interviews and offers by recruiter</p>
        <div className="mt-4 h-80">
          <ResponsiveContainer>
            <BarChart data={data?.hrProductivity ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 290)" />
              <XAxis dataKey="name" fontSize={12} stroke="oklch(0.52 0.025 268)" />
              <YAxis fontSize={12} stroke="oklch(0.52 0.025 268)" />
              <Tooltip />
              <Legend />
              <Bar dataKey="calls" fill="oklch(0.55 0.24 305)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="interviews" fill="oklch(0.78 0.16 78)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="offers" fill="oklch(0.72 0.18 150)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="card-elevated p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${tone}`}>{value}</p>
    </div>
  );
}
