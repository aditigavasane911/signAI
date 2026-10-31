import React from 'react';
import { PHRASES_MODEL } from '../data/phrasesModelData';
import { ISL_MODEL } from '../data/islModelData';

interface LandmarkHandSvgProps {
  shape: 'open_palm' | 'closed_fist' | 'point_up' | 'peace_v' | 'thumbs_up' | 'ok_ring' | 'call_me' | 'three_fingers' | string;
  className?: string;
  width?: number | string;
  height?: number | string;
}

interface Point {
  x: number;
  y: number;
}

export const LandmarkHandSvg: React.FC<LandmarkHandSvgProps> = ({
  shape,
  className = '',
  width = '100%',
  height = 180,
}) => {
  // Hand landmark layout definitions based on 21 keypoints
  const getHandPoints = (): { points: Point[]; connections: [number, number][] } => {
    // 0: Wrist
    // 1-4: Thumb (CMC, MCP, IP, TIP)
    // 5-8: Index (MCP, PIP, DIP, TIP)
    // 9-12: Middle (MCP, PIP, DIP, TIP)
    // 13-16: Ring (MCP, PIP, DIP, TIP)
    // 17-20: Pinky (MCP, PIP, DIP, TIP)
    const connections: [number, number][] = [
      // Palm
      [0, 1], [1, 2], [2, 5], [5, 9], [9, 13], [13, 17], [17, 0],
      // Thumb
      [2, 3], [3, 4],
      // Index
      [5, 6], [6, 7], [7, 8],
      // Middle
      [9, 10], [10, 11], [11, 12],
      // Ring
      [13, 14], [14, 15], [15, 16],
      // Pinky
      [17, 18], [18, 19], [19, 20]
    ];

    // Check if shape corresponds to trained Phrase or ISL model centroid
    const phraseKey = shape.startsWith('phrase_') ? shape.replace('phrase_', '') : shape;
    const islKey = shape.startsWith('isl_') ? shape.replace('isl_', '') : shape;
    const centroid = PHRASES_MODEL.centroids[phraseKey] || ISL_MODEL.centroids[islKey];

    if (centroid && centroid.length === 63) {
      const rawPoints: Point[] = [];
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let i = 0; i < 21; i++) {
        const x = centroid[i * 3];
        const y = centroid[i * 3 + 1];
        rawPoints.push({ x, y });
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      const rangeX = (maxX - minX) || 1;
      const rangeY = (maxY - minY) || 1;
      const scale = Math.min(130 / rangeX, 130 / rangeY);
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const points = rawPoints.map((p) => ({
        x: Math.round(100 + (p.x - centerX) * scale),
        y: Math.round(95 + (p.y - centerY) * scale),
      }));

      return { points, connections };
    }

    let points: Point[] = [];

    switch (shape) {
      case 'open_palm':
        points = [
          { x: 100, y: 170 }, // 0: Wrist
          { x: 70, y: 145 },  // 1: Thumb CMC
          { x: 50, y: 125 },  // 2: Thumb MCP
          { x: 38, y: 105 },  // 3: Thumb IP
          { x: 28, y: 88 },   // 4: Thumb TIP
          { x: 74, y: 105 },  // 5: Index MCP
          { x: 68, y: 72 },   // 6: Index PIP
          { x: 64, y: 48 },   // 7: Index DIP
          { x: 60, y: 25 },   // 8: Index TIP
          { x: 100, y: 102 }, // 9: Middle MCP
          { x: 100, y: 65 },  // 10: Middle PIP
          { x: 100, y: 40 },  // 11: Middle DIP
          { x: 100, y: 18 },  // 12: Middle TIP
          { x: 126, y: 108 }, // 13: Ring MCP
          { x: 132, y: 72 },  // 14: Ring PIP
          { x: 136, y: 50 },  // 15: Ring DIP
          { x: 140, y: 30 },  // 16: Ring TIP
          { x: 150, y: 118 }, // 17: Pinky MCP
          { x: 160, y: 92 },  // 18: Pinky PIP
          { x: 166, y: 72 },  // 19: Pinky DIP
          { x: 172, y: 52 },  // 20: Pinky TIP
        ];
        break;

      case 'closed_fist':
        points = [
          { x: 100, y: 168 }, // 0
          { x: 72, y: 145 },  // 1
          { x: 60, y: 128 },  // 2
          { x: 75, y: 115 },  // 3 (curled over fingers)
          { x: 95, y: 112 },  // 4
          { x: 75, y: 98 },   // 5
          { x: 75, y: 78 },   // 6
          { x: 80, y: 90 },   // 7 (folded in)
          { x: 80, y: 102 },  // 8
          { x: 100, y: 96 },  // 9
          { x: 100, y: 76 },  // 10
          { x: 102, y: 88 },  // 11
          { x: 102, y: 100 }, // 12
          { x: 125, y: 98 },  // 13
          { x: 125, y: 78 },  // 14
          { x: 122, y: 90 },  // 15
          { x: 120, y: 102 }, // 16
          { x: 145, y: 104 }, // 17
          { x: 145, y: 86 },  // 18
          { x: 140, y: 96 },  // 19
          { x: 136, y: 106 }, // 20
        ];
        break;

      case 'point_up':
        points = [
          { x: 100, y: 170 }, // 0
          { x: 74, y: 145 },  // 1
          { x: 62, y: 130 },  // 2
          { x: 75, y: 122 },  // 3
          { x: 90, y: 120 },  // 4
          { x: 85, y: 102 },  // 5
          { x: 86, y: 72 },   // 6: Index PIP up
          { x: 87, y: 48 },   // 7: Index DIP up
          { x: 88, y: 22 },   // 8: Index TIP up!
          { x: 108, y: 104 }, // 9
          { x: 110, y: 84 },  // 10
          { x: 112, y: 98 },  // 11 (curled)
          { x: 112, y: 110 }, // 12
          { x: 130, y: 106 }, // 13
          { x: 130, y: 88 },  // 14
          { x: 128, y: 100 }, // 15
          { x: 126, y: 112 }, // 16
          { x: 148, y: 112 }, // 17
          { x: 148, y: 96 },  // 18
          { x: 144, y: 106 }, // 19
          { x: 140, y: 116 }, // 20
        ];
        break;

      case 'peace_v':
        points = [
          { x: 100, y: 170 }, // 0
          { x: 74, y: 146 },  // 1
          { x: 66, y: 130 },  // 2
          { x: 80, y: 124 },  // 3
          { x: 96, y: 122 },  // 4
          { x: 84, y: 105 },  // 5
          { x: 74, y: 74 },   // 6 (spread V left)
          { x: 68, y: 50 },   // 7
          { x: 60, y: 26 },   // 8: Index TIP
          { x: 108, y: 104 }, // 9
          { x: 118, y: 72 },  // 10 (spread V right)
          { x: 124, y: 48 },  // 11
          { x: 130, y: 25 },  // 12: Middle TIP
          { x: 132, y: 110 }, // 13
          { x: 134, y: 92 },  // 14 (curled)
          { x: 132, y: 104 }, // 15
          { x: 130, y: 116 }, // 16
          { x: 150, y: 118 }, // 17
          { x: 150, y: 100 }, // 18 (curled)
          { x: 146, y: 112 }, // 19
          { x: 142, y: 122 }, // 20
        ];
        break;

      case 'thumbs_up':
        points = [
          { x: 130, y: 165 }, // 0: Wrist angled
          { x: 108, y: 146 }, // 1
          { x: 88, y: 125 },  // 2: Thumb MCP base
          { x: 84, y: 90 },   // 3: Thumb IP up
          { x: 82, y: 54 },   // 4: Thumb TIP up high!
          { x: 102, y: 106 }, // 5: Index MCP
          { x: 120, y: 96 },  // 6 (curled fist right)
          { x: 124, y: 108 }, // 7
          { x: 120, y: 120 }, // 8
          { x: 104, y: 122 }, // 9: Middle MCP
          { x: 124, y: 116 }, // 10
          { x: 128, y: 126 }, // 11
          { x: 122, y: 136 }, // 12
          { x: 108, y: 138 }, // 13: Ring MCP
          { x: 126, y: 134 }, // 14
          { x: 128, y: 144 }, // 15
          { x: 122, y: 152 }, // 16
          { x: 114, y: 154 }, // 17: Pinky MCP
          { x: 126, y: 152 }, // 18
          { x: 126, y: 160 }, // 19
          { x: 120, y: 166 }, // 20
        ];
        break;

      case 'ok_ring':
        points = [
          { x: 100, y: 170 }, // 0
          { x: 72, y: 146 },  // 1
          { x: 62, y: 130 },  // 2
          { x: 65, y: 108 },  // 3
          { x: 76, y: 96 },   // 4: Thumb TIP meets Index TIP!
          { x: 88, y: 112 },  // 5: Index MCP
          { x: 78, y: 88 },   // 6: Index PIP curves to meet
          { x: 74, y: 94 },   // 7: Index DIP
          { x: 76, y: 96 },   // 8: Index TIP joins thumb at (76,96)
          { x: 108, y: 106 }, // 9: Middle MCP
          { x: 110, y: 68 },  // 10: Middle extends up!
          { x: 112, y: 44 },  // 11
          { x: 114, y: 22 },  // 12: Middle TIP
          { x: 128, y: 110 }, // 13: Ring MCP
          { x: 134, y: 74 },  // 14: Ring extends up
          { x: 138, y: 52 },  // 15
          { x: 142, y: 32 },  // 16: Ring TIP
          { x: 148, y: 118 }, // 17: Pinky MCP
          { x: 158, y: 86 },  // 18: Pinky extends up
          { x: 164, y: 64 },  // 19
          { x: 170, y: 44 },  // 20: Pinky TIP
        ];
        break;

      case 'call_me':
        points = [
          { x: 100, y: 168 }, // 0
          { x: 70, y: 144 },  // 1
          { x: 48, y: 126 },  // 2: Thumb extended wide left
          { x: 34, y: 110 },  // 3
          { x: 22, y: 96 },   // 4: Thumb TIP out
          { x: 86, y: 108 },  // 5: Index MCP
          { x: 88, y: 88 },   // 6 (curled down)
          { x: 92, y: 100 },  // 7
          { x: 94, y: 110 },  // 8
          { x: 104, y: 106 }, // 9: Middle MCP
          { x: 106, y: 86 },  // 10 (curled)
          { x: 108, y: 98 },  // 11
          { x: 110, y: 108 }, // 12
          { x: 122, y: 108 }, // 13: Ring MCP
          { x: 122, y: 88 },  // 14 (curled)
          { x: 122, y: 100 }, // 15
          { x: 122, y: 110 }, // 16
          { x: 140, y: 114 }, // 17: Pinky MCP
          { x: 158, y: 98 },  // 18: Pinky extended wide right!
          { x: 170, y: 84 },  // 19
          { x: 184, y: 70 },  // 20: Pinky TIP out
        ];
        break;

      case 'three_fingers':
        points = [
          { x: 100, y: 170 }, // 0
          { x: 76, y: 146 },  // 1
          { x: 68, y: 130 },  // 2
          { x: 84, y: 122 },  // 3 (curled across pinky)
          { x: 100, y: 120 }, // 4: Thumb tucked
          { x: 78, y: 106 },  // 5: Index MCP
          { x: 74, y: 72 },   // 6: Index UP
          { x: 70, y: 48 },   // 7
          { x: 68, y: 24 },   // 8: Index TIP
          { x: 100, y: 104 }, // 9: Middle MCP
          { x: 100, y: 68 },  // 10: Middle UP
          { x: 100, y: 42 },  // 11
          { x: 100, y: 20 },  // 12: Middle TIP
          { x: 122, y: 106 }, // 13: Ring MCP
          { x: 126, y: 72 },  // 14: Ring UP
          { x: 128, y: 48 },  // 15
          { x: 130, y: 26 },  // 16: Ring TIP
          { x: 144, y: 116 }, // 17: Pinky MCP
          { x: 144, y: 98 },  // 18 (curled in)
          { x: 138, y: 108 }, // 19
          { x: 132, y: 118 }, // 20: Pinky tucked
        ];
        break;
      default:
        // Default to open palm
        points = [
          { x: 100, y: 170 }, { x: 70, y: 145 }, { x: 50, y: 125 }, { x: 38, y: 105 }, { x: 28, y: 88 },
          { x: 74, y: 105 }, { x: 68, y: 72 }, { x: 64, y: 48 }, { x: 60, y: 25 },
          { x: 100, y: 102 }, { x: 100, y: 65 }, { x: 100, y: 40 }, { x: 100, y: 18 },
          { x: 126, y: 108 }, { x: 132, y: 72 }, { x: 136, y: 50 }, { x: 140, y: 30 },
          { x: 150, y: 118 }, { x: 160, y: 92 }, { x: 166, y: 72 }, { x: 172, y: 52 },
        ];
        break;
    }

    return { points, connections };
  };

  const { points, connections } = getHandPoints();

  return (
    <div
      className={`landmark-svg-container ${className}`}
      style={{
        position: 'relative',
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, rgba(0, 194, 168, 0.08) 0%, rgba(8, 34, 68, 0.6) 70%, #082244 100%)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(106, 155, 221, 0.2)',
      }}
    >
      {/* Blueprint Grid Lines */}
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none' }}
      >
        <defs>
          <pattern id={`grid-${shape}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#6A9BDD" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${shape})`} />
      </svg>

      {/* Hand Wireframe */}
      <svg
        viewBox="0 0 200 190"
        style={{ width: '85%', height: '85%', zIndex: 1, filter: 'drop-shadow(0 0 8px rgba(0, 194, 168, 0.45))' }}
      >
        {/* Landmark Connections (Bones) */}
        {connections.map(([start, end], idx) => {
          const p1 = points[start];
          const p2 = points[end];
          if (!p1 || !p2) return null;
          return (
            <line
              key={`conn-${idx}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#00C2A8"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.9"
            />
          );
        })}

        {/* Outer Halo Rings on Tips */}
        {[4, 8, 12, 16, 20].map((tipIdx) => {
          const pt = points[tipIdx];
          if (!pt) return null;
          return (
            <circle
              key={`halo-${tipIdx}`}
              cx={pt.x}
              cy={pt.y}
              r="7"
              fill="none"
              stroke="#7B61FF"
              strokeWidth="1.2"
              opacity="0.75"
            />
          );
        })}

        {/* Landmark Nodes */}
        {points.map((pt, idx) => {
          const isTip = [4, 8, 12, 16, 20].includes(idx);
          const isWrist = idx === 0;
          return (
            <g key={`pt-${idx}`}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isTip ? 4 : isWrist ? 4.5 : 3}
                fill={isTip ? '#7B61FF' : '#00C2A8'}
                stroke="#FFFFFF"
                strokeWidth="1.2"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
