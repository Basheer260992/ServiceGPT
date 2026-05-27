import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import IncidentsPage from '@/pages/Incidents';
import ProblemsPage from '@/pages/Problems';
import ChangesPage from '@/pages/Changes';
import CatalogPage from '@/pages/Catalog';
import KnowledgePage from '@/pages/Knowledge';
import AdminPage from '@/pages/Admin';
import ProfilePage from '@/pages/Profile';
import AnalyticsPage from '@/pages/Analytics';
import NotFoundPage from '@/pages/NotFound';
import { TicketDetailPage } from '@/pages/TicketDetail';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import type { Role } from '@/types';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function RoleRoute({ allow, children }: { allow: Role[]; children: JSX.Element }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateUI = useUIStore((s) => s.hydrate);

  useEffect(() => {
    hydrateAuth();
    hydrateUI();
  }, [hydrateAuth, hydrateUI]);

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/incidents/:id" element={<TicketDetailPage kind="incidents" basePath="/incidents" />} />
        <Route path="/problems" element={<ProblemsPage />} />
        <Route path="/problems/:id" element={<TicketDetailPage kind="problems" basePath="/problems" />} />
        <Route path="/changes" element={<ChangesPage />} />
        <Route path="/changes/:id" element={<TicketDetailPage kind="changes" basePath="/changes" />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route
          path="/analytics"
          element={<RoleRoute allow={['admin', 'support']}><AnalyticsPage /></RoleRoute>}
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/admin"
          element={<RoleRoute allow={['admin']}><AdminPage /></RoleRoute>}
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
