import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { candidateService } from "@/services";
import { Activity as ActivityIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/activity")({
  head: () => ({ meta: [{ title: "Activity — Talentflow" }] }),
  component: () => <AppShell><ActivityPage /></AppShell>,
});

function ActivityPage() {
  const { data: candidates = [] } = useQuery({ queryKey: ["candidates"], queryFn: () => candidateService.list() });

  const feed = candidates.slice(0, 20).map((c, idx) => ({
    id: c.id,
    actor: idx % 2 ? "Rohan Mehta" : "Aanya Kapoor",
    action: idx % 3 === 0 ? "moved to" : idx % 3 === 1 ? "scheduled interview for" : "added",
    target: c.name,
    detail: c.status,
    at: c.createdAt,
  }));

  return (
    <>
      <PageHeader title="Activity logs" description="A complete audit feed across your workspace." />

      <div className="card-elevated p-6">
        <ol className="relative space-y-6 border-l-2 border-border pl-6">
          {feed.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[31px] grid size-5 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground">
                <ActivityIcon className="size-2.5" />
              </span>
              <p className="text-sm text-foreground">
                <span className="font-semibold">{e.actor}</span>{" "}
                <span className="text-muted-foreground">{e.action}</span>{" "}
                <span className="font-medium">{e.target}</span>{" "}
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{e.detail}</span>
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                {formatDistanceToNow(new Date(e.at), { addSuffix: true })}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
