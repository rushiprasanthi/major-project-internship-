import { useState } from 'react';
import Button from '../shared/Button.jsx';

function AssetForm({ resources = [], onSubmit, onCancel, initial = {} }) {
  const [assetName, setAssetName] = useState(initial.asset_name || '');
  const [category, setCategory] = useState(initial.category || '');
  const [serialNumber, setSerialNumber] = useState(initial.serial_number || '');
  const [condition, setCondition] = useState(initial.condition || 'Available');
  const [assignedResourceId, setAssignedResourceId] = useState(initial.assigned_resource_id || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!assetName || !category || !serialNumber || !condition) {
      setError('Please fill in all required fields.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        asset_name: assetName,
        category,
        serial_number: serialNumber,
        condition,
        assigned_resource_id: assignedResourceId ? Number(assignedResourceId) : null,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save asset');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-border bg-surface p-6 shadow-soft transition duration-200 hover:shadow-card">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-primary">Create asset</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Add a new inventory item and keep track of its availability.</p>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-error-light bg-error-light/80 px-4 py-3 text-sm text-error-dark">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="asset-name" className="block text-sm font-medium text-primary">Asset name</label>
            <input
              id="asset-name"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-sm text-primary outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
              placeholder="Enter asset name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="asset-category" className="block text-sm font-medium text-primary">Category</label>
            <input
              id="asset-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-sm text-primary outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
              placeholder="e.g. Electronics"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="serial-number" className="block text-sm font-medium text-primary">Serial number</label>
            <input
              id="serial-number"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-sm text-primary outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
              placeholder="Enter serial number"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="condition" className="block text-sm font-medium text-primary">Condition</label>
            <select
              id="condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-sm text-primary outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              <option>Available</option>
              <option>Assigned</option>
              <option>Damaged</option>
              <option>Under Repair</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="assigned-resource" className="block text-sm font-medium text-primary">Assigned resource</label>
          <select
            id="assigned-resource"
            value={assignedResourceId}
            onChange={(e) => setAssignedResourceId(e.target.value)}
            className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-sm text-primary outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
          >
            <option value="">None</option>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name} ({resource.type})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={saving}>
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AssetForm;
