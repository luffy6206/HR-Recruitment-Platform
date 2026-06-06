import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useState } from "react";
import { ArrowLeft, Award, Briefcase, CalendarCheck, ClipboardList, GraduationCap, History, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { AppShell } from "@/layouts/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { candidateService, interviewService, taskService, userService, callService } from "@/services";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { format, formatDistanceToNow } from "date-fns";

const computeCandidateType = (passingYear: string | number) => {
  const year = typeof passingYear === "string" ? Number(passingYear.trim()) : passingYear;
  if (!year || Number.isNaN(year)) {
    return "";
  }

  const currentYear = new Date().getFullYear();
  return year <= currentYear ? "PASSOUT" : "STUDENT";
};

const getCandidateTypeBadgeClasses = (candidateType?: string) => {
  if (candidateType === "PASSOUT") {
    return "inline-flex items-center rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-green-800";
  }

  if (candidateType === "STUDENT") {
    return "inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-blue-800";
  }

  return "inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase text-muted-foreground";
};

const getProjectTypeBadge = (projectType?: string) => {
  const normalized = String(projectType ?? "").toLowerCase();
  if (normalized.includes("dynamic")) {
    return (
      <span className="ml-2 inline-flex items-center rounded-full border border-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 text-[11px] font-semibold uppercase text-[#22C55E]">
        DYNAMIC
      </span>
    );
  }

  if (normalized.includes("static")) {
    return (
      <span className="ml-2 inline-flex items-center rounded-full border border-[#E4A60A] bg-[#E4A60A]/10 px-2 py-0.5 text-[11px] font-semibold uppercase text-[#E4A60A]">
        STATIC
      </span>
    );
  }

  return null;
};



export default function CandidateDetailsPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["candidate", id],
    queryFn: () => candidateService.get(id!),
    enabled: !!id,
  });
  const { data: allInterviews = [] } = useQuery({ queryKey: ["interviews"], queryFn: () => interviewService.list() });
  const { data: allTasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => taskService.list() });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: () => userService.list() });

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [completeInterviewId, setCompleteInterviewId] = useState<string | null>(null);
  const [evaluateInterviewId, setEvaluateInterviewId] = useState<string | null>(null);
  const [submitTaskId, setSubmitTaskId] = useState<string | null>(null);
  const [reviewTaskId, setReviewTaskId] = useState<string | null>(null);
  const [completeTaskId, setCompleteTaskId] = useState<string | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    projectDemoStatus: "PENDING",
    remarks: "",
  });
  const [completeTaskData, setCompleteTaskData] = useState({ score: 100, reviewNotes: "" });
  
  const [selectedHrId, setSelectedHrId] = useState("");
  const [isScheduleInterviewOpen, setIsScheduleInterviewOpen] = useState(false);
  const [callData, setCallData] = useState({ callNumber: 1, outcome: "Answered", interested: "", notes: "", drop: false, dropAfter3: false, dropReason: "" });
  const [scheduleData, setScheduleData] = useState({ interviewDate: "", interviewTime: "", interviewType: "TECHNICAL" });
  const [completeData, setCompleteData] = useState({ feedback: "", rating: 5 });
  const [evaluateData, setEvaluateData] = useState({ decision: "SELECT", reason: "" });
  const [submitData, setSubmitData] = useState({ submissionLink: "" });
  const [reviewData, setReviewData] = useState({ outcome: "SATISFIED", reviewNotes: "", score: 100, reason: "", newDeadline: "" });
  const [editData, setEditData] = useState({ name: "", email: "", phone: "", category: "" });
  const [profileData, setProfileData] = useState({
    passingYear: "",
    candidateType: "",
    academicYear: "",
    cgpa: "",
    technicalTraining: {
      completed: false,
      trainingName: "",
      institute: "",
      duration: "",
      completionYear: "",
    },
    currentLocation: "",
    permanentLocation: "",
  });
  const [educationList, setEducationList] = useState<any[]>([]);
  const [isEducationDialogOpen, setIsEducationDialogOpen] = useState(false);
  const [editingEducationIndex, setEditingEducationIndex] = useState<number | null>(null);
  const [educationForm, setEducationForm] = useState({ degree: "", institute: "", year: "", cgpa: "" });
  const [isExperienceDialogOpen, setIsExperienceDialogOpen] = useState(false);
  const [editingExperienceIndex, setEditingExperienceIndex] = useState<number | null>(null);
  const [experienceForm, setExperienceForm] = useState({ company: "", role: "", from: "", to: "", currentCompany: false, description: "", experienceType: "Full Time" });
  const [isCertificationDialogOpen, setIsCertificationDialogOpen] = useState(false);
  const [editingCertificationIndex, setEditingCertificationIndex] = useState<number | null>(null);
  const [certificationForm, setCertificationForm] = useState({ name: "", issuer: "", issueDate: "", expiryDate: "", certificateUrl: "" });
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [editingProjectIndex, setEditingProjectIndex] = useState<number | null>(null);
  const [projectForm, setProjectForm] = useState({ name: "", description: "", type: "Static Project" });

  const canAssign = user?.role === "ADMIN";
  const canEditCandidate = Boolean(
    user?.role === "ADMIN" ||
    (data?.candidate?.assignedToId && data.candidate.assignedToId === user?.id)
  );
  const canLogCall = Boolean(
    user?.role === "ADMIN" ||
    (data?.candidate?.assignedToId && data.candidate.assignedToId === user?.id)
  );
  const canAddSkill = canLogCall || user?.role === "ADMIN";

  useEffect(() => {
    if (data?.candidate) {
      setEditData({
        name: data.candidate.name,
        email: data.candidate.email,
        phone: data.candidate.phone,
        category: data.candidate.category,
      });
    }
  }, [data?.candidate]);

  useEffect(() => {
    const profileDataFromBackend = data?.profile;
    if (profileDataFromBackend) {
      setProfileData({
        passingYear: profileDataFromBackend.passingYear?.toString() ?? "",
        candidateType: profileDataFromBackend.candidateType ?? "",
        academicYear: profileDataFromBackend.academicYear ?? "",
        cgpa: profileDataFromBackend.cgpa?.toString() ?? "",
        technicalTraining: {
          completed: profileDataFromBackend.technicalTraining?.completed ?? false,
          trainingName: profileDataFromBackend.technicalTraining?.trainingName ?? "",
          institute: profileDataFromBackend.technicalTraining?.institute ?? "",
          duration: profileDataFromBackend.technicalTraining?.duration ?? "",
          completionYear: profileDataFromBackend.technicalTraining?.completionYear?.toString() ?? "",
        },
        currentLocation: profileDataFromBackend.currentLocation ?? "",
        permanentLocation: profileDataFromBackend.permanentLocation ?? "",
      });

      setEducationList(Array.isArray(profileDataFromBackend.education) ? profileDataFromBackend.education : []);
    }
  }, [data?.profile]);

  const assignMutation = useMutation({
    mutationFn: (hrId: string) => candidateService.assign(id!, hrId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      setIsAssignOpen(false);
    },
  });

  const callMutation = useMutation({
    mutationFn: (data: any) => callService.create({ candidateId: id!, ...data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      setIsCallOpen(false);
      setCallData({ callNumber: 1, outcome: "Answered", interested: "", notes: "", drop: false, dropAfter3: false, dropReason: "" });
      toast.success("Call logged successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Unable to log call");
    },
  });

  const scheduleInterviewMutation = useMutation({
    mutationFn: (data: any) => interviewService.create({
      candidateId: id!,
      interviewerName: user?.name ?? "HR",
      interviewType: data.interviewType,
      scheduledAt: new Date(`${data.interviewDate}T${data.interviewTime}`).toISOString(),
      meetingLink: data.meetingLink,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      qc.invalidateQueries({ queryKey: ["interviews"] });
      setIsScheduleInterviewOpen(false);
      setScheduleData({ interviewDate: "", interviewTime: "", interviewType: "TECHNICAL" });
      toast.success("Interview scheduled successfully");
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Unable to schedule interview");
    },
  });

  const addSkillMutation = useMutation({
    mutationFn: (skill: string) => candidateService.addSkill(id!, skill),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      setIsAddSkillOpen(false);
      setNewSkill("");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Unable to add skill");
    },
  });

  const addProjectMutation = useMutation({
    mutationFn: (project: any) => candidateService.addProject(id!, project),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      setIsProjectDialogOpen(false);
      setEditingProjectIndex(null);
      setProjectForm({ name: "", description: "", type: "Static Project" });
      toast.success("Project saved");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Unable to save project");
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data: any) => candidateService.updateProject(id!, data.index, data.project),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      setIsProjectDialogOpen(false);
      setEditingProjectIndex(null);
      setProjectForm({ name: "", description: "", type: "Static Project" });
      toast.success("Project updated");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Unable to update project");
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (data: any) => taskService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      setIsTaskDialogOpen(false);
      setTaskForm({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        projectDemoStatus: "PENDING",
        remarks: "",
      });
      toast.success("Task assigned successfully");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Unable to assign task");
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (index: number) => candidateService.deleteProject(id!, index),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      toast.success("Project deleted");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Unable to delete project");
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (patch: any) => candidateService.update(id!, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      toast.success("Profile updated");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Unable to save profile details");
    },
  });

  const updateEducationMutation = useMutation({
    mutationFn: (data: any) => candidateService.updateEducation(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      toast.success("Education saved");
      setIsEducationDialogOpen(false);
      setEditingEducationIndex(null);
      setEducationForm({ degree: "", institute: "", year: "", cgpa: "" });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Unable to save education");
    },
  });

  const addExperienceMutation = useMutation({
    mutationFn: (experience: any) => candidateService.addExperience(id!, experience),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      toast.success("Experience added");
      setIsExperienceDialogOpen(false);
      setEditingExperienceIndex(null);
      setExperienceForm({ company: "", role: "", from: "", to: "", currentCompany: false, description: "", experienceType: "Full Time" });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Unable to save experience");
    },
  });

  const updateExperienceMutation = useMutation({
    mutationFn: (data: any) => candidateService.updateExperience(id!, data.index, data.experience),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      toast.success("Experience updated");
      setIsExperienceDialogOpen(false);
      setEditingExperienceIndex(null);
      setExperienceForm({ company: "", role: "", from: "", to: "", currentCompany: false, description: "", experienceType: "Full Time" });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Unable to update experience");
    },
  });

  const deleteExperienceMutation = useMutation({
    mutationFn: (index: number) => candidateService.deleteExperience(id!, index),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      toast.success("Experience deleted");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Unable to delete experience");
    },
  });

  const addCertificationMutation = useMutation({
    mutationFn: (certification: any) => candidateService.addCertification(id!, certification),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      toast.success("Certification added");
      setIsCertificationDialogOpen(false);
      setEditingCertificationIndex(null);
      setCertificationForm({ name: "", issuer: "", issueDate: "", expiryDate: "", certificateUrl: "" });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Unable to save certification");
    },
  });

  const updateCertificationMutation = useMutation({
    mutationFn: (data: any) => candidateService.updateCertification(id!, data.index, data.certification),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      toast.success("Certification updated");
      setIsCertificationDialogOpen(false);
      setEditingCertificationIndex(null);
      setCertificationForm({ name: "", issuer: "", issueDate: "", expiryDate: "", certificateUrl: "" });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Unable to update certification");
    },
  });

  const deleteCertificationMutation = useMutation({
    mutationFn: (index: number) => candidateService.deleteCertification(id!, index),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      toast.success("Certification deleted");
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Unable to delete certification");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (patch: any) => candidateService.update(id!, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      toast.success("Candidate updated");
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Unable to save candidate details");
    },
  });

  const completeMutation = useMutation({
    mutationFn: (data: any) => interviewService.complete(completeInterviewId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interviews"] });
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      setCompleteInterviewId(null);
      setCompleteData({ feedback: "", rating: 5 });
    },
  });

  const evaluateMutation = useMutation({
    mutationFn: (data: any) => interviewService.evaluate(evaluateInterviewId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["interviews"] });
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      setEvaluateInterviewId(null);
      setEvaluateData({ decision: "SELECT", reason: "" });
    },
  });

  const submitTaskMutation = useMutation({
    mutationFn: (data: any) => taskService.submit(submitTaskId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      setSubmitTaskId(null);
      setSubmitData({ submissionLink: "" });
    },
  });

  const reviewTaskMutation = useMutation({
    mutationFn: (data: any) => taskService.review(reviewTaskId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      setReviewTaskId(null);
      setReviewData({ outcome: "SATISFIED", reviewNotes: "", score: 100, reason: "", newDeadline: "" });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: (data: any) => taskService.review(completeTaskId!, {
      outcome: "SATISFIED",
      score: data.score,
      reviewNotes: data.reviewNotes,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["candidate", id] });
      setCompleteTaskId(null);
      setCompleteTaskData({ score: 100, reviewNotes: "" });
    },
  });

  if (isLoading) return <div className="grid h-60 place-items-center"><div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (error || !data) return <p className="text-sm text-destructive">Could not load candidate.</p>;

  const { candidate, profile, timeline = [], audits = [] } = data;
  const candidateInterviews = allInterviews.filter((i) => i.candidateId === candidate?.id);
  const candidateTasks = allTasks.filter((t) => t.candidateId === candidate?.id);

  const skills = profile?.skills ?? [];
  const experience = profile?.experience ?? [];
  const education = profile?.education ?? [];
  const projects = profile?.projects ?? [];
  const certifications = profile?.certifications ?? [];

  return (
    <>
      <Link to={"/candidates" as any} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to candidates
      </Link>

      {/* Hero */}
      <div className="card-elevated relative overflow-hidden p-6">
        <div aria-hidden className="absolute inset-x-0 top-0 h-24 gradient-primary opacity-90" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end">
          <div className="grid size-20 shrink-0 place-items-center rounded-2xl border-4 border-card bg-card text-xl font-semibold text-primary shadow-elevated">
            {(candidate?.name ?? "Unknown Candidate").split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("") || "UC"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{candidate?.name ?? "Unknown Candidate"}</h1>
              <StatusBadge status={candidate?.status} />
            </div>
            <p className="mt-1 text-xs font-mono text-muted-foreground">{candidate?.code ?? "N/A"}</p>
            {/* Header compact info intentionally left minimal; details shown in info card below */}
          </div>
          <div className="flex flex-col items-end justify-between gap-3 sm:flex-col sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              {canAssign && (
                <button 
                  onClick={() => setIsAssignOpen(true)}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  Assign HR
                </button>
              )}
              {canLogCall && (
                <button 
                  onClick={() => setIsCallOpen(true)}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  Log Call
                </button>
              )}
              {candidate?.status === "LINED_UP" && (
                <button 
                  onClick={() => setIsScheduleInterviewOpen(true)}
                  className="rounded-lg gradient-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow hover:opacity-95"
                >
                  Schedule Interview
                </button>
              )}
            </div>
            {candidate?.assignedTo && (
              <p className="text-xs text-muted-foreground mt-2">
                Assigned to: <span className="font-medium text-foreground">{candidate.assignedTo}</span>
              </p>
            )}
          </div>
        </div>

          {/* Info bar: white cards with key contact and candidate info */}
          <div className="mt-4 card-elevated p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
              <div className="rounded-lg border border-border bg-background/0 p-3">
                <p className="text-[13px] font-medium text-[#6B7280]">Email</p>
                <p className="mt-2 text-[15px] font-bold text-[#111827] truncate">{candidate?.email ?? "—"}</p>
              </div>
              <div className="rounded-lg border border-border bg-background/0 p-3">
                <p className="text-[13px] font-medium text-[#6B7280]">Phone</p>
                <p className="mt-2 text-[15px] font-bold text-[#111827]">{candidate?.phone ?? "—"}</p>
              </div>
              <div className="rounded-lg border border-border bg-background/0 p-3">
                <p className="text-[13px] font-medium text-[#6B7280]">Category</p>
                <p className="mt-2 text-[15px] font-bold text-[#111827] truncate">{candidate?.category ?? "—"}</p>
              </div>
              <div className="rounded-lg border border-border bg-background/0 p-3">
                <p className="text-[13px] font-medium text-[#6B7280]">Candidate Type</p>
                <p className="mt-2 text-[15px] font-bold text-[#111827]">{profile?.candidateType ?? "—"}</p>
              </div>
              <div className="rounded-lg border border-border bg-background/0 p-3">
                <p className="text-[13px] font-medium text-[#6B7280]">Assigned HR</p>
                <p className="mt-2 text-[15px] font-bold text-[#111827]">{candidate?.assignedTo ?? "—"}</p>
              </div>
            </div>
          </div>
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="bg-card">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="audits">Audit Logs</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="card-elevated p-5">
              <h3 className="text-sm font-semibold text-muted-foreground">Basic info</h3>
              <dl className="mt-4 space-y-3 text-sm">
                {[
                  ["Candidate code", candidate?.code ?? "N/A"],
                  ["Full name", candidate?.name ?? "Unknown Candidate"],
                  ["Email", candidate?.email ?? "—"],
                  ["Phone", candidate?.phone ?? "—"],
                  ["Category", candidate?.category ?? "General"],
                  ["Passing year", profile?.passingYear ?? "—"],
                  [
                    "Candidate type",
                    profile?.candidateType ? (
                      <span className={getCandidateTypeBadgeClasses(profile.candidateType)}>{profile.candidateType}</span>
                    ) : (
                      "—"
                    ),
                  ],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between gap-2">
                    <dt className="text-[13px] font-medium text-[#6B7280]">{k}</dt>
                    <dd className="text-right text-[15px] font-bold text-[#111827]">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="card-elevated p-5 lg:col-span-2">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Top skills</h3>
                {canAddSkill && (
                  <button
                    onClick={() => setIsAddSkillOpen(true)}
                    className="rounded-md border border-border bg-card px-2 py-1 text-xs font-medium hover:bg-muted"
                  >
                    Add Skill
                  </button>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
                    <Sparkles className="size-3" /> {s}
                  </span>
                ))}
                {skills.length === 0 && <p className="text-xs text-muted-foreground">No skills specified.</p>}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { k: candidateInterviews.length, v: "Interviews" },
                  { k: candidateTasks.length, v: "Tasks" },
                  { k: experience.length, v: "Roles" },
                  { k: certifications.length, v: "Certs" },
                ].map((x) => (
                  <div key={x.v} className="rounded-xl border border-border bg-background/40 p-3">
                    <p className="text-2xl font-semibold text-foreground">{x.k}</p>
                    <p className="text-xs text-muted-foreground">{x.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 mt-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-3xl border border-border bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Candidate type</p>
              <p className="mt-3 text-lg font-semibold text-foreground">{profile?.candidateType ?? "—"}</p>
            </div>
            {profile?.candidateType === "STUDENT" && (
              <div className="rounded-3xl border border-border bg-background/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Academic year</p>
                <p className="mt-3 text-lg font-semibold text-foreground">{profile?.academicYear ?? "—"}</p>
              </div>
            )}
            <div className="rounded-3xl border border-border bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">CGPA</p>
              <p className="mt-3 text-lg font-semibold text-foreground">{profile?.cgpa ?? "—"}</p>
            </div>
            <div className="rounded-3xl border border-border bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total projects</p>
              <p className="mt-3 text-lg font-semibold text-foreground">{projects.length}</p>
            </div>
            <div className="rounded-3xl border border-border bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Static projects</p>
              <p className="mt-3 text-lg font-semibold text-foreground">{projects.filter((p) => p.type?.toLowerCase().includes("static")).length}</p>
            </div>
            <div className="rounded-3xl border border-border bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Dynamic projects</p>
              <p className="mt-3 text-lg font-semibold text-foreground">{projects.filter((p) => p.type?.toLowerCase().includes("dynamic")).length}</p>
            </div>
            <div className="rounded-3xl border border-border bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Technical training</p>
              <p className="mt-3 text-lg font-semibold text-foreground">{profile?.technicalTraining?.completed ? "Completed" : "Not completed"}</p>
            </div>
            <div className="rounded-3xl border border-border bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Lined up</p>
              <p className="mt-3 text-lg font-semibold text-foreground">{candidate?.status === "LINED_UP" ? "Yes" : "No"}</p>
            </div>
            <div className="rounded-3xl border border-border bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Current status</p>
              <p className="mt-3 text-lg font-semibold text-foreground">{candidate?.status ?? "—"}</p>
            </div>
          </div>

          {canEditCandidate && (
            <div className="card-elevated p-5 mt-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground">Edit candidate details</h3>
                  <p className="text-xs text-muted-foreground">Update candidate fields and save changes for immediate audit logging.</p>
                </div>
                <StatusBadge status={candidate?.status} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-foreground">Full name</span>
                  <input
                    value={editData.name}
                    onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-foreground">Email</span>
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-foreground">Phone</span>
                  <input
                    value={editData.phone}
                    onChange={(e) => setEditData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-foreground">Category</span>
                  <input
                    value={editData.category}
                    onChange={(e) => setEditData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="space-y-2 text-sm sm:col-span-2">
                  <span className="font-medium text-foreground">Status</span>
                  <input
                    value={candidate?.status ?? "NEW"}
                    disabled
                    className="w-full rounded-lg border border-input bg-muted/10 px-3 py-2 text-sm text-muted-foreground"
                  />
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setEditData({
                    name: candidate?.name ?? "",
                    email: candidate?.email ?? "",
                    phone: candidate?.phone ?? "",
                    category: candidate?.category ?? "",
                  })}
                  type="button"
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  Reset
                </button>
                <button
                  onClick={() => updateMutation.mutate(editData)}
                  disabled={updateMutation.isPending}
                  className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {updateMutation.isPending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-4 space-y-4">
          <ProfileSection icon={<GraduationCap className="size-4" />} title="Education">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Edit the candidate's education history.</p>
              {canEditCandidate && (
                <button
                  onClick={() => {
                    setEditingEducationIndex(null);
                    setEducationForm({ degree: "", institute: "", year: "", cgpa: "" });
                    setIsEducationDialogOpen(true);
                  }}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
                >
                  Add education
                </button>
              )}
            </div>
            <ul className="space-y-3 mt-4">
              {educationList.map((e, i) => (
                <li key={i} className="rounded-lg border border-border bg-background/40 p-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{e.degree}</p>
                      <p className="text-xs text-muted-foreground">{e.institute}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{e.year}</span>
                      {canEditCandidate && (
                        <>
                          <button
                            onClick={() => {
                              setEditingEducationIndex(i);
                              setEducationForm({
                                degree: e.degree ?? "",
                                institute: e.institute ?? "",
                                year: e.year ?? "",
                                cgpa: e.cgpa ?? "",
                              });
                              setIsEducationDialogOpen(true);
                            }}
                            className="rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-medium hover:bg-muted"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              const updated = educationList.filter((_, idx) => idx !== i);
                              setEducationList(updated);
                              updateEducationMutation.mutate({
                                education: updated,
                                passingYear: profileData.passingYear ? Number(profileData.passingYear) : undefined,
                                candidateType: profileData.candidateType || undefined,
                                academicYear: profileData.candidateType === "STUDENT" ? profileData.academicYear || undefined : undefined,
                                cgpa: profileData.cgpa ? Number(profileData.cgpa) : undefined,
                              });
                            }}
                            className="rounded-lg border border-destructive bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/20"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
              {educationList.length === 0 && <p className="text-xs text-muted-foreground p-3">No education details recorded.</p>}
            </ul>
          </ProfileSection>

          <ProfileSection icon={<Briefcase className="size-4" />} title="Experience">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Capture professional experience entries.</p>
              {canEditCandidate && (
                <button
                  onClick={() => {
                    setEditingExperienceIndex(null);
                    setExperienceForm({ company: "", role: "", from: "", to: "", currentCompany: false, description: "", experienceType: "Full Time" });
                    setIsExperienceDialogOpen(true);
                  }}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
                >
                  Add experience
                </button>
              )}
            </div>
            <ul className="space-y-3 mt-4">
              {experience.map((e: any, i) => (
                <li key={i} className="rounded-lg border border-border bg-background/40 p-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{e.role} at {e.company}</p>
                      <p className="text-xs text-muted-foreground">{e.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{e.from} → {e.to || (e.currentCompany ? "Present" : "—")}</span>
                      {canEditCandidate && (
                        <>
                          <button
                            onClick={() => {
                              setEditingExperienceIndex(i);
                              setExperienceForm({
                                company: e.company ?? "",
                                role: e.role ?? "",
                                from: e.from ?? "",
                                to: e.to ?? "",
                                currentCompany: Boolean(e.currentCompany),
                                description: e.description ?? "",
                                experienceType: e.experienceType ?? "Full Time",
                              });
                              setIsExperienceDialogOpen(true);
                            }}
                            className="rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-medium hover:bg-muted"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteExperienceMutation.mutate(i)}
                            className="rounded-lg border border-destructive bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/20"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
              {experience.length === 0 && <p className="text-xs text-muted-foreground p-3">No work experience details recorded.</p>}
            </ul>
          </ProfileSection>

          <ProfileSection icon={<ClipboardList className="size-4" />} title="Projects">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Track project deliverables and project type.</p>
              {canEditCandidate && (
                <button
                  onClick={() => {
                    setEditingProjectIndex(null);
                    setProjectForm({ name: "", description: "", type: "Static Project" });
                    setIsProjectDialogOpen(true);
                  }}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
                >
                  Add project
                </button>
              )}
            </div>

            <ul className="space-y-3 mt-4">
              {projects.map((p, i) => (
                <li key={i} className="rounded-lg border border-border bg-background/40 p-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {p.name}
                        {getProjectTypeBadge(p.type)}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                    {canEditCandidate && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingProjectIndex(i);
                            setProjectForm({
                              name: p.name ?? "",
                              description: p.description,
                              type: p.type ?? "Static Project",
                            });
                            setIsProjectDialogOpen(true);
                          }}
                          className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProjectMutation.mutate(i)}
                          className="rounded-lg border border-destructive bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/20"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
              {projects.length === 0 && <p className="text-xs text-muted-foreground p-3">No projects recorded.</p>}
            </ul>
          </ProfileSection>

          <ProfileSection icon={<GraduationCap className="size-4" />} title="Technical Training">
            <div className="space-y-3 text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-foreground">Passing year</span>
                  <input
                    type="number"
                    value={profileData.passingYear}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, passingYear: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    placeholder="2025"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-foreground">Candidate type</span>
                  <select
                    value={profileData.candidateType}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, candidateType: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select type</option>
                    <option value="STUDENT">STUDENT</option>
                    <option value="PASSOUT">PASSOUT</option>
                  </select>
                </label>
              </div>
              {profileData.candidateType === "STUDENT" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-foreground">Academic year</span>
                    <input
                      value={profileData.academicYear}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, academicYear: e.target.value }))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      placeholder="e.g. 3rd Year"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-foreground">CGPA</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={profileData.cgpa}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, cgpa: e.target.value }))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      placeholder="8.5"
                    />
                  </label>
                </div>
              )}
              {profileData.candidateType === "PASSOUT" && (
                <div className="space-y-2 text-sm">
                  <span className="font-medium text-foreground">CGPA</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={profileData.cgpa}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, cgpa: e.target.value }))}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    placeholder="8.5"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={profileData.technicalTraining.completed}
                  onChange={(e) => setProfileData((prev) => ({
                    ...prev,
                    technicalTraining: {
                      ...prev.technicalTraining,
                      completed: e.target.checked,
                    },
                  }))}
                />
                Training completed
              </label>

              {profileData.technicalTraining.completed ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-foreground">Training name</span>
                    <input
                      value={profileData.technicalTraining.trainingName}
                      onChange={(e) => setProfileData((prev) => ({
                        ...prev,
                        technicalTraining: {
                          ...prev.technicalTraining,
                          trainingName: e.target.value,
                        },
                      }))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-foreground">Institute</span>
                    <input
                      value={profileData.technicalTraining.institute}
                      onChange={(e) => setProfileData((prev) => ({
                        ...prev,
                        technicalTraining: {
                          ...prev.technicalTraining,
                          institute: e.target.value,
                        },
                      }))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-foreground">Duration</span>
                    <input
                      value={profileData.technicalTraining.duration}
                      onChange={(e) => setProfileData((prev) => ({
                        ...prev,
                        technicalTraining: {
                          ...prev.technicalTraining,
                          duration: e.target.value,
                        },
                      }))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium text-foreground">Completion year</span>
                    <input
                      type="number"
                      value={profileData.technicalTraining.completionYear}
                      onChange={(e) => setProfileData((prev) => ({
                        ...prev,
                        technicalTraining: {
                          ...prev.technicalTraining,
                          completionYear: e.target.value,
                        },
                      }))}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No technical training recorded.</p>
              )}
            </div>
          </ProfileSection>

          <ProfileSection icon={<MapPin className="size-4" />} title="Locations">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-medium text-foreground">Current Location</span>
                <input
                  value={profileData.currentLocation}
                  onChange={(e) => setProfileData((prev) => ({
                    ...prev,
                    currentLocation: e.target.value,
                  }))}
                  placeholder="e.g., Katraj, Pune"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium text-foreground">Permanent Location</span>
                <input
                  value={profileData.permanentLocation}
                  onChange={(e) => setProfileData((prev) => ({
                    ...prev,
                    permanentLocation: e.target.value,
                  }))}
                  placeholder="e.g., Patna, Bihar"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>
            {canEditCandidate && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => updateProfileMutation.mutate({
                    passingYear: profileData.passingYear ? Number(profileData.passingYear) : undefined,
                    candidateType: profileData.candidateType || undefined,
                    academicYear: profileData.candidateType === "STUDENT" ? profileData.academicYear || undefined : undefined,
                    cgpa: profileData.cgpa ? Number(profileData.cgpa) : undefined,
                    technicalTraining: {
                      completed: profileData.technicalTraining.completed,
                      trainingName: profileData.technicalTraining.trainingName,
                      institute: profileData.technicalTraining.institute,
                      duration: profileData.technicalTraining.duration,
                      completionYear: profileData.technicalTraining.completionYear ? Number(profileData.technicalTraining.completionYear) : undefined,
                    },
                    currentLocation: profileData.currentLocation,
                    permanentLocation: profileData.permanentLocation,
                  })}
                  disabled={updateProfileMutation.isPending}
                  className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {updateProfileMutation.isPending ? "Saving..." : "Save profile details"}
                </button>
              </div>
            )}
          </ProfileSection>

          <ProfileSection icon={<Award className="size-4" />} title="Certifications">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Add or update certification records.</p>
              {canEditCandidate && (
                <button
                  onClick={() => {
                    setEditingCertificationIndex(null);
                    setCertificationForm({ name: "", issuer: "", issueDate: "", expiryDate: "", certificateUrl: "" });
                    setIsCertificationDialogOpen(true);
                  }}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"
                >
                  Add certification
                </button>
              )}
            </div>
            <ul className="space-y-3 mt-4">
              {certifications.map((c: any, i) => (
                <li key={i} className="rounded-lg border border-border bg-background/40 p-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.issuer}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{c.issueDate ?? "—"}</span>
                      {canEditCandidate && (
                        <>
                          <button
                            onClick={() => {
                              setEditingCertificationIndex(i);
                              setCertificationForm({
                                name: c.name ?? "",
                                issuer: c.issuer ?? "",
                                issueDate: c.issueDate ?? "",
                                expiryDate: c.expiryDate ?? "",
                                certificateUrl: c.certificateUrl ?? "",
                              });
                              setIsCertificationDialogOpen(true);
                            }}
                            className="rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-medium hover:bg-muted"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteCertificationMutation.mutate(i)}
                            className="rounded-lg border border-destructive bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/20"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
              {certifications.length === 0 && <p className="text-xs text-muted-foreground p-3">No certifications recorded.</p>}
            </ul>
          </ProfileSection>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <div className="card-elevated p-6">
            <ol className="relative space-y-6 border-l-2 border-border pl-6">
              {timeline.map((t) => (
                <li key={t.id} className="relative">
                  <span className="absolute -left-[31px] grid size-5 place-items-center rounded-full border-2 border-card bg-primary shadow-sm" />
                  <p className="text-sm font-semibold text-foreground">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>}
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {t.at ? formatDistanceToNow(new Date(t.at), { addSuffix: true }) : "—"} • {t.by ?? "System"}
                  </p>
                </li>
              ))}
              {timeline.length === 0 && <p className="text-xs text-muted-foreground">No timeline events recorded.</p>}
            </ol>
          </div>
        </TabsContent>

        <TabsContent value="audits" className="mt-4">
          <div className="card-elevated overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  {["Field", "Old value", "New value", "Updated by", "Timestamp"].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {audits.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{a.field}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.oldValue}</td>
                    <td className="px-4 py-3 text-foreground">{a.newValue}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.updatedBy}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{a.timestamp ? format(new Date(a.timestamp), "MMM d, yyyy p") : "—"}</td>
                  </tr>
                ))}
                {audits.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-xs text-muted-foreground">No audit logs available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="interviews" className="mt-4">
          <div className="card-elevated divide-y divide-border">
            {candidateInterviews.length === 0 && <p className="p-6 text-sm text-muted-foreground">No interviews yet.</p>}
            {candidateInterviews.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><CalendarCheck className="size-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{i.interviewType} interview with {i.interviewerName}</p>
                    <p className="text-xs text-muted-foreground">{i.scheduledAt ? format(new Date(i.scheduledAt), "EEEE, MMM d • p") : "—"}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs mr-4">{i.status}</span>
                </div>
                {i.status === "SCHEDULED" && (
                  <button onClick={() => setCompleteInterviewId(i.id)} className="shrink-0 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted">
                    Complete
                  </button>
                )}
                {i.status === "COMPLETED" && (
                  <button onClick={() => setEvaluateInterviewId(i.id)} className="shrink-0 rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-glow hover:opacity-95">
                    Evaluate
                  </button>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground">Task management</h2>
                <p className="text-xs text-muted-foreground">Assign tasks, review submissions, and track completion for this candidate.</p>
              </div>
              {canEditCandidate && (
                <button
                  onClick={() => setIsTaskDialogOpen(true)}
                  className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Assign Task
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
                { label: "Assigned", value: candidateTasks.filter((t) => t.status === "ASSIGNED").length },
                { label: "Submitted", value: candidateTasks.filter((t) => t.status === "SUBMITTED").length },
                { label: "Reviewed", value: candidateTasks.filter((t) => t.status === "REVIEWED").length },
                { label: "Passed", value: candidateTasks.filter((t) => t.status === "PASSED").length },
                { label: "Failed", value: candidateTasks.filter((t) => t.status === "FAILED").length },
                { label: "Completed", value: candidateTasks.filter((t) => t.completed).length },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-border bg-background/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                  <p className="mt-3 text-lg font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            {candidateTasks.length === 0 ? (
              <div className="rounded-3xl border border-border bg-card p-6 text-sm text-muted-foreground">No tasks for this candidate yet.</div>
            ) : (
              <div className="grid gap-4">
                {candidateTasks.map((t) => (
                  <div key={t.id} className="rounded-3xl border border-border bg-background/80 p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{t.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{t.description ?? "No description provided."}</p>
                      </div>
                      <span className="inline-flex rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-semibold uppercase text-muted-foreground">
                        {t.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-card p-3 text-xs text-muted-foreground">
                        <div className="font-medium text-foreground">Assigned by</div>
                        <div>{t.assigneeName}</div>
                      </div>
                      {/* Due date removed from task summary */}
                      <div className="rounded-2xl bg-card p-3 text-xs text-muted-foreground">
                        <div className="font-medium text-foreground">Start date</div>
                        <div>{t.startDate ? format(new Date(t.startDate), "MMM d, yyyy") : "—"}</div>
                      </div>
                      <div className="rounded-2xl bg-card p-3 text-xs text-muted-foreground">
                        <div className="font-medium text-foreground">End date</div>
                        <div>{t.endDate ? format(new Date(t.endDate), "MMM d, yyyy") : "—"}</div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {t.submissionLink && (
                        <div className="rounded-2xl bg-card p-3 text-xs text-muted-foreground">
                          <div className="font-medium text-foreground">Submission</div>
                          <a href={t.submissionLink} target="_blank" rel="noreferrer" className="text-primary underline">
                            View work
                          </a>
                        </div>
                      )}
                      {t.projectDemoStatus && (
                        <div className="rounded-2xl bg-card p-3 text-xs text-muted-foreground">
                          <div className="font-medium text-foreground">Demo status</div>
                          <div>{t.projectDemoStatus}</div>
                        </div>
                      )}
                      {t.reviewOutcome && (
                        <div className="rounded-2xl bg-card p-3 text-xs text-muted-foreground">
                          <div className="font-medium text-foreground">Review outcome</div>
                          <div>{t.reviewOutcome}</div>
                        </div>
                      )}
                      {t.score !== undefined && (
                        <div className="rounded-2xl bg-card p-3 text-xs text-muted-foreground">
                          <div className="font-medium text-foreground">Score</div>
                          <div>{t.score}</div>
                        </div>
                      )}
                      {t.reviewedBy && (
                        <div className="rounded-2xl bg-card p-3 text-xs text-muted-foreground">
                          <div className="font-medium text-foreground">Reviewed by</div>
                          <div>{t.reviewedBy}</div>
                        </div>
                      )}
                      {t.reviewedAt && (
                        <div className="rounded-2xl bg-card p-3 text-xs text-muted-foreground">
                          <div className="font-medium text-foreground">Reviewed at</div>
                          <div>{format(new Date(t.reviewedAt), "MMM d, yyyy")}</div>
                        </div>
                      )}
                      {typeof t.completed === "boolean" && (
                        <div className="rounded-2xl bg-card p-3 text-xs text-muted-foreground">
                          <div className="font-medium text-foreground">Completed</div>
                          <div>{t.completed ? "Yes" : "No"}</div>
                        </div>
                      )}
                    </div>

                    {t.remarks && (
                      <div className="mt-4 rounded-3xl border border-border bg-card p-3 text-sm text-muted-foreground">
                        <div className="font-medium text-foreground">Remarks</div>
                        <p>{t.remarks}</p>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {t.status === "ASSIGNED" && (
                        <button onClick={() => setSubmitTaskId(t.id)} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted">
                          Submit Link
                        </button>
                      )}
                      {t.status === "SUBMITTED" && (
                        <>
                          <button onClick={() => setCompleteTaskId(t.id)} className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted">
                            Complete Task
                          </button>
                          <button onClick={() => setReviewTaskId(t.id)} className="rounded-lg gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-glow hover:opacity-95">
                            Review Task
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Task</DialogTitle>
            <DialogDescription>Create a new task for this candidate.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Task title</span>
              <input
                value={taskForm.title}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="E.g. Build sample feature"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Description</span>
              <textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={4}
                placeholder="Provide details and acceptance criteria"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-medium text-foreground">Start date</span>
                <input
                  type="date"
                  value={taskForm.startDate}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
              {/* Due date removed per new requirements */}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-medium text-foreground">End date</span>
                <input
                  type="date"
                  value={taskForm.endDate}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium text-foreground">Demo status</span>
                <select
                  value={taskForm.projectDemoStatus}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, projectDemoStatus: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="PENDING">Pending</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </label>
            </div>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Remarks</span>
              <textarea
                value={taskForm.remarks}
                onChange={(e) => setTaskForm((prev) => ({ ...prev, remarks: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                placeholder="Optional notes or instructions"
              />
            </label>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsTaskDialogOpen(false)}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
              <button
              onClick={() => createTaskMutation.mutate({
                candidateId: id!,
                title: taskForm.title,
                description: taskForm.description,
                startDate: taskForm.startDate ? new Date(taskForm.startDate).toISOString() : undefined,
                endDate: taskForm.endDate ? new Date(taskForm.endDate).toISOString() : undefined,
                projectDemoStatus: taskForm.projectDemoStatus,
                remarks: taskForm.remarks,
              })}
              disabled={createTaskMutation.isPending || !taskForm.title.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {createTaskMutation.isPending ? "Assigning..." : "Assign Task"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign HR Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign HR</DialogTitle>
            <DialogDescription>Select an HR representative to assign to this candidate.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedHrId}
              onChange={(e) => setSelectedHrId(e.target.value)}
            >
              <option value="">Select HR...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <button 
              onClick={() => setIsAssignOpen(false)}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
            <button 
              onClick={() => assignMutation.mutate(selectedHrId)}
              disabled={!selectedHrId || assignMutation.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {assignMutation.isPending ? "Assigning..." : "Assign"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Skill Dialog */}
      <Dialog open={isAddSkillOpen} onOpenChange={setIsAddSkillOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Skill</DialogTitle>
            <DialogDescription>Enter a skill to add to the candidate's top skills.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Skill</label>
              <input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g. React"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsAddSkillOpen(false)}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
            <button
              onClick={() => addSkillMutation.mutate(newSkill)}
              disabled={addSkillMutation.isPending || !newSkill.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {addSkillMutation.isPending ? "Adding..." : "Add Skill"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Dialog */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProjectIndex !== null ? "Edit Project" : "Add Project"}</DialogTitle>
            <DialogDescription>{editingProjectIndex !== null ? "Update project details." : "Create a new candidate project."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Project name</span>
              <input
                value={projectForm.name}
                onChange={(e) => setProjectForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Project name"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Description</span>
              <textarea
                value={projectForm.description}
                onChange={(e) => setProjectForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={4}
                placeholder="Brief description of the project"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Project type</span>
              <select
                value={projectForm.type}
                onChange={(e) => setProjectForm((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="Static Project">Static Project</option>
                <option value="Dynamic Project">Dynamic Project</option>
              </select>
            </label>
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setIsProjectDialogOpen(false);
                setEditingProjectIndex(null);
                setProjectForm({ name: "", description: "", type: "Static Project" });
              }}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (editingProjectIndex !== null) {
                  updateProjectMutation.mutate({ index: editingProjectIndex, project: projectForm });
                } else {
                  addProjectMutation.mutate(projectForm);
                }
              }}
              disabled={projectForm.name.trim().length === 0 || projectForm.description.trim().length === 0 || addProjectMutation.isPending || updateProjectMutation.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {editingProjectIndex !== null ? (updateProjectMutation.isPending ? "Saving..." : "Save changes") : (addProjectMutation.isPending ? "Creating..." : "Create project")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Education Dialog */}
      <Dialog open={isEducationDialogOpen} onOpenChange={setIsEducationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEducationIndex !== null ? "Edit Education" : "Add Education"}</DialogTitle>
            <DialogDescription>{editingEducationIndex !== null ? "Update education information." : "Add a new education entry."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Degree</span>
              <input
                value={educationForm.degree}
                onChange={(e) => setEducationForm((prev) => ({ ...prev, degree: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g. B.Tech Computer Science"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Institute</span>
              <input
                value={educationForm.institute}
                onChange={(e) => setEducationForm((prev) => ({ ...prev, institute: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="e.g. Pune University"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-medium text-foreground">Year</span>
                <input
                  value={educationForm.year}
                  onChange={(e) => setEducationForm((prev) => ({ ...prev, year: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="2025"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium text-foreground">CGPA</span>
                <input
                  value={educationForm.cgpa}
                  onChange={(e) => setEducationForm((prev) => ({ ...prev, cgpa: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="8.5"
                />
              </label>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setIsEducationDialogOpen(false);
                setEditingEducationIndex(null);
                setEducationForm({ degree: "", institute: "", year: "", cgpa: "" });
              }}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const updatedEducation = [...educationList];
                const newEntry = {
                  degree: educationForm.degree,
                  institute: educationForm.institute,
                  year: educationForm.year,
                  cgpa: educationForm.cgpa,
                };
                if (editingEducationIndex !== null) {
                  updatedEducation[editingEducationIndex] = newEntry;
                } else {
                  updatedEducation.push(newEntry);
                }
                setEducationList(updatedEducation);
                updateEducationMutation.mutate({
                  education: updatedEducation,
                  passingYear: profileData.passingYear ? Number(profileData.passingYear) : undefined,
                  candidateType: profileData.candidateType || undefined,
                  academicYear: profileData.candidateType === "STUDENT" ? profileData.academicYear || undefined : undefined,
                  cgpa: profileData.cgpa ? Number(profileData.cgpa) : undefined,
                });
              }}
              disabled={!educationForm.degree.trim() || !educationForm.institute.trim() || !educationForm.year.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {editingEducationIndex !== null ? "Save changes" : "Add education"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Experience Dialog */}
      <Dialog open={isExperienceDialogOpen} onOpenChange={setIsExperienceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExperienceIndex !== null ? "Edit Experience" : "Add Experience"}</DialogTitle>
            <DialogDescription>{editingExperienceIndex !== null ? "Update the work experience entry." : "Capture a work experience entry."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Company</span>
              <input
                value={experienceForm.company}
                onChange={(e) => setExperienceForm((prev) => ({ ...prev, company: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Company name"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Role</span>
              <input
                value={experienceForm.role}
                onChange={(e) => setExperienceForm((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Role title"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-medium text-foreground">From</span>
                <input
                  value={experienceForm.from}
                  onChange={(e) => setExperienceForm((prev) => ({ ...prev, from: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Start date or year"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium text-foreground">To</span>
                <input
                  value={experienceForm.to}
                  onChange={(e) => setExperienceForm((prev) => ({ ...prev, to: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="End date or Present"
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={experienceForm.currentCompany}
                onChange={(e) => setExperienceForm((prev) => ({ ...prev, currentCompany: e.target.checked }))}
                className="accent-primary"
              />
              Currently working here
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Description</span>
              <textarea
                value={experienceForm.description}
                onChange={(e) => setExperienceForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={4}
                placeholder="Short summary of responsibilities"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Experience type</span>
              <select
                value={experienceForm.experienceType}
                onChange={(e) => setExperienceForm((prev) => ({ ...prev, experienceType: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
            </label>
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setIsExperienceDialogOpen(false);
                setEditingExperienceIndex(null);
                setExperienceForm({ company: "", role: "", from: "", to: "", currentCompany: false, description: "", experienceType: "Full Time" });
              }}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const experienceData = {
                  company: experienceForm.company,
                  role: experienceForm.role,
                  from: experienceForm.from,
                  to: experienceForm.to,
                  currentCompany: experienceForm.currentCompany,
                  description: experienceForm.description,
                  experienceType: experienceForm.experienceType,
                };
                if (editingExperienceIndex !== null) {
                  updateExperienceMutation.mutate({ index: editingExperienceIndex, experience: experienceData });
                } else {
                  addExperienceMutation.mutate(experienceData);
                }
              }}
              disabled={!experienceForm.company.trim() || !experienceForm.role.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {editingExperienceIndex !== null ? "Save changes" : "Add experience"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Certification Dialog */}
      <Dialog open={isCertificationDialogOpen} onOpenChange={setIsCertificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCertificationIndex !== null ? "Edit Certification" : "Add Certification"}</DialogTitle>
            <DialogDescription>{editingCertificationIndex !== null ? "Update certification details." : "Create a new certification record."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Certificate Name</span>
              <input
                value={certificationForm.name}
                onChange={(e) => setCertificationForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Certificate name"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Issuer</span>
              <input
                value={certificationForm.issuer}
                onChange={(e) => setCertificationForm((prev) => ({ ...prev, issuer: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Issuing organization"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-medium text-foreground">Issue date</span>
                <input
                  type="date"
                  value={certificationForm.issueDate}
                  onChange={(e) => setCertificationForm((prev) => ({ ...prev, issueDate: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium text-foreground">Expiry date</span>
                <input
                  type="date"
                  value={certificationForm.expiryDate}
                  onChange={(e) => setCertificationForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Certificate URL</span>
              <input
                type="url"
                value={certificationForm.certificateUrl}
                onChange={(e) => setCertificationForm((prev) => ({ ...prev, certificateUrl: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Optional link to certificate"
              />
            </label>
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setIsCertificationDialogOpen(false);
                setEditingCertificationIndex(null);
                setCertificationForm({ name: "", issuer: "", issueDate: "", expiryDate: "", certificateUrl: "" });
              }}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const certData = {
                  name: certificationForm.name,
                  issuer: certificationForm.issuer,
                  issueDate: certificationForm.issueDate,
                  expiryDate: certificationForm.expiryDate,
                  certificateUrl: certificationForm.certificateUrl,
                };
                if (editingCertificationIndex !== null) {
                  updateCertificationMutation.mutate({ index: editingCertificationIndex, certification: certData });
                } else {
                  addCertificationMutation.mutate(certData);
                }
              }}
              disabled={!certificationForm.name.trim() || !certificationForm.issuer.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {editingCertificationIndex !== null ? "Save changes" : "Add certification"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Call Dialog */}
      <Dialog open={isCallOpen} onOpenChange={setIsCallOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log a Call</DialogTitle>
            <DialogDescription>Record the outcome of your call with {candidate?.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Call Number</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={callData.callNumber}
                onChange={(e) => setCallData({ ...callData, callNumber: Number(e.target.value) })}
              >
                <option value={1}>First Call</option>
                <option value={2}>Second Call</option>
                <option value={3}>Third Call</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Outcome</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={callData.outcome}
                onChange={(e) => setCallData({ ...callData, outcome: e.target.value })}
              >
                <option value="Answered">Answered</option>
                <option value="Not Picked Up">Not Picked Up</option>
                <option value="Busy">Busy</option>
                <option value="Call Rejected">Call Rejected</option>
                <option value="Invalid Number">Invalid Number</option>
              </select>
            </div>
            
            {callData.outcome === "Answered" && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Interested?</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={callData.interested}
                  onChange={(e) => setCallData({ ...callData, interested: e.target.value })}
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Will Think">Will Think</option>
                  <option value="Will Call Back">Will Call Back</option>
                </select>
              </div>
            )}

            {callData.outcome === "Answered" && callData.interested === "No" && (
              <div className="grid gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!callData.drop} onChange={(e) => setCallData({ ...callData, drop: e.target.checked })} />
                  <span>Drop candidate?</span>
                </label>
                {callData.drop && (
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={callData.dropReason} onChange={(e) => setCallData({ ...callData, dropReason: e.target.value })}>
                    <option value="Not Interested">Not Interested</option>
                  </select>
                )}
              </div>
            )}
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                placeholder="Any important details from the call..."
                value={callData.notes}
                onChange={(e) => setCallData({ ...callData, notes: e.target.value })}
              />
            </div>

            {callData.outcome === "Invalid Number" && (
              <div className="grid gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!callData.drop} onChange={(e) => setCallData({ ...callData, drop: e.target.checked, dropReason: e.target.checked ? 'Invalid Number' : '' })} />
                  <span>Drop candidate due to invalid number</span>
                </label>
              </div>
            )}

            {callData.callNumber === 3 && (
              <div className="grid gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!callData.dropAfter3} onChange={(e) => setCallData({ ...callData, dropAfter3: e.target.checked })} />
                  <span>Drop candidate after 3rd unsuccessful attempt</span>
                </label>
              </div>
            )}
          </div>
          <DialogFooter>
            <button 
              onClick={() => setIsCallOpen(false)}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
            <button 
              onClick={() => callMutation.mutate(callData)}
              disabled={callMutation.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {callMutation.isPending ? "Logging..." : "Log Call"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={isScheduleInterviewOpen} onOpenChange={setIsScheduleInterviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>Schedule an interview for {candidate?.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Interview Type</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={scheduleData.interviewType}
                onChange={(e) => setScheduleData({ ...scheduleData, interviewType: e.target.value })}
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
                value={scheduleData.interviewDate}
                onChange={(e) => setScheduleData({ ...scheduleData, interviewDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Interview Time</label>
              <input
                type="time"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={scheduleData.interviewTime}
                onChange={(e) => setScheduleData({ ...scheduleData, interviewTime: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <button 
              onClick={() => setIsScheduleInterviewOpen(false)}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
            <button 
              onClick={() => scheduleInterviewMutation.mutate(scheduleData)}
              disabled={scheduleInterviewMutation.isPending || !scheduleData.interviewDate || !scheduleData.interviewTime}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {scheduleInterviewMutation.isPending ? "Scheduling..." : "Schedule Interview"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Interview Dialog */}
      <Dialog open={!!completeInterviewId} onOpenChange={(open) => !open && setCompleteInterviewId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Interview</DialogTitle>
            <DialogDescription>Record the feedback and rating for this interview.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Rating (1-10)</label>
              <input 
                type="number" min="1" max="10"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={completeData.rating}
                onChange={(e) => setCompleteData({ ...completeData, rating: parseInt(e.target.value) || 5 })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Feedback Notes</label>
              <textarea 
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={4}
                placeholder="Technical skills, communication, culture fit..."
                value={completeData.feedback}
                onChange={(e) => setCompleteData({ ...completeData, feedback: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <button 
              onClick={() => setCompleteInterviewId(null)}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
            <button 
              onClick={() => completeMutation.mutate(completeData)}
              disabled={completeMutation.isPending || !completeData.feedback}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {completeMutation.isPending ? "Completing..." : "Complete Interview"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evaluate Interview Dialog */}
      <Dialog open={!!evaluateInterviewId} onOpenChange={(open) => !open && setEvaluateInterviewId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Evaluate Interview</DialogTitle>
            <DialogDescription>Make a decision based on the interview outcome.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Decision</label>
              <select 
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={evaluateData.decision}
                onChange={(e) => setEvaluateData({ ...evaluateData, decision: e.target.value })}
              >
                <option value="SELECT">Select candidate</option>
                <option value="TASK">Assign Task</option>
                <option value="DROP">Drop candidate</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Reason / Justification</label>
              <textarea 
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                placeholder="Why was this decision made?"
                value={evaluateData.reason}
                onChange={(e) => setEvaluateData({ ...evaluateData, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <button 
              onClick={() => setEvaluateInterviewId(null)}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
            <button 
              onClick={() => evaluateMutation.mutate(evaluateData)}
              disabled={evaluateMutation.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {evaluateMutation.isPending ? "Submitting..." : "Submit Evaluation"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Task Dialog */}
      <Dialog open={!!submitTaskId} onOpenChange={(open) => !open && setSubmitTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Task</DialogTitle>
            <DialogDescription>Submit the candidate's completed work link.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Submission Link</label>
              <input 
                type="url"
                placeholder="https://github.com/... or Google Drive link"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={submitData.submissionLink}
                onChange={(e) => setSubmitData({ ...submitData, submissionLink: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <button 
              onClick={() => setSubmitTaskId(null)}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
            <button 
              onClick={() => submitTaskMutation.mutate(submitData)}
              disabled={submitTaskMutation.isPending || !submitData.submissionLink}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitTaskMutation.isPending ? "Submitting..." : "Submit Task"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Task Dialog */}
      <Dialog open={!!reviewTaskId} onOpenChange={(open) => !open && setReviewTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Task</DialogTitle>
            <DialogDescription>Evaluate the candidate's submitted work.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Outcome</label>
              <select 
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={reviewData.outcome}
                onChange={(e) => setReviewData({ ...reviewData, outcome: e.target.value })}
              >
                <option value="SATISFIED">Satisfied (Pass)</option>
                <option value="NEEDS_IMPROVEMENT">Needs Improvement (Rework)</option>
                <option value="FAILED">Failed (Drop)</option>
              </select>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Score (0-100)</label>
              <input 
                type="number" min="0" max="100"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={reviewData.score}
                onChange={(e) => setReviewData({ ...reviewData, score: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Review Notes</label>
              <textarea 
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                placeholder="Detailed feedback..."
                value={reviewData.reviewNotes}
                onChange={(e) => setReviewData({ ...reviewData, reviewNotes: e.target.value })}
              />
            </div>

            {reviewData.outcome !== "SATISFIED" && (
              <div className="grid gap-2 border-t pt-4">
                <label className="text-sm font-medium text-destructive">
                  {reviewData.outcome === "FAILED" ? "Reason for Drop" : "Reason for Rework"}
                </label>
                <input 
                  type="text"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={reviewData.reason}
                  onChange={(e) => setReviewData({ ...reviewData, reason: e.target.value })}
                />
              </div>
            )}
            
            {reviewData.outcome === "NEEDS_IMPROVEMENT" && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">New Deadline</label>
                <input 
                  type="datetime-local"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={reviewData.newDeadline}
                  onChange={(e) => setReviewData({ ...reviewData, newDeadline: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <button 
              onClick={() => setReviewTaskId(null)}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
            <button 
              onClick={() => reviewTaskMutation.mutate(reviewData)}
              disabled={reviewTaskMutation.isPending || (reviewData.outcome === "NEEDS_IMPROVEMENT" && !reviewData.newDeadline)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {reviewTaskMutation.isPending ? "Submitting..." : "Submit Review"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Task Dialog */}
      <Dialog open={!!completeTaskId} onOpenChange={(open) => !open && setCompleteTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>Record a final score and close this task.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Rating (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={completeTaskData.score}
                onChange={(e) => setCompleteTaskData({ ...completeTaskData, score: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Review notes</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                placeholder="Final notes for the candidate"
                value={completeTaskData.reviewNotes}
                onChange={(e) => setCompleteTaskData({ ...completeTaskData, reviewNotes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setCompleteTaskId(null)}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Cancel
            </button>
            <button
              onClick={() => completeTaskMutation.mutate(completeTaskData)}
              disabled={completeTaskMutation.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {completeTaskMutation.isPending ? "Completing..." : "Mark Complete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProfileSection({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="card-elevated p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">{icon}</span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}
