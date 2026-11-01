import type { LandmarkPoint, RecognitionPrediction } from '../types';

export interface TwoHandResult {
  prediction: RecognitionPrediction;
  gestureId: string;
  heartEffect?: {
    center: { x: number; y: number };
    size: number;
  };
  prayerEffect?: {
    center: { x: number; y: number };
    size: number;
  };
}

export class TwoHandGestureTracker {
  public detect(hands: LandmarkPoint[][]): TwoHandResult | null {
    if (!hands || hands.length < 2) {
      return null;
    }

    const handA = hands[0];
    const handB = hands[1];
    if (!handA || handA.length < 21 || !handB || handB.length < 21) {
      return null;
    }

    // Sort left to right based on wrist x coordinate
    const left = handA[0].x <= handB[0].x ? handA : handB;
    const right = handA[0].x <= handB[0].x ? handB : handA;

    // Estimate hand scale using wrist (0) to middle MCP (9)
    const scaleLeft = Math.hypot(left[9].x - left[0].x, left[9].y - left[0].y);
    const scaleRight = Math.hypot(right[9].x - right[0].x, right[9].y - right[0].y);
    const scale = Math.max(0.08, (scaleLeft + scaleRight) / 2);

    // 1. Check Complete Heart (🫶 / ❤️)
    const heart = this.checkHeart(left, right, scale);
    if (heart) {
      return heart;
    }

    // 2. Check Namaste / Prayer (🙏)
    const prayer = this.checkPrayer(left, right, scale);
    if (prayer) {
      return prayer;
    }

    // 3. Check Both Hands Raised (Celebrate / Open Hands 🙌)
    const bothUp = this.checkBothHandsUp(left, right, scale);
    if (bothUp) {
      return bothUp;
    }

    return null;
  }

  private checkHeart(left: LandmarkPoint[], right: LandmarkPoint[], scale: number): TwoHandResult | null {
    // Thumb tips: left[4] & right[4]
    const dThumbs = Math.hypot(left[4].x - right[4].x, left[4].y - right[4].y);
    const dThumbIP = Math.hypot(left[3].x - right[3].x, left[3].y - right[3].y);
    const minThumb = Math.min(dThumbs, dThumbIP);

    // Index fingertips: left[8] & right[8]
    const dIndex = Math.hypot(left[8].x - right[8].x, left[8].y - right[8].y);
    // Middle fingertips: left[12] & right[12]
    const dMiddle = Math.hypot(left[12].x - right[12].x, left[12].y - right[12].y);
    const minFingertip = Math.min(dIndex, dMiddle);

    // Index knuckles distance
    const dIndexKnuckles = Math.hypot(left[5].x - right[5].x, left[5].y - right[5].y);

    // Wrists distance (wrists must be separated at sides)
    const dWrists = Math.hypot(left[0].x - right[0].x, left[0].y - right[0].y);

    // Vertical bounds: index/middle tips must be above thumb tips
    const topY = Math.min(left[8].y, right[8].y, left[12].y, right[12].y);
    const botY = Math.max(left[4].y, right[4].y);
    const verticalHeight = botY - topY;

    // Conditions for Heart (🫶 / ❤️):
    // - Thumbs touch or are very close at bottom: minThumb <= 1.35 * scale
    // - Fingertips or knuckles touch/arch together at top: minFingertip <= 1.35 * scale || dIndexKnuckles <= 1.45 * scale
    // - Fingertips are clearly above thumbs: verticalHeight > 0.16 * scale and botY > topY
    // - Wrists are spread apart: dWrists > 0.42 * scale
    const thumbsTogether = minThumb <= 1.35 * scale;
    const tipsTogether = minFingertip <= 1.35 * scale || dIndexKnuckles <= 1.45 * scale;
    const correctVertical = verticalHeight > 0.16 * scale && botY > topY;
    const wristsApart = dWrists > 0.42 * scale;

    if (thumbsTogether && tipsTogether && correctVertical && wristsApart) {
      const thumbTightness = Math.max(0, 1 - (minThumb / scale) * 0.4);
      const tipTightness = Math.max(0, 1 - (minFingertip / scale) * 0.4);
      const confidence = Math.min(0.99, Math.max(0.86, 0.84 + thumbTightness * 0.08 + tipTightness * 0.07));

      const centerX = (left[8].x + right[8].x + left[4].x + right[4].x) / 4;
      const centerY = (topY + botY) / 2;
      const heartSize = Math.max(0.12, verticalHeight * 1.15);

      return {
        prediction: {
          label: 'Complete Heart (Love 🫶)',
          confidence,
          threshold: 0.70,
          isUnknown: false,
          timestamp: Date.now(),
        },
        gestureId: 'complete-heart',
        heartEffect: {
          center: { x: centerX, y: centerY },
          size: heartSize,
        },
      };
    }

    return null;
  }

  private checkPrayer(left: LandmarkPoint[], right: LandmarkPoint[], scale: number): TwoHandResult | null {
    const dWrists = Math.hypot(left[0].x - right[0].x, left[0].y - right[0].y);
    const dIndex = Math.hypot(left[8].x - right[8].x, left[8].y - right[8].y);
    const dMiddle = Math.hypot(left[12].x - right[12].x, left[12].y - right[12].y);
    const dPalm = Math.hypot(left[9].x - right[9].x, left[9].y - right[9].y);

    const leftUpright = left[12].y < left[0].y - 0.45 * scale;
    const rightUpright = right[12].y < right[0].y - 0.45 * scale;

    // In Namaste, palms and fingers are pressed together upright
    if (
      leftUpright &&
      rightUpright &&
      dWrists < 0.95 * scale &&
      dPalm < 0.75 * scale &&
      (dIndex < 0.75 * scale || dMiddle < 0.75 * scale)
    ) {
      return {
        prediction: {
          label: 'Namaste / Prayer (Welcome 🙏)',
          confidence: 0.97,
          threshold: 0.70,
          isUnknown: false,
          timestamp: Date.now(),
        },
        gestureId: 'namaste-prayer',
        prayerEffect: {
          center: { x: (left[9].x + right[9].x) / 2, y: (left[9].y + right[9].y) / 2 },
          size: scale * 1.4,
        },
      };
    }

    return null;
  }

  private checkBothHandsUp(left: LandmarkPoint[], right: LandmarkPoint[], scale: number): TwoHandResult | null {
    const dWrists = Math.hypot(left[0].x - right[0].x, left[0].y - right[0].y);

    // Tips point upwards relative to MCP knuckles
    const leftTipsUp =
      left[8].y < left[5].y &&
      left[12].y < left[9].y &&
      left[16].y < left[13].y;
    const rightTipsUp =
      right[8].y < right[5].y &&
      right[12].y < right[9].y &&
      right[16].y < right[13].y;

    // Both hands held upright above wrists, separated across chest
    const leftAboveWrist = left[12].y < left[0].y - 0.25 * scale;
    const rightAboveWrist = right[12].y < right[0].y - 0.25 * scale;

    if (leftTipsUp && rightTipsUp && leftAboveWrist && rightAboveWrist && dWrists > 1.0 * scale) {
      return {
        prediction: {
          label: 'Both Hands Up (Celebrate 🙌)',
          confidence: 0.96,
          threshold: 0.70,
          isUnknown: false,
          timestamp: Date.now(),
        },
        gestureId: 'both-hands-up',
      };
    }

    return null;
  }
}

export const twoHandTracker = new TwoHandGestureTracker();
