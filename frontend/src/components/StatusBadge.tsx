import { cn } from "@/lib/utils";
import type { CandidateStatus } from "@/types";

const STATUS_STYLES: Record<CandidateStatus, string> = {
  NEW: "bg-info/10 text-info border-info/20",
  AI_PROCESSING: "bg-muted text-muted-foreground border-border",
  AI_PROCESSED: "bg-muted text-muted-foreground border-border",
  FIRST_CALL_DONE: "bg-primary/15 text-primary border-primary/30",
  SECOND_CALL_DONE: "bg-primary/15 text-primary border-primary/30",
  THIRD_CALL_DONE: "bg-primary/15 text-primary border-primary/30",
  LINED_UP: "bg-amber-100 text-amber-800 border-amber-200",
  INTERVIEW_SCHEDULED: "bg-violet-100 text-violet-800 border-violet-200",
  INTERVIEW_COMPLETED: "bg-violet-100 text-violet-800 border-violet-200",
  TASK_ASSIGNED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  TASK_REVIEW: "bg-indigo-100 text-indigo-800 border-indigo-200",
  SELECTED: "bg-green-100 text-green-800 border-green-200",
  DROPPED: "bg-destructive/10 text-destructive border-destructive/20",
};

const STATUS_LABEL: Record<CandidateStatus, string> = {
  NEW: "New",
  AI_PROCESSING: "Processing",
  AI_PROCESSED: "Processed",
  FIRST_CALL_DONE: "1st Call Done",
  SECOND_CALL_DONE: "2nd Call Done",
  THIRD_CALL_DONE: "3rd Call Done",
  LINED_UP: "Lined Up",
  INTERVIEW_SCHEDULED: "Interview Scheduled",
  INTERVIEW_COMPLETED: "Interview Done",
  TASK_ASSIGNED: "Task Assigned",
  TASK_REVIEW: "Task Review",
  SELECTED: "Selected",
  DROPPED: "Dropped",
};

export function StatusBadge({ status, className }: { status: CandidateStatus; className?: string }) {
  const style = STATUS_STYLES[status] ?? "bg-muted text-muted-foreground border-border";
  const label = STATUS_LABEL[status] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        style,
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
