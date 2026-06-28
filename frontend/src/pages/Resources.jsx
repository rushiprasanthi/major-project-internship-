import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import api from '../services/api.js';
import DataTable from '../components/shared/DataTable.jsx';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';
import ResourceForm from '../components/forms/ResourceForm.jsx';

function Resources() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/resources?page=${page}&limit=10`);
      setResources(res.data.data || []);
      const total = res.data.meta?.total;
      if (typeof total === 'number') {
        setTotalPages(Math.max(1, Math.ceil(total / 10)));
      } else {
        setTotalPages(page);
      }
    } catch (err) {
      console.error('Failed to load resources', err);
      setError('Unable to load resources. Please refresh the page or try again later.');
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const handleCreate = async (payload) => {
    try {
      await api.post('/resources', payload);
      setModalOpen(false);
      load();
    } catch (err) {
      console.error('Create resource failed', err);
      throw err;
    }
  };

  const handleDelete = (id) => {
    setSelectedResourceId(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedResourceId) return;

    try {
      await api.delete(`/resources/${selectedResourceId}`);
      setDeleteModalOpen(false);
      setSelectedResourceId(null);
      load();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setSelectedResourceId(null);
  };

  useEffect(() => {
    if (!deleteModalOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        cancelDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteModalOpen]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/resources/${id}`, { status });
      load();
    } catch (err) {
      console.error('Status update failed', err);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created' },
    { key: 'actions', label: 'Actions' },
  ];

  const tableData = resources.map((r) => ({
    ...r,
    created_at: new Date(r.created_at).toLocaleString(),
    actions: (
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={r.status}
          onChange={(e) => handleStatusUpdate(r.id, e.target.value)}
          className="rounded-2xl border border-border bg-background px-3 py-2 text-sm text-primary outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
        >
          <option>Available</option>
          <option>Occupied</option>
          <option>Maintenance</option>
        </select>
        <button
          onClick={() => handleDelete(r.id)}
          className="rounded-2xl bg-error px-3.5 py-2 text-sm font-semibold text-white transition duration-200 hover:bg-error-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-error focus-visible:ring-offset-surface"
        >
          Archive
        </button>
      </div>
    ),
  }));

  return (
    <div className="p-6">
      <div className="mb-6 space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.32em] text-muted">Resource Management</p>
            <h1 className="text-3xl font-semibold text-primary">Resources</h1>
            <p className="max-w-2xl text-sm leading-7 text-muted">
              View and manage your site resources with clear status, capacity, and fast controls for updates or deletions.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-card transition duration-200 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            Create Resource
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-soft transition duration-200 hover:shadow-card">
            <p className="text-sm font-medium text-muted">Total resources</p>
            <p className="mt-3 text-3xl font-semibold text-primary">{resources.length}</p>
          </div>
          <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-soft transition duration-200 hover:shadow-card">
            <p className="text-sm font-medium text-muted">Loading status</p>
            <p className="mt-3 text-3xl font-semibold text-primary">{loading ? 'Refreshing…' : 'Ready'}</p>
          </div>
          <div className="rounded-[1.75rem] border border-border bg-white p-5 shadow-soft transition duration-200 hover:shadow-card">
            <p className="text-sm font-medium text-muted">Last updated</p>
            <p className="mt-3 text-3xl font-semibold text-primary">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-[2rem] border border-error-light bg-error-light/80 p-5 text-sm text-error-dark shadow-soft">
          <p className="font-semibold">Unable to load resources</p>
          <p className="mt-1 text-sm leading-6">{error}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-[2rem] border border-border bg-surface p-6 shadow-soft transition duration-300 hover:shadow-card">
        {loading ? (
          <div className="min-h-[18rem] grid place-items-center gap-4 text-center text-muted">
            <LoadingSpinner />
            <p className="text-sm">Loading resources…</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="min-h-[18rem] grid place-items-center gap-4 rounded-[1.75rem] border border-dashed border-border bg-white p-10 text-center text-slate-500">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background text-primary shadow-soft">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              </svg>
            </div>
            <div className="max-w-md space-y-2">
              <p className="text-lg font-semibold text-primary">No resources found</p>
              <p className="text-sm leading-6 text-muted">Create a new resource to get started managing capacity, usage, and availability.</p>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={tableData}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl transition duration-200">
            <ResourceForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} />
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm" aria-modal="true" role="dialog">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl transition duration-200">
            <h2 className="text-xl font-semibold text-primary">Confirm archive</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Are you sure you want to archive this resource? This will mark it as maintenance and remove it from active availability.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelDelete}
                className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-primary transition duration-200 hover:bg-background"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-2xl bg-error px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-error-dark"
              >
                Confirm archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Resources;
