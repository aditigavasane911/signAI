import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        backgroundColor: '#082244', /* Dark navy per user palette */
        color: '#A7C7E7',
        borderTop: '1px solid #1A3E6F',
        marginTop: 'auto',
        paddingTop: '4.5rem',
        paddingBottom: '3rem',
      }}
    >
      <div className="container-fluid" style={{ maxWidth: '1680px' }}>
        {/* Main Footer Columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '3rem',
            paddingBottom: '3.5rem',
            borderBottom: '1px solid rgba(167, 199, 231, 0.15)',
          }}
        >
          {/* Brand Info */}
          <div style={{ maxWidth: '340px' }}>
            <Link
              to="/"
              style={{
                display: 'inline-block',
                marginBottom: '1.25rem',
                textDecoration: 'none',
              }}
              aria-label="SignBridge AI Homepage"
            >
              <BrandLogo size="md" theme="dark" />
            </Link>

            <p style={{ fontSize: '0.9rem', color: '#6A9BDD', lineHeight: 1.65 }}>
              A browser-based assistant for recognizing supported isolated hand gestures. Camera processing stays on your device.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(0, 194, 168, 0.15)',
                  color: '#99EBDA',
                  border: '1px solid rgba(0, 194, 168, 0.3)',
                }}
              >
                <Lock size={12} /> Zero Video Uploads
              </span>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h4
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '1.25rem',
              }}
            >
              Product
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <li>
                <Link
                  to="/studio"
                  style={{ color: '#A7C7E7', fontSize: '0.95rem', transition: 'color var(--transition-fast)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#00C2A8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#A7C7E7')}
                >
                  Try recognition
                </Link>
              </li>
              <li>
                <Link
                  to="/library"
                  style={{ color: '#A7C7E7', fontSize: '0.95rem', transition: 'color var(--transition-fast)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#00C2A8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#A7C7E7')}
                >
                  Gesture library
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  style={{ color: '#A7C7E7', fontSize: '0.95rem', transition: 'color var(--transition-fast)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#00C2A8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#A7C7E7')}
                >
                  Create account
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust Column */}
          <div>
            <h4
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '1.25rem',
              }}
            >
              Trust
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <li>
                <a
                  href="/#privacy"
                  style={{ color: '#A7C7E7', fontSize: '0.95rem', transition: 'color var(--transition-fast)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#00C2A8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#A7C7E7')}
                >
                  Privacy approach
                </a>
              </li>
              <li>
                <a
                  href="/#limitations"
                  style={{ color: '#A7C7E7', fontSize: '0.95rem', transition: 'color var(--transition-fast)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#00C2A8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#A7C7E7')}
                >
                  Known limitations
                </a>
              </li>
              <li>
                <Link
                  to="/docs"
                  style={{ color: '#A7C7E7', fontSize: '0.95rem', transition: 'color var(--transition-fast)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#00C2A8')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#A7C7E7')}
                >
                  API docs
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture Summary */}
          <div>
            <h4
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '1.25rem',
              }}
            >
              Architecture
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#6A9BDD', lineHeight: 1.6, marginBottom: '0.8rem' }}>
              MediaPipe WebAssembly executes landmark detection locally. The 63-coordinate floating point vector is evaluated in 12ms.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#B5A8FF', background: 'rgba(123, 97, 255, 0.15)', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                Wasm v0.10
              </span>
              <span style={{ fontSize: '0.75rem', color: '#99EBDA', background: 'rgba(0, 194, 168, 0.15)', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                On-device privacy
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer matching reference verbatim */}
        <div style={{ paddingTop: '2rem' }}>
          <p
            style={{
              fontSize: '0.82rem',
              color: '#6A9BDD',
              lineHeight: 1.6,
              maxWidth: '920px',
              margin: '0 auto',
              textAlign: 'center',
            }}
          >
            SignBridge AI currently recognizes a small set of isolated hand gestures with a demonstration-grade model. It does not translate a specific sign language and is not a certified interpretation or medical device.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid rgba(167, 199, 231, 0.08)',
              fontSize: '0.8rem',
              color: '#5A6675',
              gap: '1rem',
            }}
          >
            <span>© {new Date().getFullYear()} SignBridge AI. All rights reserved.</span>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <a href="/#privacy" style={{ color: '#6A9BDD' }}>Privacy Policy</a>
              <a href="/#limitations" style={{ color: '#6A9BDD' }}>Terms & Limitations</a>
              <Link to="/docs" style={{ color: '#6A9BDD' }}>API Reference</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
