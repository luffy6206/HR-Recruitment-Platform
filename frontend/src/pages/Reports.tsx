import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { reportService } from "@/services";
import type { DailyReport } from "@/types";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";



const COLORS = ["oklch(0.55 0.24 305)", "oklch(0.78 0.16 78)", "oklch(0.65 0.17 240)", "oklch(0.72 0.18 150)", "oklch(0.63 0.23 25)"];

export default function ReportsPage() {
  const qc = useQueryClient();
  const { data: charts } = useQuery({ queryKey: ["reports-charts"], queryFn: () => reportService.get() });
  const { data: dailyReports = [], isLoading } = useQuery({ queryKey: ["daily-reports"], queryFn: () => reportService.getMyReports() });

  const generateMutation = useMutation({
    mutationFn: () => reportService.generate(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-reports"] });
      toast.success("Daily report generated successfully.");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to generate report.");
    }
  });

  return (
    <>
      <PageHeader 
        title="Reports & analytics" 
        description="Hiring funnel, source mix, conversion and HR productivity."
        actions={
          <button 
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95 disabled:opacity-50"
          >
            <Plus className="size-4" /> {generateMutation.isPending ? "Generating..." : "Generate Daily Report"}
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Selection rate" value={`${charts?.selectionRate ?? "—"}%`} tone="text-success" />
        <Kpi label="Conversion rate" value={`${charts?.conversionRate ?? "—"}%`} tone="text-primary" />
        <Kpi label="Active candidates" value="312" tone="text-accent-foreground" />
        <Kpi label="Avg. time-to-hire" value="14d" tone="text-info" />
      </div>

      <div className="mt-6">
        <h3 className="mb-4 text-base font-semibold">My Daily Reports</h3>
        <div className="card-elevated overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Called</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interviews</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selected</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dropped</th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending</th>
                </tr>
              </thead>
              <tbody>
                {dailyReports.map((r: DailyReport) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{format(new Date(r.reportDate), "MMM d, yyyy")}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{r.candidatesAssigned}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{r.candidatesCalled}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{r.interviewsScheduled}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-success font-medium">{r.selectedCandidates}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-destructive">{r.droppedCandidates}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{r.pendingCandidates}</td>
                  </tr>
                ))}
                {!isLoading && dailyReports.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-xs text-muted-foreground">No daily reports generated yet. Click "Generate Daily Report" to create one.</td>
                  </tr>
                )}
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-xs text-muted-foreground">Loading...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card-elevated p-5 lg:col-span-2">
          <h3 className="text-base font-semibold">Hiring trend</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <LineChart data={charts?.hiringTrend ?? []}>
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
                <Pie data={charts?.sourceMix ?? []} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {(charts?.sourceMix ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
            <BarChart data={charts?.hrProductivity ?? []}>
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
