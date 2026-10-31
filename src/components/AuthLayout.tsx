import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';
import { ThemeToggle } from './ThemeToggle';

interface AuthLayoutProps {
  headline: string;
  bullets: string[];
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ headline, bullets, children }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text-primary)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'background-color var(--transition-normal), color var(--transition-normal)',
      }}
    >
      {/* Top Navbar */}
      <div
        className="container"
        style={{
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          to="/"
          style={{
            textDecoration: 'none',
          }}
          aria-label="SignBridge AI Homepage"
        >
          <BrandLogo size="md" theme="auto" />
        </Link>

        <ThemeToggle />
      </div>

      {/* Main Content Area */}
      <div
        className="container auth-grid"
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.95fr)',
          gap: '4rem',
          alignItems: 'center',
          paddingTop: '2rem',
          paddingBottom: '4rem',
        }}
      >
        {/* Left Column: Brand Statement & Privacy Guarantees */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '16px',
              background: 'radial-gradient(circle at 50% 30%, #172B4D 0%, #061528 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(212, 175, 55, 0.35)',
              overflow: 'hidden',
            }}
          >
            <img
              src="/logo-icon.png"
              alt="SignBridge AI Emblem"
              style={{
                width: '44px',
                height: '44px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 6px rgba(212, 175, 55, 0.3))',
              }}
            />
          </div>

          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3.2vw, 2.4rem)',
              color: 'var(--color-navy)',
              fontWeight: 800,
              lineHeight: 1.3,
              letterSpacing: '-0.02em',
            }}
          >
            {headline}
          </h2>

          <ul
            style={{
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {bullets.map((bullet, idx) => (
              <li
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  fontSize: '1rem',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-teal)',
                    flexShrink: 0,
                  }}
                />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column: Form Container */}
        <div>{children}</div>
      </div>

      {/* Footnote matching reference */}
      <div
        className="container"
        style={{
          paddingBottom: '2rem',
          fontSize: '0.8rem',
          color: 'var(--color-text-muted)',
        }}
      >
        Demonstration-grade recognition · isolated gestures · not a certified interpretation product
      </div>

      <style>{`
        @media (max-width: 860px) {
          .auth-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};
