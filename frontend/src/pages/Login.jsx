import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import Button from '../components/shared/Button.jsx';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to sign in. Please check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto flex w-full max-w-xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[2rem] border border-border bg-white/95 p-8 shadow-card shadow-slate-200/30 backdrop-blur-sm transition duration-500 ease-out">
          <div className="mb-8 space-y-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">Enterprise Access</p>
            <h1 className="text-4xl font-semibold tracking-tight text-primary">Sign in to RMS</h1>
            <p className="mx-auto max-w-lg text-sm leading-6 text-muted">
              Securely access resources, bookings, assets, and reports from a unified operations dashboard.
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-5 rounded-3xl border border-error-light bg-error-light/80 px-4 py-3 text-sm text-error-dark shadow-soft">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" aria-busy={loading ? 'true' : 'false'}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-primary">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-sm text-primary outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-primary">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-sm text-primary outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="Enter your password"
              />
            </div>

            <Button type="submit" className="w-full" isLoading={loading}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 rounded-3xl border border-border bg-surface p-4 text-sm text-muted shadow-soft">
            <p className="leading-6">
              Need help signing in? Reach out to your administrator or verify your email and password before retrying.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
