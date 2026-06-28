function StatCard({ title, value, icon: Icon }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-soft transition duration-200 hover:shadow-card">
      {Icon ? (
        <div className="absolute right-4 top-4 text-muted">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      ) : null}
      <div className="text-sm font-medium uppercase tracking-[0.12em] text-muted">{title}</div>
      <div className="mt-4 text-3xl font-semibold text-primary">{value}</div>
    </div>
  );
}

export default StatCard;
