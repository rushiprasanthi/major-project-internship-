function DataTable({ columns, data, page = 1, totalPages = 1, onPageChange }) {
  return (
    <div className="overflow-x-auto w-full rounded-2xl border border-border bg-surface shadow-soft">
      {data.length === 0 ? (
        <div className="min-w-full px-6 py-12 text-center text-sm text-muted">
          No records found
        </div>
      ) : (
        <>
          <table className="min-w-full">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="px-6 py-3 font-semibold text-left text-sm text-primary">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {data.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className="transition-colors hover:bg-slate-50"
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 text-sm text-zinc-900 whitespace-nowrap">
                      {row[column.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-border bg-zinc-50 px-6 py-3 text-sm text-muted">
            <button
              type="button"
              aria-label="Previous Page"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page === 1}
              className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-primary transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <span aria-live="polite">
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              aria-label="Next Page"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page === totalPages}
              className="rounded-md border border-border bg-white px-4 py-2 text-sm font-medium text-primary transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default DataTable;