import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import ProtectedLayout, { RoleGuard } from './components/layout/ProtectedLayout.jsx';
import LoadingSpinner from './components/shared/LoadingSpinner.jsx';

const Login = lazy(() => import('./pages/Login.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Resources = lazy(() => import('./pages/Resources.jsx'));
const Bookings = lazy(() => import('./pages/Bookings.jsx'));
const Assets = lazy(() => import('./pages/Assets.jsx'));
const Maintenance = lazy(() => import('./pages/Maintenance.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/*"
          element={
            isAuthenticated ? <ProtectedLayout /> : <Navigate to="/login" replace />
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="resources" element={<Resources />} />

          <Route element={<RoleGuard allowedRoles={['admin', 'faculty', 'student']} />}>
            <Route path="bookings" element={<Bookings />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['admin', 'maintenance']} />}>
            <Route path="assets" element={<Assets />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['admin', 'faculty', 'maintenance']} />}>
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
