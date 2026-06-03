import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  accent?: "primary" | "accent" | "success" | "danger" | "info";
  className?: string;
}

const ACCENTS = {
  primary: "from-primary/15 to-primary/0 text-primary",
  accent: "from-accent/20 to-accent/0 text-accent-foreground",
  success: "from-success/15 to-success/0 text-success",
  danger: "from-destructive/15 to-destructive/0 text-destructive",
  info: "from-info/15 to-info/0 text-info",
};

export function DashboardCard({ label, value, icon, trend, accent = "primary", className }: Props) {
  const trendPositive = (trend ?? 0) >= 0;
  return (
    <div className={cn("card-elevated p-5 group transition-all hover:-translate-y-0.5", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        <div className={cn("rounded-xl bg-gradient-to-br p-3", ACCENTS[accent])}>
          {icon}
        </div>
      </div>
      {typeof trend === "number" && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
              trendPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            {trendPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(trend)}%
          </span>
          <span className="text-muted-foreground">vs last week</span>
        </div>
      )}
    </div>
  );
}
