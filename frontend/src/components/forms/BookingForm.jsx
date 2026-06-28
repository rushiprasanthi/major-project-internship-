import { useState } from 'react';
import Button from '../shared/Button.jsx';

function BookingForm({ resources = [], onSubmit, onCancel, initial = {} }) {
  const [resourceId, setResourceId] = useState(initial.resource_id || '');
  const [bookingDate, setBookingDate] = useState(initial.booking_date || '');
  const [startTime, setStartTime] = useState(initial.start_time || '');
  const [endTime, setEndTime] = useState(initial.end_time || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!resourceId || !bookingDate || !startTime || !endTime) {
      setError('Please fill in all fields.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ resource_id: Number(resourceId), booking_date: bookingDate, start_time: startTime, end_time: endTime });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit booking');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-border bg-surface p-6 shadow-soft transition duration-200 hover:shadow-card">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-primary">Create booking</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Fill in the request details and submit a new booking for review.</p>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-error-light bg-error-light/80 px-4 py-3 text-sm text-error-dark">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="resource" className="block text-sm font-medium text-primary">Resource</label>
          <select
            id="resource"
            value={resourceId}
            onChange={(e) => setResourceId(e.target.value)}
            className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-sm text-primary outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
          >
            <option value="">Select a resource</option>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.name} ({resource.type})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="booking-date" className="block text-sm font-medium text-primary">Date</label>
          <input
            id="booking-date"
            type="date"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-sm text-primary outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="start-time" className="block text-sm font-medium text-primary">Start time</label>
            <input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-sm text-primary outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="end-time" className="block text-sm font-medium text-primary">End time</label>
            <input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-sm text-primary outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={saving}>
            Book
          </Button>
        </div>
      </form>
    </div>
  );
}

export default BookingForm;
