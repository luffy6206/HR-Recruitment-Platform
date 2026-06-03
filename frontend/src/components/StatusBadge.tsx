import { cn } from "@/lib/utils";
import type { CandidateStatus } from "@/types";

const STATUS_STYLES: Record<CandidateStatus, string> = {
  NEW: "bg-info/10 text-info border-info/20",
  CONTACTED: "bg-primary/10 text-primary border-primary/20",
  INTERVIEW: "bg-accent/15 text-accent-foreground border-accent/30",
  SELECTED: "bg-success/10 text-success border-success/20",
  DROPPED: "bg-destructive/10 text-destructive border-destructive/20",
  ON_HOLD: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABEL: Record<CandidateStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  INTERVIEW: "Interview",
  SELECTED: "Selected",
  DROPPED: "Dropped",
  ON_HOLD: "On Hold",
};

export function StatusBadge({ status, className }: { status: CandidateStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABEL[status]}
    </span>
  );
}
