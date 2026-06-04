import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download, FileUp, Filter, Plus, Search, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/layouts/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { candidateService } from "@/services";
import type { Candidate, CandidateStatus } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useResumeUpload } from "@/hooks/useResumeUpload";
import { ResumeUploadDialog } from "@/components/candidates/ResumeUploadDialog";







export const Route = createFileRoute("/candidates")({
  head: () => ({ meta: [{ title: "Candidates — Talentflow" }] }),
  component: () => <AppShell><CandidatesPage /></AppShell>,
});

const createSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(7, "Phone is required"),
  category: z.string().min(2, "Category is required"),
});
type CreateForm = z.infer<typeof createSchema>;

const STATUS_FILTERS: ("ALL" | CandidateStatus)[] = ["ALL", "NEW", "CONTACTED", "INTERVIEW", "SELECTED", "DROPPED", "ON_HOLD"];

function CandidatesPage() {
  const qc = useQueryClient();
  const { data: candidates = [], isLoading } = useQuery({ queryKey: ["candidates"], queryFn: () => candidateService.list() });

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CandidateStatus>("ALL");
  const [page, setPage] = useState(1);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const pageSize = 10;
  const [modalOpen, setModalOpen] = useState(false);

  // Resume upload mutation
  const resumeUploadMut = useResumeUpload({
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["candidates"] });
      if (data.imported > 0) {
        let message = `${data.imported} candidate${data.imported === 1 ? "" : "s"} imported successfully`;
        if (data.duplicates > 0) {
          message += `, ${data.duplicates} duplicate resume${data.duplicates === 1 ? "" : "s"} skipped`;
        }
        if (data.failed > 0) {
          message += `, ${data.failed} resume${data.failed === 1 ? "" : "s"} failed`;
        }
        toast.success(message);
      } else if (data.duplicates > 0) {
        toast.success(
          `${data.duplicates} duplicate resume${data.duplicates === 1 ? "" : "s"} skipped`
        );
      } else if (data.failed > 0) {
        toast.error(
          `${data.failed} resume${data.failed === 1 ? "" : "s"} could not be imported. ` +
            "Check the upload errors and try a different resume."
        );
      } else {
        toast.success("No resumes were imported.");
      }
      setResumeDialogOpen(false);
      setUploadProgress(0);
    },
    onError: (error) => {
      toast.error(error?.message ?? "Failed to upload resumes");
      setUploadProgress(0);
    },
    onProgress: (progress) => {
      setUploadProgress(progress);
    },
  });

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (!q || !q.trim()) return true;
      const s = q.toLowerCase();
      return (c.name ?? "").toLowerCase().includes(s) || 
             (c.email ?? "").toLowerCase().includes(s) || 
             (c.code ?? "").toLowerCase().includes(s);
    });
  }, [candidates, q, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", email: "", phone: "", category: "Engineering" },
  });

  const createMut = useMutation({
    mutationFn: (data: CreateForm) => candidateService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidates"] });
      toast.success("Candidate created");
      setModalOpen(false);
      form.reset();
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not create candidate"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => candidateService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidates"] });
      toast.success("Candidate deleted");
    },
  });

  function exportCsv() {
    const header = ["Code", "Name", "Email", "Phone", "Category", "Status", "Created"];
    const rows = filtered.map((c) => [c.code, c.name, c.email, c.phone, c.category, c.status, c.createdAt]);
    const csv = [header, ...rows].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `candidates-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader
        title="Candidates"
        description="Search, filter and manage your full talent pipeline."
        actions={
          <>
            <button onClick={() => setResumeDialogOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
              <FileUp className="size-4" /> Upload Resumes
            </button>
            <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
              <Download className="size-4" /> Export
            </button>
            <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-lg gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow transition hover:opacity-95">
              <Plus className="size-4" /> Add candidate
            </button>
          </>
        }
      />

      {/* Toolbar */}
      <div className="card-elevated mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search by name, email, or code"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 pl-9 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="scrollbar-thin -mx-1 flex items-center gap-1 overflow-x-auto px-1">
          <Filter className="ml-2 mr-1 size-3.5 text-muted-foreground" />
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition ${statusFilter === s ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:text-foreground"}`}
            >
              {s === "ALL" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                {["Code", "Candidate", "Email", "Phone", "Category", "Status", "Created", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} className="p-10 text-center text-sm text-muted-foreground">Loading candidates…</td></tr>
              )}
              {!isLoading && pageData.length === 0 && (
                <tr><td colSpan={8} className="p-10 text-center text-sm text-muted-foreground">No candidates match your filters.</td></tr>
              )}
              {pageData.map((c) => (
                <CandidateRow key={c.id} c={c} onDelete={() => deleteMut.mutate(c.id)} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-medium text-foreground">{(page - 1) * pageSize + 1}</span>–
            <span className="font-medium text-foreground">{Math.min(page * pageSize, filtered.length)}</span> of{" "}
            <span className="font-medium text-foreground">{filtered.length}</span>
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="grid size-8 place-items-center rounded-md border border-border bg-background text-foreground/70 disabled:opacity-40"
            ><ChevronLeft className="size-4" /></button>
            <span className="px-2 text-xs text-muted-foreground">Page {page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="grid size-8 place-items-center rounded-md border border-border bg-background text-foreground/70 disabled:opacity-40"
            ><ChevronRight className="size-4" /></button>
          </div>
        </div>
      </div>

      {/* Create modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add new candidate</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit((d) => createMut.mutate(d))} className="space-y-4">
            {(["name", "email", "phone", "category"] as const).map((field) => (
              <div key={field}>
                <label className="mb-1.5 block text-sm font-medium capitalize text-foreground">{field === "name" ? "Full name" : field}</label>
                <input
                  {...form.register(field)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
                {form.formState.errors[field] && (
                  <p className="mt-1 text-xs text-destructive">{form.formState.errors[field]?.message as string}</p>
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
              <button type="submit" disabled={createMut.isPending} className="rounded-lg gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95 disabled:opacity-60">
                {createMut.isPending ? "Saving…" : "Create candidate"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Resume upload dialog */}
      <ResumeUploadDialog
        open={resumeDialogOpen}
        onOpenChange={setResumeDialogOpen}
        onFilesSelected={async (files) => {
          await resumeUploadMut.mutateAsync(files);
        }}
        isLoading={resumeUploadMut.isPending}
      />
    </>
  );
}

function CandidateRow({ c, onDelete }: { c: Candidate; onDelete: () => void }) {
  return (
    <tr className="border-b border-border last:border-0 transition hover:bg-muted/30">
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.code ?? "N/A"}</td>
      <td className="px-4 py-3">
        <Link to={"/candidates/$id" as any} params={{ id: c.id } as any} className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-full gradient-primary text-xs font-semibold text-primary-foreground">
            {(c.name ?? "Unknown Candidate").split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("") || "UC"}
          </span>
          <span className="font-medium text-foreground hover:text-primary">{c.name ?? "Unknown Candidate"}</span>
        </Link>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{c.email ?? "—"}</td>
      <td className="px-4 py-3 text-muted-foreground">{c.phone ?? "—"}</td>
      <td className="px-4 py-3">
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{c.category ?? "General"}</span>
      </td>
      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{c.createdAt ? format(new Date(c.createdAt), "MMM d, yyyy") : "—"}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Link
            to={"/candidates/$id" as any}
            params={{ id: c.id } as any}
            className="grid size-8 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-primary"
            title="Manage"
          ><UserCog className="size-4" /></Link>
          <button
            onClick={onDelete}
            className="grid size-8 place-items-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
            title="Delete"
          ><Trash2 className="size-4" /></button>
        </div>
      </td>
    </tr>
  );
}
