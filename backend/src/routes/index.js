import express from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import candidateRoutes from "../modules/candidates/candidate.routes.js";
import callRoutes from "../modules/calls/call.routes.js";
import dashboardRoutes from "../modules/dashboard/dashboard.routes.js";
import interviewRoutes from "../modules/interviews/interview.routes.js";
import taskRoutes from "../modules/tasks/task.routes.js";
import candidateDetailsRoutes from "../modules/candidates/candidateDetails.routes.js";
import notificationRoutes from "../modules/notifications/notification.routes.js";
import resumeRoutes from "../modules/resumes/resume.routes.js";
import searchRoutes from "../modules/search/search.routes.js";
import reportRoutes from "../modules/reports/report.routes.js";
import userRoutes from "../modules/users/user.routes.js";
import candidateWorkflowRoutes from "../modules/candidates/candidateWorkflow.routes.js";
import settingsRoutes from "../modules/settings/settings.routes.js";
import activityRoutes from "../modules/activity/activity.routes.js";
import healthRoutes from "../modules/health/health.routes.js";
import dailyReportRoutes from "../modules/dailyReports/dailyReport.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use(
  "/candidates",
  candidateRoutes
);
router.use(
  "/calls",
  callRoutes
);
router.use(
  "/dashboard",
  dashboardRoutes
);
router.use(
  "/interviews",
  interviewRoutes
);
router.use(
  "/tasks",
  taskRoutes
);
router.use(
  "/candidates",
  candidateDetailsRoutes
);
router.use(
  "/notifications",
  notificationRoutes
);
router.use(
  "/resumes",
  resumeRoutes
);
router.use(
  "/search",
  searchRoutes
);
router.use(
  "/reports",
  reportRoutes
);
router.use(
  "/users",
  userRoutes
);
router.use(
  "/candidates",
  candidateWorkflowRoutes
);
router.use(
  "/settings",
  settingsRoutes
);

router.use(
  "/activity",
  activityRoutes
);
router.use(
  "/health",
  healthRoutes
);
router.use(
  "/daily-reports",
  dailyReportRoutes
);

export default router;