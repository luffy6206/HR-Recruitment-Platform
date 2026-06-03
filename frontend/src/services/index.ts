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
export const authService = {
  async login(email: string, password: string) {
    await delay();
    const found = MOCK_USERS.find((u) => u.email === email && u.password === password);
    if (!found) throw new Error("Invalid email or password");
    const { password: _p, ...user } = found;
    return {
      accessToken: "mock-access-" + Math.random().toString(36).slice(2),
      refreshToken: "mock-refresh-" + Math.random().toString(36).slice(2),
      user: user as User,
    };
  },
};

// ---- Dashboard ----
export const dashboardService = {
  async get(): Promise<DashboardStats> { await delay(); return mockStats(); },
};

// ---- Candidates ----
let _candidates = [...MOCK_CANDIDATES];
export const candidateService = {
  async list(): Promise<Candidate[]> { await delay(); return [..._candidates]; },
  async get(id: string): Promise<{
    candidate: Candidate;
    profile: CandidateProfile;
    timeline: TimelineEvent[];
    audits: AuditEntry[];
  }> {
    await delay();
    const candidate = _candidates.find((c) => c.id === id);
    if (!candidate) throw new Error("Candidate not found");
    return { candidate, profile: mockProfile(id), timeline: mockTimeline(id), audits: mockAudits(id) };
  },
  async create(data: Omit<Candidate, "id" | "code" | "status" | "createdAt">): Promise<Candidate> {
    await delay();
    const c: Candidate = {
      ...data,
      id: `c${Date.now()}`,
      code: `CAN-${1000 + _candidates.length + 1}`,
      status: "NEW",
      createdAt: new Date().toISOString(),
    };
    _candidates = [c, ..._candidates];
    return c;
  },
  async update(id: string, patch: Partial<Candidate>): Promise<Candidate> {
    await delay();
    _candidates = _candidates.map((c) => (c.id === id ? { ...c, ...patch } : c));
    return _candidates.find((c) => c.id === id)!;
  },
  async remove(id: string): Promise<void> {
    await delay();
    _candidates = _candidates.filter((c) => c.id !== id);
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
