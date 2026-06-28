import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.jsx';

export default function Header({ onOpenSidebar }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center justify-between border-b border-border bg-white px-6 shadow-sm lg:px-8">
      <div className="flex items-center">
        <button
          onClick={onOpenSidebar}
          className="mr-4 flex h-10 w-10 items-center justify-center rounded-md text-muted transition-colors hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-primary sm:text-2xl">RMS Dashboard</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex sm:items-center sm:gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 shadow-inner">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-semibold tracking-wide text-zinc-700">
            {user?.name || 'User'}
          </span>
        </div>
        
        <button
          onClick={() => logout(false)}
          className="flex items-center gap-2 rounded-md bg-slate-50 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
          aria-label="Logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}