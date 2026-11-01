import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, User as UserIcon } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();


  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const scrollToSection = (hash: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      window.location.href = `/${hash}`;
      return;
    }
    const elem = document.querySelector(hash);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: scrolled ? 'var(--color-navbar-bg)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--color-border-light)' : '1px solid transparent',
        transition: 'all var(--transition-normal)',
      }}
    >
      <div
        className="container-fluid"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px',
          maxWidth: '1680px',
          width: '100%',
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          style={{
            textDecoration: 'none',
          }}
          aria-label="SignBridge AI Homepage"
        >
          <BrandLogo size="md" theme="auto" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '2rem',
          }}
          className="desktop-nav"
        >
          <button
            onClick={() => scrollToSection('#how-it-works')}
            style={{
              fontSize: '0.95rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              transition: 'color var(--transition-fast)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-navy)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
          >
            How it works
          </button>

          <Link
            to="/library"
            style={{
              fontSize: '0.95rem',
              fontWeight: 500,
              color: location.pathname === '/library' ? 'var(--color-navy)' : 'var(--color-text-secondary)',
              borderBottom: location.pathname === '/library' ? '2px solid var(--color-teal)' : 'none',
              paddingBottom: '2px',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-navy)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = location.pathname === '/library' ? 'var(--color-navy)' : 'var(--color-text-secondary)')}
          >
            Gesture library
          </Link>

          <button
            onClick={() => scrollToSection('#privacy')}
            style={{
              fontSize: '0.95rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              transition: 'color var(--transition-fast)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-navy)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
          >
            Privacy
          </button>

          <button
            onClick={() => scrollToSection('#limitations')}
            style={{
              fontSize: '0.95rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              transition: 'color var(--transition-fast)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-navy)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
          >
            Limitations
          </button>

          <Link
            to="/docs"
            style={{
              fontSize: '0.95rem',
              fontWeight: 500,
              color: location.pathname === '/docs' ? 'var(--color-navy)' : 'var(--color-text-secondary)',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-navy)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = location.pathname === '/docs' ? 'var(--color-navy)' : 'var(--color-text-secondary)')}
          >
            API Docs
          </Link>
        </nav>

        {/* Right CTA Actions */}
        <div
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '1rem',
          }}
          className="desktop-nav"
        >
          {/* Theme Toggle */}
          <ThemeToggle />

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-full, 9999px)',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: 'var(--color-navy)',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-teal)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {(user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </div>
                <span>{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
              </div>

              <button
                onClick={() => signOut()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.55rem 0.9rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-status-error-text, #ef4444)';
                  e.currentTarget.style.borderColor = 'var(--color-status-error-border, #fca5a5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
                title="Sign out"
              >
                <LogOut size={16} />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'var(--color-navy)',
                  transition: 'color var(--transition-fast)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-teal)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-navy)')}
              >
                Sign in
              </Link>

              <Link
                to="/register"
                className="btn-primary"
                style={{
                  padding: '0.6rem 1.35rem',
                  fontSize: '0.9rem',
                }}
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-toggle"
          aria-label="Toggle navigation menu"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-navy)',
          }}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: '72px 0 0 0',
            backgroundColor: 'var(--color-bg)',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
            padding: '2rem 1.5rem',
            gap: '1.5rem',
            boxShadow: 'var(--shadow-xl)',
            overflowY: 'auto',
          }}
        >
          <button
            onClick={() => scrollToSection('#how-it-works')}
            style={{
              textAlign: 'left',
              fontSize: '1.15rem',
              fontWeight: 600,
              color: 'var(--color-navy)',
              padding: '0.5rem 0',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          >
            How it works
          </button>

          <Link
            to="/library"
            style={{
              fontSize: '1.15rem',
              fontWeight: 600,
              color: 'var(--color-navy)',
              padding: '0.5rem 0',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          >
            Gesture library
          </Link>

          <button
            onClick={() => scrollToSection('#privacy')}
            style={{
              textAlign: 'left',
              fontSize: '1.15rem',
              fontWeight: 600,
              color: 'var(--color-navy)',
              padding: '0.5rem 0',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          >
            Privacy
          </button>

          <button
            onClick={() => scrollToSection('#limitations')}
            style={{
              textAlign: 'left',
              fontSize: '1.15rem',
              fontWeight: 600,
              color: 'var(--color-navy)',
              padding: '0.5rem 0',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          >
            Limitations
          </button>

          <Link
            to="/docs"
            style={{
              fontSize: '1.15rem',
              fontWeight: 600,
              color: 'var(--color-navy)',
              padding: '0.5rem 0',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          >
            API Docs
          </Link>

          <Link
            to="/studio"
            className="btn-signature"
            style={{ width: '100%', marginTop: '1rem' }}
          >
            Try Studio (Guest)
          </Link>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              marginTop: '0.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--color-border-light)',
            }}
          >
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div
                  style={{
                    padding: '0.65rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'var(--color-navy)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                  }}
                >
                  <UserIcon size={18} />
                  <span>{user.user_metadata?.full_name || user.email}</span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="btn-secondary"
                  style={{ width: '100%', textAlign: 'center', color: 'var(--color-status-error-text, #ef4444)' }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn-secondary"
                  style={{ width: '100%', textAlign: 'center' }}
                >
                  Sign in
                </Link>

                <Link
                  to="/register"
                  className="btn-primary"
                  style={{ width: '100%', textAlign: 'center' }}
                >
                  Create free account
                </Link>
              </>
            )}

            <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
              <ThemeToggle showLabel={true} style={{ width: '100%', justifyContent: 'center' }} />
            </div>
          </div>
        </div>
      )}

      {/* Responsive media query styling */}
      <style>{`
        @media (min-width: 860px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-toggle {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
