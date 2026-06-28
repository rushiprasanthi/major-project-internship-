import { useState } from 'react';
import Button from '../shared/Button.jsx';

function ResourceForm({ onSubmit, onCancel, initial = {} }) {
  const [name, setName] = useState(initial.name || '');
  const [type, setType] = useState(initial.type || 'Classroom');
  const [capacity, setCapacity] = useState(initial.capacity || 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!name || !type || !capacity) {
      setError('All fields are required');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ name, type, capacity: Number(capacity) });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-border bg-surface p-6 shadow-soft transition duration-200 hover:shadow-card">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-primary">Create resource</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Add a new resource to the system and keep availability details up to date.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-error-light bg-error-light/80 px-4 py-3 text-sm text-error-dark">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="resource-name" className="block text-sm font-medium text-primary">
            Name
          </label>
          <input
            id="resource-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-sm text-primary outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
            placeholder="Enter resource name"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="resource-type" className="block text-sm font-medium text-primary">
            Type
          </label>
          <select
            id="resource-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-sm text-primary outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
          >
            <option>Classroom</option>
            <option>Laboratory</option>
            <option>Seminar Hall</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="resource-capacity" className="block text-sm font-medium text-primary">
            Capacity
          </label>
          <input
            id="resource-capacity"
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-sm text-primary outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
            placeholder="1"
          />
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

export default ResourceForm;
