import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import ErrorBoundary from '../shared/ErrorBoundary.jsx';
import LoadingSpinner from '../shared/LoadingSpinner.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';

export function canAccess(user, roles) {
  if (!roles || roles.length === 0) return true;
  if (!user) return false;

  const normalizedRole = user.role?.toLowerCase();
  const allowedRoles = Array.isArray(roles) ? roles.map((role) => role.toLowerCase()) : [roles.toLowerCase()];

  return allowedRoles.includes(normalizedRole);
}

function ProtectedLayout({ allowedRoles = [] }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, loading } = useAuth();

  const closeSidebar = () => setDrawerOpen(false);
  const openSidebar = () => setDrawerOpen(true);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (allowedRoles.length > 0 && !canAccess(user, allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-screen w-full overflow-x-hidden bg-gray-50">
      <div className="relative flex h-full w-full overflow-hidden">
        <Sidebar open={drawerOpen} onClose={closeSidebar} />

        <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300 lg:ml-72">
          <Header onOpenSidebar={openSidebar} />
          <main className="flex-1 overflow-y-auto pt-16 p-6 transition-all duration-300 lg:p-8 lg:pt-16">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
}

export function RoleGuard({ allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (allowedRoles.length > 0 && !canAccess(user, allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default ProtectedLayout;
