import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CameraStudio } from '../components/CameraStudio';
import { Footer } from '../components/Footer';
import { BrandLogo } from '../components/BrandLogo';
import { ThemeToggle } from '../components/ThemeToggle';

export const StudioPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      {/* Studio Top Navigation Bar matching reference */}
      <header
        style={{
          height: '72px',
          backgroundColor: 'var(--color-surface-white)',
          borderBottom: '1px solid var(--color-border-light)',
          display: 'flex',
          alignItems: 'center',
          transition: 'all var(--transition-normal)',
          width: '100%',
        }}
      >
        <div
          className="container-fluid"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '1680px',
            width: '100%',
          }}
        >
          {/* Logo + Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
              }}
              aria-label="SignBridge AI Homepage"
            >
              <BrandLogo size="sm" theme="auto" />
            </Link>

            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>/</span>

            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.92rem', fontWeight: 500 }}>
              Recognition Studio
            </span>
          </div>

          {/* Right Actions: ThemeToggle + Back to Home */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ThemeToggle />

            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--color-navy)',
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-teal)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-navy)')}
            >
              <ArrowLeft size={16} /> Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Studio Container */}
      <main style={{ flex: 1, paddingTop: '2rem', paddingBottom: '3.5rem', width: '100%' }}>
        <div className="container-fluid" style={{ maxWidth: '1680px', width: '100%' }}>
          <CameraStudio />
        </div>
      </main>

      <Footer />
    </div>
  );
};
