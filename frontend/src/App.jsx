// App.jsx — SecureWatch AI · F4: Routing + RBAC
// NOTE: BrowserRouter is provided by index.jsx — do NOT add another one here.
// NOTE: AuthProvider wraps the whole app so useAuth() works in every route guard.

import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoadingScreen from './components/ui/LoadingScreen';

const Login        = lazy(() => import('./components/pages/Login'));
const Signup       = lazy(() => import('./components/pages/Signup'));
const Dashboard    = lazy(() => import('./components/pages/Dashboard'));
const LiveLogs     = lazy(() => import('./components/pages/LiveLogs'));
const Alerts       = lazy(() => import('./components/pages/Alerts'));
const GeoMap       = lazy(() => import('./components/pages/GeoMap'));
const MLEngine     = lazy(() => import('./components/pages/MLEngine'));
const Anomalies    = lazy(() => import('./components/pages/Anomalies'));
const Trends       = lazy(() => import('./components/pages/Trends'));
const Rules        = lazy(() => import('./components/pages/Rules'));
const Settings     = lazy(() => import('./components/pages/Settings'));
const Admin        = lazy(() => import('./components/pages/Admin'));
const SystemHealth = lazy(() => import('./components/pages/SystemHealth'));

// ── Role permission map ──────────────────────────────────────────────────────
// Mirrors backend role definitions. Kept here for client-side gate decisions.
// NOTE: Server-side checks are authoritative — these gates are UX only.
const ROLE_PERMISSIONS = {
  admin: [
    'view_dashboard', 'view_live_logs', 'manage_alerts', 'create_rules',
    'delete_rules', 'manage_users', 'view_raw_logs', 'export_data',
    'retrain_model', 'access_settings', 'delete_system_data', 'block_ips',
  ],
  analyst: [
    'view_dashboard', 'view_live_logs', 'manage_alerts', 'create_rules',
    'view_raw_logs', 'export_data', 'block_ips',
  ],
  viewer: ['view_dashboard'],
};

// ── Route guards ─────────────────────────────────────────────────────────────

/**
 * PrivateRoute — requires authentication.
 * Optionally gates on role or specific permission.
 * Falls back to / (dashboard) on auth-but-insufficient-permissions.
 */
function PrivateRoute({ children, requiredRole, permission }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" replace />;
  if (permission && !ROLE_PERMISSIONS[user.role]?.includes(permission)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

/**
 * PublicRoute — only accessible when NOT authenticated.
 * Redirects logged-in users to the dashboard.
 */
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

// ── Routes ───────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Public */}
        <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

        {/* Protected — all authenticated users */}
        <Route path="/" element={
          <PrivateRoute>
            <AppLayout><Dashboard /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/geo-map" element={
          <PrivateRoute>
            <AppLayout><GeoMap /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/ml-engine" element={
          <PrivateRoute>
            <AppLayout><MLEngine /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/anomalies" element={
          <PrivateRoute>
            <AppLayout><Anomalies /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/trends" element={
          <PrivateRoute>
            <AppLayout><Trends /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/admin" element={
          <PrivateRoute>
            <AppLayout><Admin /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/system-health" element={
          <PrivateRoute>
            <AppLayout><SystemHealth /></AppLayout>
          </PrivateRoute>
        } />

        {/* Protected — analyst permission required */}
        <Route path="/live-logs" element={
          <PrivateRoute permission="view_live_logs">
            <AppLayout><LiveLogs /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/alerts" element={
          <PrivateRoute permission="manage_alerts">
            <AppLayout><Alerts /></AppLayout>
          </PrivateRoute>
        } />
        <Route path="/rules" element={
          <PrivateRoute permission="create_rules">
            <AppLayout><Rules /></AppLayout>
          </PrivateRoute>
        } />

        {/* Protected — admin only */}
        <Route path="/settings" element={
          <PrivateRoute requiredRole="admin">
            <AppLayout><Settings /></AppLayout>
          </PrivateRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

// ── Root export ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}