import { NavLink } from 'react-router-dom';
import { Home, Grid, CalendarDays, Box, Wrench, BarChart3, X } from 'lucide-react';

function Sidebar({ open = false, onClose = () => {} }) {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Resources', path: '/resources', icon: Grid },
    { label: 'Bookings', path: '/bookings', icon: CalendarDays },
    { label: 'Assets', path: '/assets', icon: Box },
    { label: 'Maintenance', path: '/maintenance', icon: Wrench },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  return (
    <div className={`fixed inset-0 z-40 transition-all duration-300 lg:static lg:translate-x-0 ${open ? 'visible' : 'invisible lg:visible'}`}>
      <div
        className={`absolute inset-0 bg-slate-950/30 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`fixed left-0 top-0 h-full w-[18rem] max-w-full overflow-y-auto bg-white border-r border-border p-5 shadow-card transition-transform duration-300 lg:static lg:h-auto lg:w-72 lg:overflow-visible lg:shadow-none ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="mb-10 flex items-center justify-between gap-4">
          <div className="text-lg font-semibold tracking-tight text-primary">RMS MVP</div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl border border-border bg-surface p-2 text-slate-600 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition duration-200 ${
                    isActive
                      ? 'bg-primary text-white shadow-soft'
                      : 'text-zinc-700 hover:bg-slate-100 hover:text-primary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-5 w-5 flex-none transition-colors duration-200 ${open ? '' : ''} ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-primary'}`} />
                    <span className="font-medium">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}

export default Sidebar;
