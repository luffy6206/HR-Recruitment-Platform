import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/layouts/AppShell";

// Pages
import Dashboard from "@/pages/Dashboard";
import Candidates from "@/pages/Candidates";
import CandidateDetail from "@/pages/CandidateDetail";
import Interviews from "@/pages/Interviews";
import Tasks from "@/pages/Tasks";
import Reports from "@/pages/Reports";
import Notifications from "@/pages/Notifications";
import Activity from "@/pages/Activity";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";

const queryClient = new QueryClient();

function RequireRole({ role }: { role?: string }) {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) return null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Main App Layout */}
            <Route element={<RequireRole />}>
              <Route element={
                <AppShell>
                  <Outlet />
                </AppShell>
              }>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/candidates" element={<Candidates />} />
                <Route path="/candidates/:id" element={<CandidateDetail />} />
                <Route path="/interviews" element={<Interviews />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
                
                {/* Admin only routes */}
                <Route element={<RequireRole role="ADMIN" />}>
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/activity" element={<Activity />} />
                </Route>
              </Route>
            </Route>
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
