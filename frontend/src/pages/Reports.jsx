import { useEffect, useState } from 'react';
import api from '../services/api.js';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';
import { AlertTriangle } from 'lucide-react';

// Reusable Report Card component for consistent styling
const ReportCard = ({ title, headers, data, labelKey, valueKey }) => {
  const renderRows = () => {
    if (!Array.isArray(data) || data.length === 0) {
      return (
        <tr>
          <td colSpan={headers.length} className="px-6 py-10 text-center text-sm text-slate-500">
            No data available.
          </td>
        </tr>
      );
    }

    return data.map((item, idx) => (
      <tr key={idx} className="border-b border-slate-100 last:border-b-0 even:bg-slate-50/50">
        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
          {item[labelKey] ?? '-'}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
          {item[valueKey] ?? 0}
        </td>
      </tr>
    ));
  };

  return (
    <section className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="border-b border-slate-200 p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      </div>
      <div className="flex-grow overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {headers.map((header) => (
                <th key={header} scope="col" className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{renderRows()}</tbody>
        </table>
      </div>
    </section>
  );
};


function Reports() {
  const [overview, setOverview] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadOverview = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/reports/overview');
        setOverview(response.data?.data || {});
      } catch (err) {
        console.error('Failed to load reports', err);
        setError(err.response?.data?.message || 'An unexpected error occurred while loading reports.');
      } finally {
        setLoading(false);
      }
    };
    loadOverview();
  }, []);

  const reportData = [
    {
      title: 'Bookings by Status',
      headers: ['Status', 'Count'],
      data: overview.bookingsByStatus,
      labelKey: 'status',
      valueKey: 'count',
    },
    {
      title: 'Assets by Condition',
      headers: ['Condition', 'Count'],
      data: overview.assetsByCondition,
      labelKey: 'condition',
      valueKey: 'count',
    },
    {
      title: 'Maintenance by Status',
      headers: ['Status', 'Count'],
      data: overview.maintenanceByStatus,
      labelKey: 'status',
      valueKey: 'count',
    },
    {
      title: 'Resource Utilization',
      headers: ['Resource', 'Total Bookings'],
      data: overview.resourceUtilization,
      labelKey: 'resource_name',
      valueKey: 'booking_count',
    },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Reports</h1>
        <p className="mt-2 text-lg text-slate-600">
          Operational metrics and aggregate insights for the RMS.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-x-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
          <AlertTriangle className="h-6 w-6 text-rose-500" aria-hidden="true" />
          <p className="text-sm font-medium text-rose-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
        {reportData.map((report) => (
          <ReportCard
            key={report.title}
            title={report.title}
            headers={report.headers}
            data={report.data}
            labelKey={report.labelKey}
            valueKey={report.valueKey}
          />
        ))}
      </div>
    </div>
  );
}

export default Reports;
