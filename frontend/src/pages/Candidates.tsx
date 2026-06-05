import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download, FileUp, Filter, Plus, Search, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/layouts/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { candidateService, interviewService } from "@/services";
import type { Candidate, CandidateStatus } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useResumeUpload } from "@/hooks/useResumeUpload";
import { ResumeUploadDialog } from "@/components/candidates/ResumeUploadDialog";

const createSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(7, "Phone is required"),
  category: z.string().min(2, "Category is required"),
});
type CreateForm = z.infer<typeof createSchema>;

const STATUS_FILTERS: ("ALL" | CandidateStatus)[] = [
  "ALL", "NEW", "AI_PROCESSING", "AI_PROCESSED",
  "FIRST_CALL_DONE",
  "SECOND_CALL_DONE",
  "THIRD_CALL_DONE",
  "LINED_UP",
  "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED",
  "TASK_ASSIGNED", "TASK_REVIEW",
  "SELECTED", "DROPPED",
];

export default function CandidatesPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { data: candidates = [], isLoading } = useQuery({ queryKey: ["candidates"], queryFn: () => candidateService.list() });

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CandidateStatus>("ALL");
  const [page, setPage] = useState(1);
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isBulkScheduleOpen, setIsBulkScheduleOpen] = useState(false);
  const [bulkScheduleData, setBulkScheduleData] = useState({ interviewDate: "", interviewTime: "", interviewType: "TECHNICAL" });
  const pageSize = 10;
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (statusFilter !== "LINED_UP") {
      setSelectedCandidateIds([]);
    }
  }, [statusFilter]);

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

  const toggleCandidateSelection = (id: string) => {
    setSelectedCandidateIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  };

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

  const selectAllOnPage = () => {
    const currentPageIds = pageData.filter((c) => c.status === "LINED_UP").map((c) => c.id);
    const allSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedCandidateIds.includes(id));
    setSelectedCandidateIds(allSelected ? [] : currentPageIds);
  };

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

  const bulkScheduleMut = useMutation({
    mutationFn: () => interviewService.bulkSchedule({
      candidateIds: selectedCandidateIds,
      interviewType: bulkScheduleData.interviewType,
      scheduledAt: new Date(`${bulkScheduleData.interviewDate}T${bulkScheduleData.interviewTime}`).toISOString(),
      interviewerName: user?.name ?? "HR",
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidates"] });
      qc.invalidateQueries({ queryKey: ["interviews"] });
      setIsBulkScheduleOpen(false);
      setSelectedCandidateIds([]);
      setBulkScheduleData({ interviewDate: "", interviewTime: "", interviewType: "TECHNICAL" });
      toast.success("Interviews scheduled successfully");
    },
    onError: (e: any) => toast.error(e?.message ?? "Unable to schedule interviews"),
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
            {isAdmin && (
              <button onClick={() => setResumeDialogOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
                <FileUp className="size-4" /> Upload Resumes
              </button>
            )}
            <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted">
              <Download className="size-4" /> Export
            </button>
            {isAdmin && (
              <button onClick={() => setModalOpen(true)} className="inline-flex items-center gap-2 rounded-lg gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow transition hover:opacity-95">
                <Plus className="size-4" /> Add candidate
              </button>
            )}
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
        {statusFilter === "LINED_UP" && selectedCandidateIds.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedCandidateIds.length} lined-up candidate{selectedCandidateIds.length === 1 ? "" : "s"} selected.</span>
            <button
              onClick={() => setIsBulkScheduleOpen(true)}
              className="rounded-full border border-primary bg-primary/10 px-3 py-1 text-sm font-medium text-primary transition hover:bg-primary/15"
            >
              Schedule interview for selected
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">                {statusFilter === "LINED_UP" && (
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={pageData.filter((c) => c.status === "LINED_UP").every((c) => selectedCandidateIds.includes(c.id)) && pageData.filter((c) => c.status === "LINED_UP").length > 0}
                      onChange={selectAllOnPage}
                    />
                  </th>
                )}                {["Code", "Candidate", "Email", "Phone", "Category", "Type", "Assigned HR", "Status", "Created", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={9} className="p-10 text-center text-sm text-muted-foreground">Loading candidates…</td></tr>
              )}
              {!isLoading && pageData.length === 0 && (
                <tr><td colSpan={9} className="p-10 text-center text-sm text-muted-foreground">No candidates match your filters.</td></tr>
              )}
              {pageData.map((c) => (
                <CandidateRow
                  key={c.id}
                  c={c}
                  onDelete={() => deleteMut.mutate(c.id)}
                  onToggle={() => toggleCandidateSelection(c.id)}
                  onSchedule={() => {
                    if (!selectedCandidateIds.includes(c.id)) {
                      setSelectedCandidateIds([c.id]);
                    }
                    setIsBulkScheduleOpen(true);
                  }}
                  showCheckbox={statusFilter === "LINED_UP"}
                  selected={selectedCandidateIds.includes(c.id)}
                  isAdmin={isAdmin}
                />
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

      <Dialog open={isBulkScheduleOpen} onOpenChange={setIsBulkScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule interview for lined-up candidates</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Interview Type</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={bulkScheduleData.interviewType}
                onChange={(e) => setBulkScheduleData({ ...bulkScheduleData, interviewType: e.target.value })}
              >
                <option value="TECHNICAL">Technical</option>
                <option value="HR">HR</option>
                <option value="MANAGERIAL">Managerial</option>
                <option value="FINAL">Final</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Interview Date</label>
              <input
                type="date"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={bulkScheduleData.interviewDate}
                onChange={(e) => setBulkScheduleData({ ...bulkScheduleData, interviewDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Interview Time</label>
              <input
                type="time"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={bulkScheduleData.interviewTime}
                onChange={(e) => setBulkScheduleData({ ...bulkScheduleData, interviewTime: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsBulkScheduleOpen(false)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
            <button
              type="button"
              onClick={() => bulkScheduleMut.mutate()}
              disabled={bulkScheduleMut.isPending || !bulkScheduleData.interviewDate || !bulkScheduleData.interviewTime || selectedCandidateIds.length === 0}
              className="rounded-lg gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95 disabled:opacity-60"
            >
              {bulkScheduleMut.isPending ? "Scheduling…" : "Schedule interviews"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resume upload dialog */}
      <ResumeUploadDialog
        open={resumeDialogOpen}
        onOpenChange={setResumeDialogOpen}
        onFilesSelected={async (files, category, assignedHR) => {
          await resumeUploadMut.mutateAsync({ files, category, assignedHR });
        }}
        isLoading={resumeUploadMut.isPending}
      />
    </>
  );
}

function CandidateRow({ c, onDelete, onToggle, onSchedule, selected, showCheckbox, isAdmin }: { c: Candidate; onDelete: () => void; onToggle?: () => void; onSchedule?: () => void; selected?: boolean; showCheckbox?: boolean; isAdmin: boolean }) {
  return (
    <tr className="border-b border-border last:border-0 transition hover:bg-muted/30">
      {showCheckbox ? (
        <td className="px-4 py-3">
          <input type="checkbox" checked={selected} onChange={onToggle} />
        </td>
      ) : null}
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.code ?? "N/A"}</td>
      <td className="px-4 py-3">
        <Link to={`/candidates/${c.id}`} className="flex items-center gap-2.5">
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
      <td className="px-4 py-3">
        {c.candidateType ? (
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${
            c.candidateType === "PASSOUT"
              ? "border-[#22C55E] bg-[#22C55E]/10 text-[#22C55E]"
              : "border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]"
          }`}>
            {c.candidateType}
          </span>
        ) : (
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {c.assignedTo || "Unassigned"}
      </td>
      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{c.createdAt ? format(new Date(c.createdAt), "MMM d, yyyy") : "—"}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1">
          <Link to={`/candidates/${c.id}`} className="grid size-8 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-primary"
            title="Manage"
          ><UserCog className="size-4" /></Link>
          {c.status === "LINED_UP" && onSchedule && (
            <button
              onClick={onSchedule}
              className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground transition hover:bg-muted"
              title="Schedule interview"
            >Schedule</button>
          )}
          {isAdmin && (
            <button
              onClick={onDelete}
              className="grid size-8 place-items-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
              title="Delete"
            ><Trash2 className="size-4" /></button>
          )}
        </div>
      </td>
    </tr>
  );
}
