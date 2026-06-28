import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import api from '../services/api.js';
import DataTable from '../components/shared/DataTable.jsx';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';
import MaintenanceForm from '../components/forms/MaintenanceForm.jsx';

function Maintenance() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [savingStatusId, setSavingStatusId] = useState(null);
  const [ticketError, setTicketError] = useState(null);
  const [assetError, setAssetError] = useState(null);

  const canUpdateStatus = ['admin', 'maintenance'].includes(user?.role?.toLowerCase());

  const loadTickets = async () => {
    setLoading(true);
    setTicketError(null);
    try {
      const response = await api.get('/maintenance?limit=1000');
      setTickets(response.data?.data || []);
    } catch (err) {
      console.error('Failed to load maintenance tickets', err);
      setTicketError(err.response?.data?.message || 'Unable to load maintenance tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async () => {
    setLoadingAssets(true);
    setAssetError(null);
    try {
      const response = await api.get('/assets');
      setAssets(response.data?.data?.assets || []);
    } catch (err) {
      console.error('Failed to load assets', err);
      setAssetError(err.response?.data?.message || 'Unable to load assets');
    } finally {
      setLoadingAssets(false);
    }
  };

  useEffect(() => {
    loadTickets();
    loadAssets();
  }, []);

  const assetLabel = (assetId) => {
    const asset = assets.find((item) => item.id === assetId);
    return asset ? `${asset.asset_name} (${asset.serial_number})` : `Asset #${assetId}`;
  };

  const handleSubmit = async (payload) => {
    try {
      await api.post('/maintenance', payload);
      setModalOpen(false);
      loadTickets();
    } catch (err) {
      setTicketError(err.response?.data?.message || 'Unable to submit maintenance request');
      throw err;
    }
  };

  const handleStatusChange = async (id, status) => {
    if (!canUpdateStatus) return;
    setSavingStatusId(id);
    setTicketError(null);
    try {
      await api.put(`/maintenance/${id}/status`, { status });
      loadTickets();
    } catch (err) {
      console.error('Failed to update ticket status', err);
      setTicketError(err.response?.data?.message || 'Unable to update status');
    } finally {
      setSavingStatusId(null);
    }
  };

  const summaryCards = useMemo(
    () => [
      { label: 'Total tickets', value: tickets.length },
      { label: 'Open tickets', value: tickets.filter((item) => item.status === 'Open').length },
      { label: 'In progress', value: tickets.filter((item) => item.status === 'In Progress').length },
    ],
    [tickets]
  );

  const columns = [
    { key: 'asset_label', label: 'Asset' },
    { key: 'issue', label: 'Issue' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created' },
    { key: 'actions', label: 'Actions' },
  ];

  const tableData = tickets.map((ticket) => ({
    ...ticket,
    asset_label: assetLabel(ticket.asset_id),
    created_at: new Date(ticket.created_at).toLocaleString(),
    actions: canUpdateStatus ? (
      <select
        value={ticket.status}
        onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
        disabled={savingStatusId === ticket.id}
        className="rounded-2xl border border-border bg-background px-3 py-2 text-sm text-primary outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
      >
        <option value="Open">Open</option>
        <option value="In Progress">In Progress</option>
        <option value="Resolved">Resolved</option>
      </select>
    ) : (
      <span className="text-sm text-muted">No actions</span>
    ),
  }));

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.32em] text-muted">Maintenance management</p>
          <h1 className="mt-3 text-3xl font-semibold text-primary">Maintenance</h1>
          <p className="mt-2 text-sm leading-7 text-muted">Track tickets, issues, and asset repair status with a unified management interface.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-card transition duration-200 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          disabled={loadingAssets}
        >
          New Ticket
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-[1.75rem] border border-border bg-white p-5 shadow-soft transition duration-200 hover:shadow-card">
            <p className="text-sm font-medium text-muted">{card.label}</p>
            <p className="mt-4 text-3xl font-semibold text-primary">{card.value}</p>
          </div>
        ))}
      </div>

      {ticketError && (
        <div className="mb-6 rounded-[2rem] border border-error-light bg-error-light/80 p-5 text-sm text-error-dark shadow-soft">
          {ticketError}
        </div>
      )}
      {assetError && (
        <div className="mb-6 rounded-[2rem] border border-error-light bg-error-light/80 p-5 text-sm text-error-dark shadow-soft">
          {assetError}
        </div>
      )}

      <div className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-soft transition duration-300 hover:shadow-card">
        <div className="border-b border-border bg-white px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary">Maintenance tickets</h2>
              <p className="mt-1 text-sm text-muted">Quickly view and update ticket status.</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="min-h-[20rem] grid place-items-center px-6 py-10 text-center text-muted">
            <LoadingSpinner />
            <p className="mt-4 text-sm">Loading maintenance tickets…</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="min-h-[20rem] grid place-items-center gap-4 px-6 py-10 text-center text-muted">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background text-primary shadow-soft">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7 12a5 5 0 1110 0 5 5 0 01-10 0z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-primary">No maintenance tickets</p>
            <p className="max-w-md text-sm leading-6 text-muted">Create a new ticket to request maintenance on an asset.</p>
          </div>
        ) : (
          <div className="p-6">
            <DataTable columns={columns} data={tableData} />
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl transition duration-200">
            <MaintenanceForm assets={assets} onSubmit={handleSubmit} onCancel={() => setModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default Maintenance;
