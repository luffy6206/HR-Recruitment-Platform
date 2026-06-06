import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "@/layouts/AppShell";
import { PublicRoute } from "@/routes/PublicRoute";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

import Activity from "@/pages/Activity";
import CandidateDetail from "@/pages/CandidateDetail";
import Candidates from "@/pages/Candidates";
import Dashboard from "@/pages/Dashboard";
import Interviews from "@/pages/Interviews";
import Login from "@/pages/Login";
import Notifications from "@/pages/Notifications";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Tasks from "@/pages/Tasks";

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <AppShell>
              <Outlet />
            </AppShell>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/candidates" element={<Candidates />} />
          <Route path="/candidates/:id" element={<CandidateDetail />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />

          <Route element={<ProtectedRoute role="ADMIN" />}>
            <Route path="/reports" element={<Reports />} />
            <Route path="/activity" element={<Activity />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
