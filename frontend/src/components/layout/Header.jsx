import { useAuth } from '../../hooks/useAuth.jsx';
import { LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Header({ onOpenSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur-sm px-6 py-4 shadow-sm shadow-slate-100">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex items-center justify-center rounded-2xl border border-border bg-surface p-2 text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-primary">RMS Dashboard</h2>
            <p className="mt-1 text-sm text-muted">Modern operations, simplified.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-primary">{user?.name}</p>
            <p className="text-xs text-muted capitalize">{user?.role}</p>
          </div>
          <div className="relative group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-semibold text-white shadow-card transition-transform duration-200 group-hover:-translate-y-0.5">
              {initials}
            </div>
            <button
              onClick={handleLogout}
              className="absolute right-0 top-12 hidden min-w-max items-center gap-2 rounded-2xl border border-border bg-white px-3 py-2 text-sm text-primary shadow-soft transition hover:bg-slate-50 group-hover:flex"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
