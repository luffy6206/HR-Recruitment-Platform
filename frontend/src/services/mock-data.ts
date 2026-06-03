import type {
  AuditEntry,
  Candidate,
  CandidateProfile,
  DashboardStats,
  Interview,
  NotificationItem,
  Task,
  TimelineEvent,
  User,
} from "@/types";

const CATEGORIES = ["Engineering", "Design", "Product", "Sales", "Marketing", "Operations"];
const STATUSES = ["NEW", "CONTACTED", "INTERVIEW", "SELECTED", "DROPPED", "ON_HOLD"] as const;
const FIRST = ["Aarav", "Diya", "Kabir", "Anaya", "Vihaan", "Ira", "Arjun", "Myra", "Reyansh", "Saanvi", "Ayaan", "Aadhya", "Krishna", "Anika", "Ishaan", "Riya", "Aditya", "Pari", "Vivaan", "Navya"];
const LAST = ["Sharma", "Verma", "Patel", "Iyer", "Reddy", "Khan", "Singh", "Mehta", "Kapoor", "Joshi"];

function rand<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function id(n: number) { return Math.random().toString(36).slice(2, 2 + n); }

export const MOCK_USERS: (User & { password: string })[] = [
  { id: "u1", name: "Aanya Kapoor", email: "admin@hrr.app", password: "admin123", role: "ADMIN" },
  { id: "u2", name: "Rohan Mehta", email: "hr@hrr.app", password: "hr123", role: "HR" },
];

export const MOCK_CANDIDATES: Candidate[] = Array.from({ length: 48 }).map((_, i) => {
  const name = `${rand(FIRST)} ${rand(LAST)}`;
  return {
    id: `c${i + 1}`,
    code: `CAN-${(1000 + i).toString()}`,
    name,
    email: `${name.toLowerCase().replace(/\s/g, ".")}@mail.com`,
    phone: `+91 9${Math.floor(100000000 + Math.random() * 899999999)}`,
    category: rand(CATEGORIES),
    status: rand(STATUSES),
    createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 90).toISOString(),
    assignedTo: Math.random() > 0.3 ? "Rohan Mehta" : undefined,
  };
});

export function mockProfile(candidateId: string): CandidateProfile {
  return {
    education: [
      { degree: "B.Tech Computer Science", institute: "IIT Bombay", year: "2022" },
      { degree: "Higher Secondary", institute: "DPS RK Puram", year: "2018" },
    ],
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS", "Docker", "GraphQL"],
    experience: [
      { company: "Stripe", role: "Senior Frontend Engineer", from: "2023", to: "Present" },
      { company: "Razorpay", role: "Frontend Engineer", from: "2022", to: "2023" },
    ],
    projects: [
      { name: "Payments Dashboard", description: "Built a real-time analytics dashboard serving 50M+ events/day." },
      { name: "Design System", description: "Authored an internal design system used by 200+ engineers." },
    ],
    certifications: [
      { name: "AWS Solutions Architect", issuer: "Amazon", year: "2024" },
      { name: "Kubernetes Administrator", issuer: "CNCF", year: "2023" },
    ],
  };
}

export function mockTimeline(candidateId: string): TimelineEvent[] {
  const now = Date.now();
  return [
    { id: id(6), type: "RESUME", title: "Resume uploaded", at: new Date(now - 86400000 * 12).toISOString(), by: "System" },
    { id: id(6), type: "CALL", title: "Initial screening call completed", description: "30-min intro call. Strong communication.", at: new Date(now - 86400000 * 10).toISOString(), by: "Rohan Mehta" },
    { id: id(6), type: "TASK", title: "Take-home assignment assigned", at: new Date(now - 86400000 * 8).toISOString(), by: "Rohan Mehta" },
    { id: id(6), type: "INTERVIEW", title: "Technical interview scheduled", description: "Live coding with senior engineer", at: new Date(now - 86400000 * 5).toISOString(), by: "Aanya Kapoor" },
    { id: id(6), type: "INTERVIEW", title: "Technical interview completed", description: "Recommended for hire", at: new Date(now - 86400000 * 2).toISOString(), by: "Rohan Mehta" },
    { id: id(6), type: "STATUS", title: "Candidate selected", at: new Date(now - 86400000 * 1).toISOString(), by: "Aanya Kapoor" },
  ];
}

export function mockAudits(candidateId: string): AuditEntry[] {
  return [
    { id: id(6), field: "status", oldValue: "NEW", newValue: "CONTACTED", updatedBy: "Rohan Mehta", timestamp: new Date(Date.now() - 86400000 * 10).toISOString() },
    { id: id(6), field: "category", oldValue: "Product", newValue: "Engineering", updatedBy: "Aanya Kapoor", timestamp: new Date(Date.now() - 86400000 * 9).toISOString() },
    { id: id(6), field: "status", oldValue: "CONTACTED", newValue: "INTERVIEW", updatedBy: "Rohan Mehta", timestamp: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: id(6), field: "status", oldValue: "INTERVIEW", newValue: "SELECTED", updatedBy: "Aanya Kapoor", timestamp: new Date(Date.now() - 86400000 * 1).toISOString() },
  ];
}

export const MOCK_INTERVIEWS: Interview[] = Array.from({ length: 14 }).map((_, i) => {
  const c = MOCK_CANDIDATES[i];
  const future = i % 2 === 0;
  return {
    id: `i${i + 1}`,
    candidateId: c.id,
    candidateName: c.name,
    interviewerName: rand(["Aanya Kapoor", "Rohan Mehta", "Ishan Verma", "Priya Singh"]),
    interviewType: rand(["PHONE", "VIDEO", "ONSITE", "TECHNICAL", "HR"] as const),
    scheduledAt: new Date(Date.now() + (future ? 1 : -1) * (i + 1) * 86400000 * 0.5).toISOString(),
    status: future ? "SCHEDULED" : "COMPLETED",
  };
});

export const MOCK_TASKS: Task[] = Array.from({ length: 16 }).map((_, i) => ({
  id: `t${i + 1}`,
  title: rand([
    "Review take-home assignment",
    "Schedule follow-up call",
    "Send offer letter",
    "Reference check",
    "Background verification",
    "Onboarding kit",
  ]) + ` — ${MOCK_CANDIDATES[i % MOCK_CANDIDATES.length].name}`,
  description: "Coordinate with the hiring panel and update the candidate timeline.",
  status: rand(["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const),
  priority: rand(["LOW", "MEDIUM", "HIGH", "URGENT"] as const),
  dueDate: new Date(Date.now() + (i - 4) * 86400000).toISOString(),
  assigneeName: rand(["Rohan Mehta", "Priya Singh", "Aanya Kapoor"]),
  candidateName: MOCK_CANDIDATES[i % MOCK_CANDIDATES.length].name,
}));

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: "n1", title: "New candidate assigned", body: "Aarav Sharma has been assigned to you.", read: false, createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), type: "INFO" },
  { id: "n2", title: "Interview in 1 hour", body: "Technical round with Diya Patel.", read: false, createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), type: "WARNING" },
  { id: "n3", title: "Offer accepted", body: "Kabir Iyer accepted the offer.", read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), type: "SUCCESS" },
  { id: "n4", title: "Task overdue", body: "Background check for Anaya Reddy is overdue.", read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), type: "DANGER" },
  { id: "n5", title: "Weekly report ready", body: "Your recruitment report for last week is ready.", read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), type: "INFO" },
];

export function mockStats(): DashboardStats {
  const all = MOCK_CANDIDATES;
  return {
    totalCandidates: all.length,
    contactedCandidates: all.filter((c) => c.status === "CONTACTED").length,
    selectedCandidates: all.filter((c) => c.status === "SELECTED").length,
    droppedCandidates: all.filter((c) => c.status === "DROPPED").length,
    followUpsToday: 7,
  };
}
