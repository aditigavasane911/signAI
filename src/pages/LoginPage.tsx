import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      localStorage.setItem('signbridge_user', JSON.stringify({ email, name: email.split('@')[0] }));
      setTimeout(() => {
        navigate('/studio');
      }, 1000);
    }, 800);
  };

  return (
    <AuthLayout
      headline="Communication shouldn't depend on hearing. SignBridge turns supported gestures into text — privately, in your browser."
      bullets={[
        'Camera feed never leaves your device',
        'Recognition history is opt-in, off by default',
        'Accessible by keyboard and screen reader',
      ]}
    >
      <div
        className="card-enterprise"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-xl)',
          maxWidth: '460px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <h1
          style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            color: 'var(--color-navy)',
            marginBottom: '0.4rem',
            fontFamily: 'var(--font-display)',
          }}
        >
          Sign in
        </h1>

        <p style={{ fontSize: '0.92rem', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
          Welcome back — your studio is where you left it.
        </p>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--color-status-error-bg)',
              border: '1px solid var(--color-status-error-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-status-error-text)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--color-status-success-bg)',
              border: '1px solid var(--color-status-success-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-status-success-text)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem',
            }}
          >
            <CheckCircle2 size={16} />
            <span>Signed in successfully! Redirecting to studio...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--color-navy)',
                marginBottom: '0.45rem',
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-surface-subtle)',
                border: '1.5px solid var(--color-border-medium)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
                outline: 'none',
                transition: 'border-color var(--transition-fast)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-teal)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-medium)')}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-navy)' }}>
                Password
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('A password reset link will be sent to your email.');
                }}
                style={{ fontSize: '0.82rem', color: 'var(--color-teal)', fontWeight: 600 }}
              >
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-surface-subtle)',
                border: '1.5px solid var(--color-border-medium)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
                outline: 'none',
                transition: 'border-color var(--transition-fast)',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-teal)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border-medium)')}
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '0.8rem',
              marginTop: '0.75rem',
              fontSize: '0.98rem',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
          <span>New to SignBridge? </span>
          <Link to="/register" style={{ color: 'var(--color-teal)', fontWeight: 600 }}>
            Create an account
          </Link>
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Back to home
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};
