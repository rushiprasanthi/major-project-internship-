import { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';
import DataTable from '../components/shared/DataTable.jsx';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';

function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/assets?limit=1000');
      setAssets(response.data?.data || []);
    } catch (err) {
      console.error('Failed to load assets', err);
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const summaryCards = useMemo(
    () => [
      { label: 'Total assets', value: assets.length },
      { label: 'Assigned assets', value: assets.filter((asset) => asset.assigned_resource_id).length },
      { label: 'Needs repair', value: assets.filter((asset) => asset.condition === 'Damaged' || asset.condition === 'Under Repair').length },
    ],
    [assets]
  );

  const columns = [
    { key: 'asset_name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'serial_number', label: 'Serial Number' },
    { key: 'condition', label: 'Condition' },
    { key: 'assigned_resource_id', label: 'Assigned Resource' },
    { key: 'created_at', label: 'Created' },
  ];

  const tableData = assets.map((asset) => ({
    ...asset,
    assigned_resource_id: asset.assigned_resource_id ? `#${asset.assigned_resource_id}` : 'None',
    created_at: new Date(asset.created_at).toLocaleString(),
  }));

  return (
    <div className="p-6">
      <div className="mb-8 space-y-4 xl:flex xl:items-end xl:justify-between xl:space-y-0">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.32em] text-muted">Asset inventory</p>
          <h1 className="mt-3 text-3xl font-semibold text-primary">Assets</h1>
          <p className="mt-2 text-sm leading-7 text-muted">Manage inventory, conditions, and assignments through a clean asset overview.</p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-[1.75rem] border border-border bg-white p-5 shadow-soft transition duration-200 hover:shadow-card">
            <p className="text-sm font-medium text-muted">{card.label}</p>
            <p className="mt-4 text-3xl font-semibold text-primary">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-soft transition duration-300 hover:shadow-card">
        <div className="border-b border-border bg-white px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary">Asset inventory</h2>
              <p className="mt-1 text-sm text-muted">A clean view of asset details and status.</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="min-h-[20rem] grid place-items-center px-6 py-10 text-center text-muted">
            <LoadingSpinner />
            <p className="mt-4 text-sm">Loading assets…</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="min-h-[20rem] grid place-items-center gap-4 px-6 py-10 text-center text-muted">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background text-primary shadow-soft">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-primary">No assets available</p>
            <p className="max-w-md text-sm leading-6 text-muted">Assets will appear here once they are added to the system.</p>
          </div>
        ) : (
          <div className="p-6">
            <DataTable columns={columns} data={tableData} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Assets;
