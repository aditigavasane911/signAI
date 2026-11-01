import type { LandmarkPoint } from '../types';

export const FACE_SILHOUETTE = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152,
  148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10,
];

export const LEFT_EYE = [33, 160, 158, 133, 153, 144, 33];
export const RIGHT_EYE = [362, 385, 387, 263, 373, 380, 362];
export const LIPS_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61];
export const NOSE_LINE = [168, 6, 197, 195, 5, 4, 1];

export function drawFaceLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: LandmarkPoint[],
  canvasWidth: number,
  canvasHeight: number,
  isMirrored: boolean = false
) {
  if (!landmarks || landmarks.length < 300) return;

  ctx.save();
  if (isMirrored) {
    ctx.translate(canvasWidth, 0);
    ctx.scale(-1, 1);
  }

  const drawPath = (indices: number[], strokeStyle: string, lineWidth: number) => {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    let started = false;
    for (const idx of indices) {
      const pt = landmarks[idx];
      if (pt) {
        const x = pt.x * canvasWidth;
        const y = pt.y * canvasHeight;
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    }
    ctx.stroke();
  };

  // Draw face contour lines with subtle glow
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowBlur = 6;

  // Face oval
  ctx.shadowColor = 'rgba(123, 97, 255, 0.4)';
  drawPath(FACE_SILHOUETTE, 'rgba(123, 97, 255, 0.55)', 1.5);

  // Eyes
  ctx.shadowColor = 'rgba(0, 194, 168, 0.6)';
  drawPath(LEFT_EYE, 'rgba(0, 194, 168, 0.85)', 2);
  drawPath(RIGHT_EYE, 'rgba(0, 194, 168, 0.85)', 2);

  // Lips
  ctx.shadowColor = 'rgba(255, 107, 107, 0.5)';
  drawPath(LIPS_OUTER, 'rgba(255, 107, 107, 0.8)', 2);

  // Nose
  ctx.shadowColor = 'rgba(0, 194, 168, 0.5)';
  drawPath(NOSE_LINE, 'rgba(0, 194, 168, 0.65)', 1.5);

  // Key tracking feature dots (Nose tip, Eye centers, Mouth corners)
  const keyFeatureIndices = [1, 33, 263, 61, 291];
  for (const idx of keyFeatureIndices) {
    const pt = landmarks[idx];
    if (pt) {
      const x = pt.x * canvasWidth;
      const y = pt.y * canvasHeight;

      // Glow halo
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.strokeStyle = '#00C2A8';
      ctx.lineWidth = 1;
      ctx.shadowColor = '#00C2A8';
      ctx.shadowBlur = 10;
      ctx.stroke();

      // Dot
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = idx === 1 ? '#7B61FF' : '#00C2A8';
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Generates simulated 468 face mesh landmarks for sandbox testing with both hands and face
 */
export function getSimulatedFaceLandmarks(smiling: boolean = true): LandmarkPoint[] {
  const points: LandmarkPoint[] = [];
  const cx = 0.50;
  const cy = 0.28;
  const rx = 0.13;
  const ry = 0.17;

  // Base circular grid
  for (let i = 0; i < 468; i++) {
    const angle = (i / 468) * Math.PI * 2;
    points.push({
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry,
      z: 0,
    });
  }

  // Nose line
  const noseY = [0.20, 0.22, 0.24, 0.26, 0.28, 0.30, 0.31];
  NOSE_LINE.forEach((idx, i) => {
    points[idx] = { x: cx, y: noseY[i], z: -0.02 };
  });

  // Left Eye
  const lEyePts = [
    { x: 0.44, y: 0.23 }, { x: 0.45, y: 0.22 }, { x: 0.47, y: 0.22 },
    { x: 0.48, y: 0.23 }, { x: 0.47, y: 0.24 }, { x: 0.45, y: 0.24 }, { x: 0.44, y: 0.23 }
  ];
  LEFT_EYE.forEach((idx, i) => {
    points[idx] = { x: lEyePts[i].x, y: lEyePts[i].y, z: -0.01 };
  });

  // Right Eye
  const rEyePts = [
    { x: 0.52, y: 0.23 }, { x: 0.53, y: 0.22 }, { x: 0.55, y: 0.22 },
    { x: 0.56, y: 0.23 }, { x: 0.55, y: 0.24 }, { x: 0.53, y: 0.24 }, { x: 0.52, y: 0.23 }
  ];
  RIGHT_EYE.forEach((idx, i) => {
    points[idx] = { x: rEyePts[i].x, y: rEyePts[i].y, z: -0.01 };
  });

  // Lips
  const smileLift = smiling ? 0.015 : 0;
  points[61] = { x: 0.45, y: 0.36 - smileLift, z: 0 }; // left corner
  points[291] = { x: 0.55, y: 0.36 - smileLift, z: 0 }; // right corner
  points[0] = { x: 0.50, y: 0.35, z: 0 }; // top center
  points[17] = { x: 0.50, y: 0.38, z: 0 }; // bottom center
  points[13] = { x: 0.50, y: 0.355, z: 0 }; // upper lip inner

  // Silhouette oval
  FACE_SILHOUETTE.forEach((idx, i) => {
    const angle = (i / FACE_SILHOUETTE.length) * Math.PI * 2 - Math.PI / 2;
    points[idx] = {
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry,
      z: 0,
    };
  });

  return points;
}
