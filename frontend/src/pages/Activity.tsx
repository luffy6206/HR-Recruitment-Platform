
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { activityService } from "@/services";
import { Activity as ActivityIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";



export default function ActivityPage() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["activity"],
    queryFn: () => activityService.list(),
  });

  return (
    <>
      <PageHeader title="Activity logs" description="A complete audit feed across your workspace." />

      <div className="card-elevated p-6">
        {isLoading && (
          <div className="grid h-40 place-items-center">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        <ol className="relative space-y-6 border-l-2 border-border pl-6">
          {events.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[31px] grid size-5 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground">
                <ActivityIcon className="size-2.5" />
              </span>
              <p className="text-sm text-foreground">
                <span className="font-semibold">{e.by ?? "System"}</span>{" "}
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{e.type}</span>
              </p>
              <p className="mt-0.5 text-sm font-medium text-foreground">{e.title}</p>
              {e.description && <p className="mt-0.5 text-xs text-muted-foreground">{e.description}</p>}
              <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                {e.at ? formatDistanceToNow(new Date(e.at), { addSuffix: true }) : "—"}
              </p>
            </li>
          ))}
          {!isLoading && events.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No activity events yet.</p>
          )}
        </ol>
      </div>
    </>
  );
}
