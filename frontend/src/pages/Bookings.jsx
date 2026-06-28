import { useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import Badge from '../components/shared/Badge.jsx';
import Button from '../components/shared/Button.jsx';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';

const statusVariants = {
  Approved: 'success',
  Pending: 'warning',
  Rejected: 'danger',
  Cancelled: 'danger',
};

function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/bookings?page=${page}&limit=10`);
      setBookings(response.data.data || []);
      const total = response.data.meta?.total;
      if (typeof total === 'number') {
        setTotalPages(Math.max(1, Math.ceil(total / 10)));
      } else {
        setTotalPages(page);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user, page]);

  const handleBookingAction = async (bookingId, action) => {
    setActionLoading(bookingId);
    setError(null);

    try {
      const endpoint = action === 'approve'
        ? `/bookings/${bookingId}/approve`
        : action === 'reject'
          ? `/bookings/${bookingId}/reject`
          : `/bookings/${bookingId}/cancel`;

      await api.put(endpoint);
      await loadBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const summaryCards = useMemo(
    () => [
      { label: 'Total bookings', value: bookings.length },
      { label: 'Pending approvals', value: bookings.filter((item) => item.status === 'Pending').length },
      { label: 'Active bookings', value: bookings.filter((item) => item.status === 'Approved').length },
    ],
    [bookings]
  );

  return (
    <div className="p-6">
      <div className="mb-6 space-y-4 xl:flex xl:items-end xl:justify-between xl:space-y-0">
        <div className="max-w-3xl">
          <p className="text-sm uppercase tracking-[0.32em] text-muted">Booking management</p>
          <h1 className="mt-3 text-3xl font-semibold text-primary">Bookings</h1>
          <p className="mt-2 text-sm leading-7 text-muted">
            Manage reservations, review booking status, and take action on requests from this central view.
          </p>
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
              <h2 className="text-lg font-semibold text-primary">Booking records</h2>
              <p className="mt-1 text-sm text-muted">Quickly scan bookings and take action where required.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="px-6 py-4 text-sm text-error-dark bg-error-light border-t border-error-light">
            {error}
          </div>
        )}

        {loading ? (
          <div className="min-h-[20rem] grid place-items-center px-6 py-10 text-center text-muted">
            <LoadingSpinner />
            <p className="mt-4 text-sm">Loading bookings…</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="min-h-[20rem] grid place-items-center gap-4 px-6 py-10 text-center text-muted">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background text-primary shadow-soft">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-primary">No bookings found</p>
            <p className="max-w-md text-sm leading-6 text-muted">Once bookings are created, they will appear here with status and action controls.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border bg-white">
              <thead className="bg-background text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-6 py-4">Resource</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Booked By</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map((booking) => {
                  const status = booking.status || 'Pending';
                  const showApproveReject = user?.role === 'admin' && status === 'Pending';
                  const showCancel = status !== 'Cancelled' && status !== 'Rejected';

                  return (
                    <tr key={booking.id} className="transition-colors duration-200 hover:bg-background">
                      <td className="px-6 py-4 text-sm text-primary">Resource #{booking.resource_id ?? '—'}</td>
                      <td className="px-6 py-4 text-sm text-primary">{booking.booking_date ?? '—'}</td>
                      <td className="px-6 py-4 text-sm text-primary">{`${booking.start_time || '—'} - ${booking.end_time || '—'}`}</td>
                      <td className="px-6 py-4 text-sm text-primary">User #{booking.user_id ?? '—'}</td>
                      <td className="px-6 py-4 text-sm">
                        <Badge variant={statusVariants[status] || 'default'}>{status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-primary">
                        <div className="flex flex-wrap gap-2">
                          {showApproveReject && (
                            <Button
                              variant="primary"
                              isLoading={actionLoading === booking.id}
                              onClick={() => handleBookingAction(booking.id, 'approve')}
                            >
                              Approve
                            </Button>
                          )}
                          {showApproveReject && (
                            <Button
                              variant="danger"
                              isLoading={actionLoading === booking.id}
                              onClick={() => handleBookingAction(booking.id, 'reject')}
                            >
                              Reject
                            </Button>
                          )}
                          {showCancel && (
                            <Button
                              variant="secondary"
                              isLoading={actionLoading === booking.id}
                              onClick={() => handleBookingAction(booking.id, 'cancel')}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Bookings;
