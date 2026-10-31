import React, { useEffect, useState } from 'react';
import { Sparkles, Activity } from 'lucide-react';
import { LandmarkHandSvg } from './LandmarkHandSvg';

export const HeroLandmarkSimulation: React.FC = () => {
  const [activeGestureIndex, setActiveGestureIndex] = useState(0);
  const [confidence, setConfidence] = useState(0.96);

  const gestures = [
    { name: 'Peace / V', shape: 'peace_v' as const, conf: 0.96 },
    { name: 'Open Palm', shape: 'open_palm' as const, conf: 0.98 },
    { name: 'OK Ring', shape: 'ok_ring' as const, conf: 0.94 },
    { name: 'Thumbs Up', shape: 'thumbs_up' as const, conf: 0.97 },
    { name: 'Call Me / Shaka', shape: 'call_me' as const, conf: 0.93 },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveGestureIndex((prev) => {
        const next = (prev + 1) % gestures.length;
        setConfidence(gestures[next].conf);
        return next;
      });
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  const current = gestures[activeGestureIndex];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '540px',
        margin: '0 auto',
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(145deg, #082244 0%, #0B2D5B 100%)',
        border: '1px solid rgba(106, 155, 221, 0.3)',
        boxShadow: 'var(--shadow-xl), 0 0 35px rgba(0, 194, 168, 0.15)',
        overflow: 'hidden',
        color: '#FFFFFF',
      }}
    >
      {/* Top Simulation Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(8, 34, 68, 0.7)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#00C2A8',
              boxShadow: '0 0 10px #00C2A8',
              animation: 'pulse 1.8s infinite',
            }}
          />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#CCF6EB' }}>
            ON-DEVICE LANDMARK ENGINE
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(123, 97, 255, 0.2)',
              color: '#D2C8FF',
              border: '1px solid rgba(123, 97, 255, 0.4)',
              fontWeight: 500,
            }}
          >
            21 Keypoints · 63 Floats
          </span>
        </div>
      </div>

      {/* Main Simulation Viewport */}
      <div style={{ position: 'relative', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LandmarkHandSvg shape={current.shape} height="100%" />

        {/* Live Tracking Overlay Indicators */}
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            backgroundColor: 'rgba(8, 34, 68, 0.85)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(0, 194, 168, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem 0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
          }}
        >
          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#8B95A5', fontWeight: 600 }}>Detected Shape</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={14} color="#00C2A8" />
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>{current.name}</span>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            backgroundColor: 'rgba(8, 34, 68, 0.85)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(123, 97, 255, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.5rem 0.85rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.2rem',
          }}
        >
          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#8B95A5', fontWeight: 600 }}>Confidence</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Activity size={14} color="#7B61FF" />
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#00C2A8' }}>
              {(confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Live Bar matching reference */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.9rem 1.25rem',
          background: 'rgba(7, 29, 58, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.85rem',
          color: '#A7C7E7',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#00C2A8',
            flexShrink: 0,
          }}
        />
        <span>Live landmark overlay · confidence scoring · transcript building</span>
      </div>
    </div>
  );
};
