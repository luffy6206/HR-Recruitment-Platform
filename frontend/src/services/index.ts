/**
 * Service layer. Currently backed by mock data so the UI works out of the box.
 * Swap each function body to use `http.get/post/...` once the real API is live.
 * The HTTP client + axios interceptors live in `./http.ts`.
 */
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
import {
  MOCK_CANDIDATES,
  MOCK_INTERVIEWS,
  MOCK_NOTIFICATIONS,
  MOCK_TASKS,
  MOCK_USERS,
  mockAudits,
  mockProfile,
  mockStats,
  mockTimeline,
} from "./mock-data";

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

// ---- Auth ----
import { http } from "./http";

export const authService = {
  async login(email: string, password: string) {
    const response = await http.post("/auth/login", { email, password });
    const payload = response.data;
    const user = payload.user;
    return {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      user: {
        id: user._id ?? user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },

  async logout() {
    await http.post("/auth/logout");
  },
};

// ---- Dashboard ----
export const dashboardService = {
  async get(): Promise<DashboardStats> { await delay(); return mockStats(); },
};

const normalizeCandidate = (candidate: any): Candidate => ({
  id: candidate._id ?? candidate.id ?? "",
  code: candidate.code ?? "",
  name: candidate.name ?? "Unknown Candidate",
  email: candidate.email ?? "",
  phone: candidate.phone ?? "",
  category: candidate.category ?? "General",
  status: candidate.status ?? "NEW",
  createdAt: candidate.createdAt ?? new Date().toISOString(),
  assignedTo: candidate.assignedHR ?? undefined,
});

// ---- Candidates ----
export const candidateService = {
  async list(): Promise<Candidate[]> {
    const response = await http.get("/candidates");
    return (response.data.candidates ?? []).map(normalizeCandidate);
  },

  async get(id: string): Promise<{
    candidate: Candidate;
    profile: CandidateProfile | null;
    timeline: TimelineEvent[];
    audits: AuditEntry[];
  }> {
    const response = await http.get(`/candidates/${id}`);
    return {
      ...response.data,
      candidate: normalizeCandidate(response.data.candidate),
    };
  },

  async create(data: Omit<Candidate, "id" | "code" | "status" | "createdAt">): Promise<Candidate> {
    const response = await http.post("/candidates", data);
    return normalizeCandidate(response.data);
  },

  async update(id: string, patch: Partial<Candidate>): Promise<Candidate> {
    const response = await http.patch(`/candidates/${id}`, patch);
    return normalizeCandidate(response.data);
  },

  async remove(id: string): Promise<void> {
    await http.delete(`/candidates/${id}`);
  },
};

// ---- Interviews ----
let _interviews = [...MOCK_INTERVIEWS];
export const interviewService = {
  async list(): Promise<Interview[]> { await delay(); return [..._interviews]; },
  async create(data: Omit<Interview, "id" | "status" | "candidateName">): Promise<Interview> {
    await delay();
    const cand = MOCK_CANDIDATES.find((c) => c.id === data.candidateId);
    const newI: Interview = {
      ...data,
      id: `i${Date.now()}`,
      status: "SCHEDULED",
      candidateName: cand?.name ?? "Candidate",
    };
    _interviews = [newI, ..._interviews];
    return newI;
  },
};

// ---- Tasks ----
let _tasks = [...MOCK_TASKS];
export const taskService = {
  async list(): Promise<Task[]> { await delay(); return [..._tasks]; },
  async updateStatus(id: string, status: Task["status"]): Promise<Task> {
    await delay(100);
    _tasks = _tasks.map((t) => (t.id === id ? { ...t, status } : t));
    return _tasks.find((t) => t.id === id)!;
  },
};

// ---- Reports ----
export const reportService = {
  async get() {
    await delay();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return {
      hiringTrend: months.slice(0, 7).map((m, i) => ({
        month: m,
        applied: 60 + Math.floor(Math.random() * 60) + i * 5,
        interviewed: 25 + Math.floor(Math.random() * 30) + i * 3,
        hired: 5 + Math.floor(Math.random() * 8) + i,
      })),
      sourceMix: [
        { name: "LinkedIn", value: 42 },
        { name: "Referrals", value: 26 },
        { name: "Naukri", value: 18 },
        { name: "Career Site", value: 14 },
      ],
      hrProductivity: ["Rohan", "Priya", "Aanya", "Ishan"].map((n) => ({
        name: n,
        calls: 20 + Math.floor(Math.random() * 40),
        interviews: 5 + Math.floor(Math.random() * 20),
        offers: 1 + Math.floor(Math.random() * 6),
      })),
      conversionRate: 18.4,
      selectionRate: 12.6,
    };
  },
};

// ---- Notifications ----
let _notifications = [...MOCK_NOTIFICATIONS];
export const notificationService = {
  async list(): Promise<NotificationItem[]> { await delay(120); return [..._notifications]; },
  async markAllRead(): Promise<void> {
    await delay(80);
    _notifications = _notifications.map((n) => ({ ...n, read: true }));
  },
  async markRead(id: string): Promise<void> {
    await delay(50);
    _notifications = _notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  },
};
