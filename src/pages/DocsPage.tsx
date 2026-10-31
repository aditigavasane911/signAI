import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Shield, ArrowLeft } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const DocsPage: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const samplePayload = `{
  "landmarks": [
    0.501, 0.849, 0.000,
    0.382, 0.748, -0.012,
    0.298, 0.651, -0.024,
    0.247, 0.553, -0.038,
    0.201, 0.452, -0.052,
    0.402, 0.521, -0.008,
    0.378, 0.381, -0.019,
    0.362, 0.264, -0.027,
    0.349, 0.152, -0.035,
    0.502, 0.503, -0.005,
    0.501, 0.354, -0.016,
    0.500, 0.231, -0.025,
    0.499, 0.121, -0.032,
    0.598, 0.529, -0.007,
    0.619, 0.392, -0.018,
    0.638, 0.281, -0.026,
    0.651, 0.181, -0.033,
    0.698, 0.582, -0.010,
    0.738, 0.461, -0.020,
    0.759, 0.362, -0.027,
    0.779, 0.281, -0.032
  ],
  "handedness": "right",
  "client_timestamp_ms": 1714329821045
}`;

  const sampleResponse = `{
  "prediction": {
    "label": "Open Palm",
    "confidence": 0.964,
    "class_id": 1,
    "is_unknown": false
  },
  "model_version": "signbridge-isolated-demo-v1.4",
  "inference_latency_ms": 11.8
}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      <Navbar />

      <main className="section-spacing" style={{ flex: 1, paddingTop: '3rem' }}>
        <div className="container" style={{ maxWidth: '1280px' }}>
          {/* Header */}
          <div style={{ marginBottom: '2.5rem' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.88rem',
                color: 'var(--color-text-secondary)',
                marginBottom: '1rem',
                fontWeight: 500,
              }}
            >
              <ArrowLeft size={15} /> Back to SignBridge AI
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <span className="badge-pill">API REFERENCE · v1.4</span>
            </div>

            <h1 style={{ color: 'var(--color-navy)', fontSize: 'clamp(2.2rem, 4vw, 2.8rem)', marginBottom: '0.75rem' }}>
              SignBridge Classifier API
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              Inspect and integrate the privacy-preserving 63-coordinate floating point prediction endpoint. No image or video footage ever touches this endpoint.
            </p>
          </div>

          {/* Privacy Guarantee Card */}
          <div
            className="card-enterprise"
            style={{
              padding: '1.25rem 1.5rem',
              marginBottom: '3rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
            }}
          >
            <Shield size={24} color="var(--color-teal)" style={{ marginTop: '0.2rem', flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--color-navy)', marginBottom: '0.25rem' }}>
                Strict Coordinate-Only Contract
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
                The endpoint accepts strictly 21 3D normalized coordinates (63 floats). Attempts to upload base64 images, video buffers, or multipart payloads will be rejected with HTTP 415 Unsupported Media Type.
              </p>
            </div>
          </div>

          {/* Endpoint Specification */}
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--color-navy)', marginBottom: '1.25rem' }}>
              Classification Endpoint
            </h2>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--color-surface-white)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.95rem',
                color: 'var(--color-navy)',
                marginBottom: '1.5rem',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <span style={{ backgroundColor: 'var(--color-teal)', color: '#FFFFFF', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.8rem' }}>
                POST
              </span>
              <span style={{ fontWeight: 600 }}>/api/v1/classify</span>
            </div>

            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-navy)', marginBottom: '0.75rem' }}>
              Request Body (application/json)
            </h3>

            {/* Code Block for Request */}
            <div
              style={{
                position: 'relative',
                backgroundColor: '#082244',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                border: '1px solid #1A3E6F',
                color: '#A7C7E7',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                lineHeight: 1.55,
                overflowX: 'auto',
                marginBottom: '2rem',
              }}
            >
              <button
                onClick={() => copyCode(samplePayload, 'req')}
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.65rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                }}
              >
                {copiedSection === 'req' ? <Check size={14} color="#00C2A8" /> : <Copy size={14} />}
                <span>{copiedSection === 'req' ? 'Copied' : 'Copy'}</span>
              </button>
              <pre>{samplePayload}</pre>
            </div>

            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-navy)', marginBottom: '0.75rem' }}>
              Response (200 OK)
            </h3>

            {/* Code Block for Response */}
            <div
              style={{
                position: 'relative',
                backgroundColor: '#082244',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                border: '1px solid #1A3E6F',
                color: '#A7C7E7',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                lineHeight: 1.55,
                overflowX: 'auto',
              }}
            >
              <button
                onClick={() => copyCode(sampleResponse, 'res')}
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.65rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#FFFFFF',
                  fontSize: '0.75rem',
                }}
              >
                {copiedSection === 'res' ? <Check size={14} color="#00C2A8" /> : <Copy size={14} />}
                <span>{copiedSection === 'res' ? 'Copied' : 'Copy'}</span>
              </button>
              <pre>{sampleResponse}</pre>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
