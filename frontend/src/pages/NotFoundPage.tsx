import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const NotFoundPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4rem 1.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '520px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '4.5rem',
              fontWeight: 800,
              color: 'var(--color-navy-tint-2)',
              lineHeight: 1,
              display: 'block',
              marginBottom: '1rem',
            }}
          >
            404
          </span>

          <h1 style={{ fontSize: '1.85rem', color: 'var(--color-navy)', marginBottom: '0.85rem' }}>
            Page not found
          </h1>

          <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
            The page you are looking for does not exist or has been moved. Explore the recognition studio or view our supported gesture vocabulary.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/" className="btn-secondary">
              <Home size={16} /> Home
            </Link>
            <Link to="/studio" className="btn-signature">
              Open Studio
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
