import { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import StatCard from '../components/shared/StatCard.jsx';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

const COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA'];

function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        const summaryResponse = await api.get('/dashboard/summary', { signal: controller.signal });
        setSummary(summaryResponse?.data?.data ?? null);

        const allowedRoles = ['admin', 'faculty', 'maintenance'];
        const userRole = user?.role?.toLowerCase() || '';

        if (allowedRoles.includes(userRole)) {
          const overviewResponse = await api.get('/reports/overview', { signal: controller.signal });
          setOverview(overviewResponse?.data?.data ?? null);
        } else {
          setOverview({
            bookingsByStatus: [],
            assetsByCondition: [],
            maintenanceByStatus: [],
            resourceUtilization: [],
          });
        }
      } catch (err) {
        if (!api.isCancel?.(err)) {
          console.error('Dashboard load error', err);
        }
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => {
      controller.abort();
    };
  }, [user]);

  const pieData = useMemo(
    () => (overview?.resourceUtilization || []).map((r) => ({ name: r?.resource_name ?? 'Unknown', value: Number(r?.booking_count ?? 0) })),
    [overview]
  );

  const barData = useMemo(
    () => (overview?.assetsByCondition || []).map((a) => ({ condition: a?.condition ?? 'Unknown', count: Number(a?.count ?? 0) })),
    [overview]
  );

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-muted">Operations overview</p>
          <h1 className="text-3xl font-semibold text-primary">Dashboard</h1>
          <p className="max-w-2xl text-sm leading-7 text-muted">
            Track your resources, bookings, assets, and maintenance performance from a single operations hub.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid min-h-[48rem] place-items-center rounded-[2rem] border border-border bg-surface p-10 shadow-soft">
          <LoadingSpinner />
          <p className="mt-4 text-sm text-muted">Fetching dashboard insights…</p>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {summary ? (
              <>
                <StatCard title="Total Resources" value={summary?.totalResources ?? 0} />
                <StatCard title="Active Bookings" value={summary?.activeBookings ?? 0} />
                <StatCard title="Pending Approvals" value={summary?.pendingApprovals ?? 0} />
                <StatCard title="Total Assets" value={summary?.totalAssets ?? 0} />
                <StatCard title="Open Tickets" value={summary?.openTickets ?? 0} />
              </>
            ) : (
              <div className="col-span-full rounded-[2rem] border border-border bg-surface p-6 text-sm text-muted shadow-soft">
                No dashboard summary data is available right now.
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
            <div className="rounded-[2rem] border border-border bg-white p-6 shadow-soft transition duration-200 hover:shadow-card h-full">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-primary">Resource utilization</h2>
                  <p className="mt-1 text-sm text-muted">Usage trends across active facilities and bookings.</p>
                </div>
              </div>

              {pieData.length === 0 ? (
                <div className="min-h-[28rem] grid place-items-center rounded-[1.5rem] bg-background p-8 text-center text-muted shadow-sm">
                  <p>No utilization data available.</p>
                </div>
              ) : (
                <div className="min-h-[28rem] flex items-center justify-center">
                  <div style={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110} label>
                          {pieData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[2rem] border border-border bg-white p-6 shadow-soft transition duration-200 hover:shadow-card h-full">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-primary">Assets by condition</h2>
                  <p className="mt-1 text-sm text-muted">Condition distribution for your managed assets.</p>
                </div>
              </div>

              {barData.length === 0 ? (
                <div className="min-h-[28rem] grid place-items-center rounded-[1.5rem] bg-background p-8 text-center text-muted shadow-sm">
                  <p>No asset condition data available.</p>
                </div>
              ) : (
                <div className="min-h-[28rem] flex items-center justify-center">
                  <div style={{ width: '100%', height: 320 }}>
                    <ResponsiveContainer>
                      <BarChart data={barData} margin={{ top: 8, right: 0, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="condition" tick={{ fill: '#667085', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#667085', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }} />
                        <Legend />
                        <Bar dataKey="count" fill="#60A5FA" radius={[12, 12, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;