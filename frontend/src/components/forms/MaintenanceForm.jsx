import { useState } from 'react';
import Button from '../shared/Button.jsx';

function MaintenanceForm({ assets = [], onSubmit, onCancel }) {
  const [assetId, setAssetId] = useState('');
  const [issue, setIssue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!assetId || !issue.trim()) {
      setError('Please select an asset and describe the issue.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ asset_id: Number(assetId), issue: issue.trim() });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-border bg-surface p-6 shadow-soft transition duration-200 hover:shadow-card">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-primary">New maintenance ticket</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Submit a maintenance request to track repairs and maintenance work.</p>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-error-light bg-error-light/80 px-4 py-3 text-sm text-error-dark">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="asset-select" className="block text-sm font-medium text-primary">Asset</label>
          <select
            id="asset-select"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-sm text-primary outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
          >
            <option value="">Select an asset</option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.asset_name} ({asset.serial_number})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="issue-textarea" className="block text-sm font-medium text-primary">Issue description</label>
          <textarea
            id="issue-textarea"
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            rows={5}
            className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
            placeholder="Describe the maintenance issue in detail..."
          />
        </div>

        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={saving}>
            Submit Ticket
          </Button>
        </div>
      </form>
    </div>
  );
}

export default MaintenanceForm;
