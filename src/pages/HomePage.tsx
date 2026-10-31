import React from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  Shield,
  Layers,
  Cpu,
  EyeOff,
  Wifi,
  Lock,
  UserCheck,
  Keyboard,
  Radio,
  Type,
  Bell,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { HeroLandmarkSimulation } from '../components/HeroLandmarkSimulation';
import { LandmarkHandSvg } from '../components/LandmarkHandSvg';
import { SUPPORTED_GESTURES, KNOWN_LIMITATIONS } from '../data/gestures';

export const HomePage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      <main>
        {/* =========================================================================
            1. HERO SECTION
            ========================================================================= */}
        <section
          style={{
            position: 'relative',
            paddingTop: '3.5rem',
            paddingBottom: '5.5rem',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Ambient Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-10%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '800px',
              height: '450px',
              background: 'radial-gradient(circle, rgba(0, 194, 168, 0.12) 0%, rgba(123, 97, 255, 0.08) 45%, transparent 70%)',
              filter: 'blur(60px)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          <div
            className="container hero-grid"
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 1fr)',
              gap: '3.5rem',
              alignItems: 'center',
            }}
          >
            {/* Left Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <span className="badge-pill">
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-teal)' }} />
                  BROWSER-BASED GESTURE RECOGNITION
                </span>
              </div>

              <h1
                style={{
                  color: 'var(--color-navy)',
                  lineHeight: 1.15,
                }}
              >
                Hands that speak,{' '}
                <span className="text-gradient">text that answers.</span>
              </h1>

              <p
                style={{
                  fontSize: '1.12rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.65,
                  maxWidth: '560px',
                }}
              >
                SignBridge AI recognizes supported isolated hand gestures through your webcam and turns them into readable text — with the camera feed processed entirely on your device.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
                <Link to="/studio" className="btn-signature">
                  Try it as a guest <ArrowRight size={16} />
                </Link>

                <Link to="/register" className="btn-secondary">
                  Create a free account
                </Link>
              </div>

              {/* 3 Trust Features */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1.5rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--color-border-light)',
                  marginTop: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.86rem', color: 'var(--color-navy)', fontWeight: 500 }}>
                  <EyeOff size={16} color="var(--color-teal)" />
                  <span>No video uploads</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.86rem', color: 'var(--color-navy)', fontWeight: 500 }}>
                  <Shield size={16} color="var(--color-teal)" />
                  <span>History opt-in only</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.86rem', color: 'var(--color-navy)', fontWeight: 500 }}>
                  <Cpu size={16} color="var(--color-purple)" />
                  <span>Demonstration model</span>
                </div>
              </div>
            </div>

            {/* Right Simulation Visual */}
            <div>
              <HeroLandmarkSimulation />
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. HOW RECOGNITION WORKS SECTION (#how-it-works)
            ========================================================================= */}
        <section id="how-it-works" className="section-spacing" style={{ backgroundColor: 'var(--color-surface-white)' }}>
          <div className="container">
            <div style={{ maxWidth: '640px', marginBottom: '3.5rem' }}>
              <h2 style={{ marginBottom: '1rem' }}>How recognition works</h2>
              <p style={{ fontSize: '1.05rem', color: 'var(--color-text-secondary)' }}>
                Three stages, split deliberately between your browser and our API — so the heavy privacy-sensitive work never leaves your machine.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.75rem',
              }}
            >
              {/* Step 1 */}
              <div className="card-enterprise">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--color-teal-tint-1)',
                      color: 'var(--color-teal-shade)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Camera size={22} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-navy-tint-2)' }}>
                    01
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Your camera stays yours</h3>
                <p style={{ fontSize: '0.95rem' }}>
                  Video frames are processed entirely in your browser. Nothing is recorded, and no footage is uploaded — ever.
                </p>
              </div>

              {/* Step 2 */}
              <div className="card-enterprise">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--color-navy-tint-1)',
                      color: 'var(--color-navy)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Layers size={22} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-navy-tint-2)' }}>
                    02
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Landmarks, not pixels</h3>
                <p style={{ fontSize: '0.95rem' }}>
                  MediaPipe detects 21 hand landmarks per frame and the browser distills them into a compact numeric feature vector — pose, scale and rotation invariant.
                </p>
              </div>

              {/* Step 3 */}
              <div className="card-enterprise">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--color-purple-tint-1)',
                      color: 'var(--color-purple-shade)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Cpu size={22} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-navy-tint-2)' }}>
                    03
                  </span>
                </div>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Classified into text</h3>
                <p style={{ fontSize: '0.95rem' }}>
                  Only that numeric vector goes to our API. The versioned classifier returns a label with a confidence score — or an honest 'unknown'.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. SUPPORTED VOCABULARY SECTION
            ========================================================================= */}
        <section className="section-spacing" style={{ backgroundColor: 'var(--color-bg)' }}>
          <div className="container">
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: '2.5rem',
                gap: '1.5rem',
              }}
            >
              <div style={{ maxWidth: '640px' }}>
                <h2 style={{ marginBottom: '0.75rem' }}>Supported vocabulary</h2>
                <p style={{ fontSize: '1.02rem', color: 'var(--color-text-secondary)' }}>
                  The deployed model recognizes a small set of isolated hand gestures. These are hand shapes — not words of any particular sign language.
                </p>
              </div>

              <Link to="/library" className="btn-secondary">
                Browse the full library <ArrowRight size={16} />
              </Link>
            </div>

            {/* 8 Gesture Cards in 4x2 Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {SUPPORTED_GESTURES.map((gesture) => (
                <div key={gesture.id} className="gesture-card">
                  <LandmarkHandSvg shape={gesture.svgShape} height={170} />

                  <h3
                    style={{
                      fontSize: '1.15rem',
                      color: 'var(--color-navy)',
                      marginTop: '1.1rem',
                      marginBottom: '0.45rem',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {gesture.name}
                  </h3>

                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, flex: 1 }}>
                    {gesture.shortDescription}
                  </p>
                </div>
              ))}
            </div>

            {/* Amber Warning Notice matching reference */}
            <div className="notice-warning" style={{ marginTop: '2.5rem' }}>
              <AlertTriangle size={18} color="var(--color-status-warning)" style={{ flexShrink: 0 }} />
              <span>
                The recognition model shipped with this build is a demonstration-grade artifact; see known limitations below before relying on any output.
              </span>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. PRIVACY-FIRST CAMERA PROCESSING SECTION (#privacy)
            ========================================================================= */}
        <section id="privacy" className="section-spacing" style={{ backgroundColor: 'var(--color-surface-white)' }}>
          <div
            className="container privacy-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
              gap: '4rem',
              alignItems: 'center',
            }}
          >
              {/* Left Column: Data Boundary Diagram Card */}
              <div
                style={{
                  backgroundColor: '#082244',
                  borderRadius: 'var(--radius-xl)',
                  padding: '2.25rem',
                  color: '#FFFFFF',
                  boxShadow: 'var(--shadow-xl)',
                  border: '1px solid #1A3E6F',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                  <Shield size={20} color="#00C2A8" />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#CCF6EB' }}>
                    DATA BOUNDARY ARCHITECTURE
                  </span>
                </div>

                {/* Diagram Steps */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Local Machine */}
                  <div
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(11, 45, 91, 0.7)',
                      border: '1px solid rgba(0, 194, 168, 0.3)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.95rem' }}>Your Local Machine</span>
                      <span style={{ fontSize: '0.75rem', color: '#00C2A8', backgroundColor: 'rgba(0,194,168,0.15)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>Private</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#A7C7E7', lineHeight: 1.5 }}>
                      Webcam video frame (1080p / 720p) is analyzed in browser RAM via WebAssembly. Never leaves your device.
                    </p>
                  </div>

                  {/* Transfer Vector */}
                  <div style={{ textAlign: 'center', color: '#6A9BDD', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span style={{ height: '1px', flex: 1, backgroundColor: 'rgba(106, 155, 221, 0.25)' }} />
                    <span>Transfers 63 floats only (0.25 KB)</span>
                    <span style={{ height: '1px', flex: 1, backgroundColor: 'rgba(106, 155, 221, 0.25)' }} />
                  </div>

                  {/* Cloud API */}
                  <div
                    style={{
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(11, 45, 91, 0.7)',
                      border: '1px solid rgba(123, 97, 255, 0.3)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '0.95rem' }}>Classifier Engine</span>
                      <span style={{ fontSize: '0.75rem', color: '#D2C8FF', backgroundColor: 'rgba(123,97,255,0.15)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>Anonymous</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: '#A7C7E7', lineHeight: 1.5 }}>
                      Receives normalized coordinate floats, evaluates decision tree/model weights, returns label and confidence in 12ms.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: 4 Privacy Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div>
                  <h2 style={{ marginBottom: '1rem' }}>Privacy-first camera processing</h2>
                  <p style={{ fontSize: '1.05rem', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                    Assistive technology loses its purpose if it watches you. SignBridge is built so the sensitive part — your camera — never leaves your device.
                  </p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1.5rem',
                  }}
                >
                  {/* Card 1 */}
                  <div className="card-enterprise">
                    <EyeOff size={22} color="var(--color-teal)" style={{ marginBottom: '0.85rem' }} />
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.45rem' }}>On-device processing</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
                      Landmark detection runs locally with WebAssembly. Raw webcam video never leaves your device.
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="card-enterprise">
                    <Wifi size={22} color="var(--color-navy)" style={{ marginBottom: '0.85rem' }} />
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.45rem' }}>Only numbers travel</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
                      Each prediction sends 63 anonymous floats — coordinates with no image data attached.
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="card-enterprise">
                    <Lock size={22} color="var(--color-purple)" style={{ marginBottom: '0.85rem' }} />
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.45rem' }}>History is opt-in</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
                      Recognition events are stored only if you enable history in privacy controls. Off by default.
                    </p>
                  </div>

                  {/* Card 4 */}
                  <div className="card-enterprise">
                    <UserCheck size={22} color="var(--color-teal)" style={{ marginBottom: '0.85rem' }} />
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.45rem' }}>Your data, controlled</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
                      Export everything we store about you as JSON, or delete your account and its data outright.
                    </p>
                  </div>
                </div>
              </div>
            </div>
        </section>

        {/* =========================================================================
            5. BUILT FOR ACCESSIBILITY SECTION
            ========================================================================= */}
        <section className="section-spacing" style={{ backgroundColor: 'var(--color-bg)' }}>
          <div className="container">
            <div style={{ maxWidth: '640px', marginBottom: '3.5rem' }}>
              <h2 style={{ marginBottom: '0.75rem' }}>Built for accessibility</h2>
              <p style={{ fontSize: '1.02rem', color: 'var(--color-text-secondary)' }}>
                Assistive tools should prioritize keyboard control, screen readers, readable typography, and calm visual feedback.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
              }}
            >
              {/* Card 1 */}
              <div className="card-enterprise">
                <Keyboard size={24} color="var(--color-navy)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.12rem', marginBottom: '0.5rem' }}>Keyboard-first</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  Start, pause, clear, copy and download are all reachable by keyboard, with visible focus.
                </p>
              </div>

              {/* Card 2 */}
              <div className="card-enterprise">
                <Radio size={24} color="var(--color-teal)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.12rem', marginBottom: '0.5rem' }}>Screen-reader live regions</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  Recognized signs and camera state changes are announced politely via ARIA live regions.
                </p>
              </div>

              {/* Card 3 */}
              <div className="card-enterprise">
                <Type size={24} color="var(--color-purple)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.12rem', marginBottom: '0.5rem' }}>Readable by design</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  Text scaling, high-contrast mode and reduced-motion preferences live in accessibility settings.
                </p>
              </div>

              {/* Card 4 */}
              <div className="card-enterprise">
                <Bell size={24} color="var(--color-navy)" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.12rem', marginBottom: '0.5rem' }}>Calm feedback</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                  Clear status indicators for every state: no hand, low confidence, camera denied, backend offline.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            6. KNOWN LIMITATIONS SECTION (#limitations)
            ========================================================================= */}
        <section id="limitations" className="section-spacing" style={{ backgroundColor: 'var(--color-surface-white)' }}>
          <div className="container" style={{ maxWidth: '1200px' }}>
            <div
              style={{
                backgroundColor: 'var(--color-status-warning-bg)',
                border: '1.5px solid var(--color-status-warning-border)',
                borderRadius: 'var(--radius-xl)',
                padding: '2.5rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <AlertTriangle size={24} color="var(--color-status-warning)" />
                <h2 style={{ fontSize: '1.6rem', color: 'var(--color-status-warning-text)', margin: 0 }}>Known limitations</h2>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                {KNOWN_LIMITATIONS.map((lim, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-status-warning)',
                        marginTop: '0.55rem',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: '0.98rem', color: 'var(--color-status-warning-subtext)', lineHeight: 1.6 }}>{lim}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* =========================================================================
            7. BOTTOM CTA SECTION
            ========================================================================= */}
        <section
          className="section-spacing"
          style={{
            backgroundColor: '#082244',
            color: '#FFFFFF',
            textAlign: 'center',
          }}
        >
          <div className="container">
            <div style={{ maxWidth: '840px', margin: '0 auto' }}>
              <h2
                style={{
                  fontSize: 'clamp(2rem, 4vw, 3rem)',
                  color: '#FFFFFF',
                  marginBottom: '1rem',
                }}
              >
                Try a gesture right now — no account needed
              </h2>

              <p style={{ fontSize: '1.12rem', color: '#A7C7E7', marginBottom: '2.25rem', lineHeight: 1.6 }}>
                Open the studio, allow the camera, hold a gesture steady. Everything runs in your browser.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
                <Link to="/studio" className="btn-signature" style={{ padding: '0.85rem 2rem', fontSize: '1.02rem' }}>
                  Open the recognition studio <ArrowRight size={18} />
                </Link>

                <Link to="/login" className="btn-secondary" style={{ padding: '0.85rem 1.85rem', fontSize: '1.02rem' }}>
                  Sign in
                </Link>
              </div>

              <span style={{ fontSize: '0.85rem', color: '#6A9BDD' }}>
                Works best in good light, hand inside the frame.
              </span>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .privacy-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};
