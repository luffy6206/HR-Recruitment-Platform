export type Role = "ADMIN" | "HR";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export type CandidateStatus =
  | "NEW"
  | "AI_PROCESSING"
  | "AI_PROCESSED"
  | "FIRST_CALL_DONE"
  | "SECOND_CALL_DONE"
  | "THIRD_CALL_DONE"
  | "LINED_UP"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_COMPLETED"
  | "TASK_ASSIGNED"
  | "TASK_REVIEW"
  | "SELECTED"
  | "DROPPED";

export interface Candidate {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  status: CandidateStatus;
  createdAt: string;
  assignedTo?: string;
  assignedToId?: string;
  candidateType?: "PASSOUT" | "STUDENT";
  aiAnalysis?: {
    skills: string[];
    experienceYears: number;
    education: string;
    currentCompany: string;
    designation: string;
    location: string;
    summary: string;
    resumeScore: number;
  };
}

export interface CandidateProfile {
  education: { degree: string; institute: string; year: string }[];
  skills: string[];
  experience: { company: string; role: string; from: string; to: string }[];
  projects: { name: string; description: string; type?: string }[];
  certifications: { name: string; issuer: string; year: string }[];
  technicalTraining?: {
    completed: boolean;
    trainingName?: string;
    institute?: string;
    duration?: string;
    completionYear?: number;
  };
  currentLocation?: string;
  permanentLocation?: string;
  passingYear?: number;
  candidateType?: "PASSOUT" | "STUDENT";
  academicYear?: string;
  cgpa?: number;
}

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  at: string;
  by?: string;
}

export interface AuditEntry {
  id: string;
  field: string;
  oldValue: string;
  newValue: string;
  updatedBy: string;
  timestamp: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  interviewerName: string;
  interviewType: "HR" | "TECHNICAL" | "MANAGERIAL" | "FINAL";
  scheduledAt: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
}

export type TaskStatus = "ASSIGNED" | "IN_PROGRESS" | "SUBMITTED" | "REVIEWED" | "PASSED" | "FAILED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
  id: string;
  candidateId?: string;
  candidateName?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  submissionLink?: string;
  reviewOutcome?: string;
  reviewNotes?: string;
  reviewReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  score?: number;
  completed?: boolean;
  projectDemoStatus?: string;
  remarks?: string;
  assigneeName: string;
  assignedByName?: string;
  createdAt?: string;
}

export interface DailyReport {
  id: string;
  hrId: string;
  reportDate: string;
  candidatesAssigned: number;
  candidatesCalled: number;
  interviewsScheduled: number;
  selectedCandidates: number;
  droppedCandidates: number;
  pendingCandidates: number;
  createdAt?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "DANGER" | "ASSIGNMENT" | "SYSTEM";
}

export interface DashboardStats {
  totalCandidates: number;
  firstCallPending: number;
  secondCallPending: number;
  thirdCallPending: number;
  followUpsToday: number;
  interviewsToday: number;
  tasksToReview: number;
  selectedCandidates: number;
  droppedCandidates: number;
}
// Add to existing types file:

export interface ResumeAnalysisResult {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experienceYears: number;
  education: string;
  currentCompany: string;
  designation: string;
  location: string;
  summary: string;
  resumeScore: number; // 0-100
}

export interface CandidateFromResume extends Omit<Candidate, "id" | "code" | "createdAt"> {
  aiAnalysis: ResumeAnalysisResult;
}