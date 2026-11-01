import type { LandmarkPoint } from '../types';

export const HAND_CONNECTIONS: [number, number][] = [
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
  [17, 18], [18, 19], [19, 20],
];

export interface HandRenderOptions {
  strokeColor?: string;
  glowColor?: string;
  tipColor?: string;
  tipGlow?: string;
}

export function drawHandLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: LandmarkPoint[],
  canvasWidth: number,
  canvasHeight: number,
  isMirrored: boolean = false,
  options?: HandRenderOptions
) {
  if (!landmarks || landmarks.length < 21) return;

  const strokeColor = options?.strokeColor || '#00C2A8';
  const glowColor = options?.glowColor || 'rgba(0, 194, 168, 0.6)';
  const tipColor = options?.tipColor || '#7B61FF';
  const tipGlow = options?.tipGlow || '#7B61FF';

  ctx.save();
  if (isMirrored) {
    ctx.translate(canvasWidth, 0);
    ctx.scale(-1, 1);
  }

  // Draw Bones / Connections
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 8;

  HAND_CONNECTIONS.forEach(([start, end]) => {
    const p1 = landmarks[start];
    const p2 = landmarks[end];
    if (p1 && p2) {
      ctx.beginPath();
      ctx.moveTo(p1.x * canvasWidth, p1.y * canvasHeight);
      ctx.lineTo(p2.x * canvasWidth, p2.y * canvasHeight);
      ctx.stroke();
    }
  });

  // Draw Keypoints
  landmarks.forEach((pt, index) => {
    const isTip = [4, 8, 12, 16, 20].includes(index);
    const isWrist = index === 0;

    const x = pt.x * canvasWidth;
    const y = pt.y * canvasHeight;

    // Outer halo ring on tips
    if (isTip) {
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, 2 * Math.PI);
      ctx.strokeStyle = tipGlow;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = tipGlow;
      ctx.shadowBlur = 12;
      ctx.stroke();
    }

    // Node body
    ctx.beginPath();
    ctx.arc(x, y, isTip ? 5 : isWrist ? 6 : 4, 0, 2 * Math.PI);
    ctx.fillStyle = isTip ? tipColor : strokeColor;
    ctx.shadowColor = isTip ? tipGlow : glowColor;
    ctx.shadowBlur = 8;
    ctx.fill();

    // Inner center dot
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
  });

  ctx.restore();
}

/**
 * Draws a radiant, pulsing neon heart effect between two hands forming a Complete Heart
 */
export function drawHeartEffect(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  scaleSize: number,
  canvasWidth: number,
  canvasHeight: number,
  isMirrored: boolean = false
) {
  ctx.save();
  if (isMirrored) {
    ctx.translate(canvasWidth, 0);
    ctx.scale(-1, 1);
  }

  const cx = center.x * canvasWidth;
  const cy = center.y * canvasHeight;
  const pulse = 1 + Math.sin(Date.now() / 180) * 0.08;
  const r = Math.max(38, scaleSize * canvasHeight * 0.5) * pulse;

  // 1. Outer radiant glow
  const glowGrad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.5);
  glowGrad.addColorStop(0, 'rgba(255, 64, 129, 0.4)');
  glowGrad.addColorStop(0.6, 'rgba(236, 72, 153, 0.15)');
  glowGrad.addColorStop(1, 'rgba(236, 72, 153, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // 2. Heart geometry
  ctx.save();
  ctx.translate(cx, cy);

  ctx.beginPath();
  // Start at bottom tip of heart
  ctx.moveTo(0, r * 0.65);
  // Left lobe: curve up and out to left, then arch inward to top center cleft
  ctx.bezierCurveTo(-r * 0.78, r * 0.12, -r * 0.78, -r * 0.62, 0, -r * 0.18);
  // Right lobe: arch outward to right and down to bottom tip
  ctx.bezierCurveTo(r * 0.78, -r * 0.62, r * 0.78, r * 0.12, 0, r * 0.65);
  ctx.closePath();

  // Vibrant gradient fill
  const heartGrad = ctx.createLinearGradient(0, -r * 0.6, 0, r * 0.65);
  heartGrad.addColorStop(0, 'rgba(255, 75, 130, 0.88)');
  heartGrad.addColorStop(1, 'rgba(236, 72, 153, 0.95)');
  ctx.fillStyle = heartGrad;
  ctx.shadowColor = '#FF2E7E';
  ctx.shadowBlur = 20;
  ctx.fill();

  // Glowing white border
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#FFFFFF';
  ctx.shadowBlur = 10;
  ctx.stroke();

  // Sparkles circling the heart
  const time = Date.now() / 450;
  for (let i = 0; i < 4; i++) {
    const angle = time + (i * Math.PI) / 2;
    const dist = r * 1.05;
    const sx = Math.cos(angle) * dist;
    const sy = Math.sin(angle) * dist;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FFB6C1';
    ctx.shadowBlur = 8;
    ctx.fill();
  }

  ctx.restore();
  ctx.restore();
}

/**
 * Draws a warm spiritual glow between two hands forming Namaste / Prayer
 */
export function drawPrayerEffect(
  ctx: CanvasRenderingContext2D,
  center: { x: number; y: number },
  scaleSize: number,
  canvasWidth: number,
  canvasHeight: number,
  isMirrored: boolean = false
) {
  ctx.save();
  if (isMirrored) {
    ctx.translate(canvasWidth, 0);
    ctx.scale(-1, 1);
  }

  const cx = center.x * canvasWidth;
  const cy = center.y * canvasHeight;
  const r = Math.max(30, scaleSize * canvasHeight * 0.4);

  const glow = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 1.3);
  glow.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
  glow.addColorStop(0.7, 'rgba(245, 158, 11, 0.15)');
  glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
