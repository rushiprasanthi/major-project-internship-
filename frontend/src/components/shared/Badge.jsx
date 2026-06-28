function Badge({ status, variant = 'default', children }) {
  const statusStyles = (statusValue) => {
    switch ((statusValue || '').toLowerCase()) {
      case 'approved':
      case 'active':
        return 'bg-success-light text-success-dark';
      case 'pending':
      case 'maintenance':
        return 'bg-warning-light text-warning-dark';
      case 'rejected':
      case 'broken':
        return 'bg-error-light text-error-dark';
      default:
        return 'bg-slate-50 text-slate-700';
    }
  };

  const variantStyles = {
    success: 'bg-success-light text-success-dark',
    warning: 'bg-warning-light text-warning-dark',
    danger: 'bg-error-light text-error-dark',
    info: 'bg-info-light text-info-dark',
    default: 'bg-slate-50 text-slate-700',
  };

  const badgeStyles = status ? statusStyles(status) : variantStyles[variant] || variantStyles.default;

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${badgeStyles}`}>
      {children}
    </span>
  );
}

export default Badge;
