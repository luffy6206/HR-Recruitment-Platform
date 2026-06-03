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
  | "CONTACTED"
  | "INTERVIEW"
  | "SELECTED"
  | "DROPPED"
  | "ON_HOLD";

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
}

export interface CandidateProfile {
  education: { degree: string; institute: string; year: string }[];
  skills: string[];
  experience: { company: string; role: string; from: string; to: string }[];
  projects: { name: string; description: string }[];
  certifications: { name: string; issuer: string; year: string }[];
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
  interviewType: "PHONE" | "VIDEO" | "ONSITE" | "TECHNICAL" | "HR";
  scheduledAt: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assigneeName: string;
  candidateName?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "DANGER";
}

export interface DashboardStats {
  totalCandidates: number;
  contactedCandidates: number;
  selectedCandidates: number;
  droppedCandidates: number;
  followUpsToday: number;
}
