import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Sparkles, CheckCircle2, Search, SlidersHorizontal, BookOpen } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { LandmarkHandSvg } from '../components/LandmarkHandSvg';
import { ALL_GESTURES, SUPPORTED_GESTURES, PHRASE_GESTURES, EVERYDAY_GESTURES, RECOGNITION_GUIDANCE } from '../data/gestures';

export const LibraryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'simplified' | 'phrases' | 'core'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Extract all unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    ALL_GESTURES.forEach((g) => {
      if (g.category) set.add(g.category);
    });
    return ['all', ...Array.from(set)];
  }, []);

  // Filter gestures based on tab, category, and search query
  const filteredGestures = useMemo(() => {
    return ALL_GESTURES.filter((gesture) => {
      // 1. Tab filter
      if (activeTab === 'simplified' && gesture.category !== 'Everyday') return false;
      if (activeTab === 'core' && gesture.category !== 'Core Handshapes') return false;
      if (activeTab === 'phrases' && (gesture.category === 'Core Handshapes' || gesture.category === 'Everyday')) return false;

      // 2. Category filter
      if (selectedCategory !== 'all' && gesture.category !== selectedCategory) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = gesture.name.toLowerCase().includes(q);
        const matchesDesc = gesture.shortDescription.toLowerCase().includes(q);
        const matchesHowTo = gesture.howToSign.toLowerCase().includes(q);
        const matchesTags = gesture.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesCategory = gesture.category?.toLowerCase().includes(q);
        return matchesName || matchesDesc || matchesHowTo || matchesTags || matchesCategory;
      }

      return true;
    });
  }, [activeTab, selectedCategory, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      <main className="section-spacing" style={{ flex: 1, paddingTop: '3rem' }}>
        <div className="container">
          {/* Header */}
          <div style={{ maxWidth: '840px', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.35rem 0.8rem', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-teal-tint-1)', color: 'var(--color-teal-shade)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '1rem' }}>
              <BookOpen size={14} />
              <span>52 Deployed Classes · Phrases & Core Gestures</span>
            </div>
            <h1 style={{ color: 'var(--color-navy)', marginBottom: '0.75rem', fontSize: 'clamp(2.2rem, 4vw, 3rem)' }}>
              Gesture library
            </h1>
            <p style={{ fontSize: '1.08rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              Browse and learn all 52 supported gestures — including 44 conversational phrases trained with MediaPipe AI landmark extraction from Indian Sign Language data, plus 8 core handshape classes.
            </p>
          </div>

          {/* Amber Warning Notice Banner */}
          <div className="notice-warning" style={{ marginBottom: '2.5rem' }}>
            <AlertTriangle size={18} color="var(--color-status-warning)" style={{ flexShrink: 0 }} />
            <span>
              The current model is demonstration-grade trained with on-device MediaPipe landmark extraction. Use the holding guidance below to give recognition the best chance, and expect honest unknowns.
            </span>
          </div>

          {/* Filter Controls Bar */}
          <div
            className="card-enterprise"
            style={{
              padding: '1.25rem 1.5rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-surface-white)',
              marginBottom: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {/* Top row: Tabs + Search input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              {/* Primary Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.35rem',
                  backgroundColor: 'var(--color-surface-subtle)',
                  padding: '0.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-light)',
                }}
              >
                <button
                  onClick={() => { setActiveTab('all'); setSelectedCategory('all'); }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: activeTab === 'all' ? 'var(--color-surface-white)' : 'transparent',
                    color: activeTab === 'all' ? 'var(--color-navy)' : 'var(--color-text-secondary)',
                    fontWeight: activeTab === 'all' ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'all' ? 'var(--shadow-xs)' : 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  All Gestures ({ALL_GESTURES.length})
                </button>
                <button
                  onClick={() => { setActiveTab('simplified'); setSelectedCategory('all'); }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: activeTab === 'simplified' ? 'var(--color-surface-white)' : 'transparent',
                    color: activeTab === 'simplified' ? '#047857' : 'var(--color-text-secondary)',
                    fontWeight: activeTab === 'simplified' ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'simplified' ? 'var(--shadow-xs)' : 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  🌟 Everyday & Face ({EVERYDAY_GESTURES.length})
                </button>
                <button
                  onClick={() => { setActiveTab('phrases'); setSelectedCategory('all'); }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: activeTab === 'phrases' ? 'var(--color-surface-white)' : 'transparent',
                    color: activeTab === 'phrases' ? 'var(--color-teal-shade)' : 'var(--color-text-secondary)',
                    fontWeight: activeTab === 'phrases' ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'phrases' ? 'var(--shadow-xs)' : 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  Conversational Phrases ({PHRASE_GESTURES.length})
                </button>
                <button
                  onClick={() => { setActiveTab('core'); setSelectedCategory('all'); }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: activeTab === 'core' ? 'var(--color-surface-white)' : 'transparent',
                    color: activeTab === 'core' ? 'var(--color-purple-shade)' : 'var(--color-text-secondary)',
                    fontWeight: activeTab === 'core' ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'core' ? 'var(--shadow-xs)' : 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  Core Handshapes ({SUPPORTED_GESTURES.length})
                </button>
              </div>

              {/* Search Box */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  minWidth: '260px',
                  flex: '1 1 280px',
                  maxWidth: '420px',
                }}
              >
                <Search
                  size={17}
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    color: 'var(--color-text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search gestures, phrases, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.85rem 0.55rem 2.4rem',
                    fontSize: '0.88rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-light)',
                    backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-navy)',
                    outline: 'none',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '0.65rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Sub-category pills */}
            {activeTab !== 'core' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap', paddingTop: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, marginRight: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <SlidersHorizontal size={13} /> Categories:
                </span>
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const label = cat === 'all' ? 'All Categories' : cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '0.3rem 0.65rem',
                        borderRadius: 'var(--radius-full)',
                        border: `1px solid ${isSelected ? 'var(--color-teal)' : 'var(--color-border-light)'}`,
                        backgroundColor: isSelected ? 'var(--color-teal-tint-1)' : 'transparent',
                        color: isSelected ? 'var(--color-teal-shade)' : 'var(--color-text-secondary)',
                        fontSize: '0.76rem',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Result Count and Grid */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Showing <strong style={{ color: 'var(--color-navy)' }}>{filteredGestures.length}</strong> of {ALL_GESTURES.length} gestures
            </span>
          </div>

          {/* Gesture Cards Grid */}
          {filteredGestures.length === 0 ? (
            <div
              className="card-enterprise"
              style={{
                padding: '3rem',
                textAlign: 'center',
                backgroundColor: 'var(--color-surface-white)',
                marginBottom: '4.5rem',
              }}
            >
              <p style={{ fontSize: '1.1rem', color: 'var(--color-navy)', fontWeight: 600, marginBottom: '0.5rem' }}>
                No gestures found matching "{searchQuery}"
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
                Try clearing your search filters or selecting "All Gestures".
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setActiveTab('all'); }}
                className="btn-primary"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.75rem',
                marginBottom: '4.5rem',
              }}
            >
              {filteredGestures.map((gesture) => (
                <div
                  key={gesture.id}
                  className="gesture-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    {/* SVG Landmark Blueprint */}
                    <LandmarkHandSvg shape={gesture.svgShape} height={180} />

                    {/* Category & Attributes Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                      {gesture.category && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.55rem',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: gesture.category === 'Core Handshapes' ? 'var(--color-purple-tint-1)' : 'var(--color-teal-tint-1)',
                            color: gesture.category === 'Core Handshapes' ? 'var(--color-purple-shade)' : 'var(--color-teal-shade)',
                            border: `1px solid ${gesture.category === 'Core Handshapes' ? 'rgba(123, 97, 255, 0.2)' : 'rgba(0, 194, 168, 0.2)'}`,
                          }}
                        >
                          {gesture.category}
                        </span>
                      )}
                      {gesture.twoHanded && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-xs)',
                            backgroundColor: 'var(--color-surface-subtle)',
                            color: 'var(--color-text-secondary)',
                            border: '1px solid var(--color-border-light)',
                          }}
                        >
                          Two-handed
                        </span>
                      )}
                    </div>

                    <h3
                      style={{
                        fontSize: '1.25rem',
                        color: 'var(--color-navy)',
                        marginTop: '0.75rem',
                        marginBottom: '0.45rem',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {gesture.name}
                    </h3>

                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                      {gesture.shortDescription}
                    </p>

                    {/* How to sign box */}
                    <div
                      style={{
                        backgroundColor: 'var(--color-surface-subtle)',
                        border: '1px solid var(--color-border-light)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.85rem 1rem',
                        fontSize: '0.82rem',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.55,
                      }}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--color-teal)' }}>How to sign: </span>
                      {gesture.howToSign.replace(/^How to sign:\s*/i, '')}
                    </div>
                  </div>

                  <Link
                    to="/studio"
                    className="btn-secondary"
                    style={{
                      padding: '0.6rem 1.1rem',
                      fontSize: '0.85rem',
                      width: '100%',
                      marginTop: '0.5rem',
                    }}
                  >
                    Try in studio <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Recognition Guidance for all gestures card */}
          <div
            className="card-enterprise"
            style={{
              padding: '2.5rem',
              backgroundColor: 'var(--color-surface-white)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--color-teal-tint-1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-teal-shade)',
                }}
              >
                <Sparkles size={20} />
              </div>
              <h2 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--color-navy)' }}>
                Recognition guidance for all gestures & phrases
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {RECOGNITION_GUIDANCE.map((tip, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <CheckCircle2 size={18} color="var(--color-teal)" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
                    {tip}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
