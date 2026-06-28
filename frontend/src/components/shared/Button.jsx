function Button({
  variant = 'primary',
  isLoading = false,
  icon: Icon,
  children,
  className = '',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 disabled:pointer-events-none';

  const variantStyles = {
    primary: 'bg-primary text-white shadow-card hover:bg-zinc-800 active:bg-zinc-900',
    secondary: 'bg-slate-100 text-zinc-950 border border-slate-200 hover:bg-slate-200 active:bg-slate-300',
    ghost: 'bg-transparent text-zinc-950 hover:bg-slate-100 active:bg-slate-200',
    danger: 'bg-rose-600 text-white shadow-card hover:bg-rose-700 active:bg-rose-800',
  };

  return (
    <button
      type="button"
      className={`${baseStyles} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      disabled={isLoading || props.disabled}
      aria-busy={isLoading ? 'true' : undefined}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" aria-hidden="true" />
          <span>Loading</span>
        </span>
      ) : (
        <>
          {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
          {children}
        </>
      )}
    </button>
  );
}

export default Button;
