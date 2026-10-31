import type { LandmarkPoint, RecognitionPrediction } from '../types';
import { distance } from './gestureClassifier';

interface PositionSample {
  x: number;
  y: number;
  timestamp: number;
}

export class MotionGestureTracker {
  // Hand tracking history
  private handHistory: PositionSample[] = [];
  private lastWaveTimestamp = 0;
  private waveCount = 0;

  // Face tracking history
  private faceHistory: PositionSample[] = [];
  private lastNodTimestamp = 0;
  private lastShakeTimestamp = 0;
  private smileStreak = 0;
  public isSmiling = false;

  // Most recent detected motion/face prediction
  private activePrediction: RecognitionPrediction | null = null;
  private activePredictionExpires = 0;

  public reset() {
    this.handHistory = [];
    this.faceHistory = [];
    this.activePrediction = null;
    this.activePredictionExpires = 0;
  }

  /**
   * Updates hand tracking and evaluates dynamic hand waving & special everyday gestures
   */
  public updateHand(
    landmarks: LandmarkPoint[] | null,
    fingersExtendedCount: number = 0
  ): RecognitionPrediction | null {
    const now = Date.now();

    // Check if current cached motion prediction is still fresh (within 800ms display window)
    if (this.activePrediction && now < this.activePredictionExpires) {
      return this.activePrediction;
    }

    if (!landmarks || landmarks.length < 21) {
      this.handHistory = [];
      return null;
    }

    const wrist = landmarks[0];
    const middleMcp = landmarks[9];
    const palmCenter = {
      x: (wrist.x + middleMcp.x) / 2,
      y: (wrist.y + middleMcp.y) / 2,
      timestamp: now,
    };

    this.handHistory.push(palmCenter);
    // Keep last 30 frames (~1.0 second)
    if (this.handHistory.length > 30) {
      this.handHistory.shift();
    }

    // 1. Detect Hand Waving (Hi / Bye)
    // Requirements: Hand is raised (y < 0.82), at least 3 fingers extended, side-to-side oscillation
    if (wrist.y < 0.85 && fingersExtendedCount >= 3 && this.handHistory.length >= 12) {
      if (now - this.lastWaveTimestamp > 1200) {
        const xs = this.handHistory.map((h) => h.x);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const spanX = maxX - minX;

        // Count horizontal direction changes
        let dirChanges = 0;
        let lastDir = 0;
        for (let i = 1; i < this.handHistory.length; i++) {
          const diff = this.handHistory[i].x - this.handHistory[i - 1].x;
          if (Math.abs(diff) > 0.005) {
            const currentDir = diff > 0 ? 1 : -1;
            if (lastDir !== 0 && currentDir !== lastDir) {
              dirChanges++;
            }
            lastDir = currentDir;
          }
        }

        // At least 2 direction reversals and noticeable horizontal sweep
        if (dirChanges >= 2 && spanX >= 0.055) {
          this.lastWaveTimestamp = now;
          this.waveCount++;
          // Alternate between Hi and Bye or give conversational feel
          const waveLabel = this.waveCount % 2 === 1 ? 'Hand Wave (Hi! 👋)' : 'Hand Wave (Bye! 👋)';
          
          this.activePrediction = {
            label: waveLabel,
            confidence: 0.96,
            threshold: 0.70,
            isUnknown: false,
            timestamp: now,
          };
          this.activePredictionExpires = now + 900;
          this.handHistory = [];
          return this.activePrediction;
        }
      }
    }

    return null;
  }

  /**
   * Updates face tracking and evaluates nodding (Yes), head shaking (No), and smiling
   */
  public updateFace(faceLandmarks: LandmarkPoint[] | null): RecognitionPrediction | null {
    const now = Date.now();

    if (this.activePrediction && now < this.activePredictionExpires) {
      return this.activePrediction;
    }

    if (!faceLandmarks || faceLandmarks.length < 300) {
      this.faceHistory = [];
      this.smileStreak = 0;
      return null;
    }

    const nose = faceLandmarks[1]; // Nose tip
    if (!nose) return null;

    this.faceHistory.push({
      x: nose.x,
      y: nose.y,
      timestamp: now,
    });

    if (this.faceHistory.length > 30) {
      this.faceHistory.shift();
    }

    // 1. Evaluate Smile
    const leftMouth = faceLandmarks[61];
    const rightMouth = faceLandmarks[291];
    const leftEye = faceLandmarks[33];
    const rightEye = faceLandmarks[263];
    const upperLip = faceLandmarks[13];

    if (leftMouth && rightMouth && leftEye && rightEye && upperLip) {
      const mouthWidth = distance(leftMouth, rightMouth);
      const eyeWidth = distance(leftEye, rightEye);
      const ratio = eyeWidth > 0 ? mouthWidth / eyeWidth : 0;
      const cornerLift = upperLip.y - (leftMouth.y + rightMouth.y) / 2;

      // Elevated corners and wide mouth indicates a clear smile
      this.isSmiling = ratio >= 0.75 && cornerLift > -0.018;

      if (this.isSmiling) {
        this.smileStreak++;
        if (this.smileStreak >= 5) {
          this.activePrediction = {
            label: 'Smile (Happy 😊)',
            confidence: 0.94,
            threshold: 0.70,
            isUnknown: false,
            timestamp: now,
          };
          this.activePredictionExpires = now + 900;
          this.smileStreak = 0;
          return this.activePrediction;
        }
      } else {
        this.smileStreak = Math.max(0, this.smileStreak - 1);
      }
    }

    if (this.faceHistory.length < 12) return null;

    // 2. Evaluate Head Nod (Yes / Agree)
    // Characterized by prominent vertical oscillation (dy) with minimal horizontal movement (dx)
    if (now - this.lastNodTimestamp > 1200) {
      const ys = this.faceHistory.map((h) => h.y);
      const xs = this.faceHistory.map((h) => h.x);
      const spanY = Math.max(...ys) - Math.min(...ys);
      const spanX = Math.max(...xs) - Math.min(...xs);

      let verticalReversals = 0;
      let lastVDir = 0;
      for (let i = 1; i < this.faceHistory.length; i++) {
        const diff = this.faceHistory[i].y - this.faceHistory[i - 1].y;
        if (Math.abs(diff) > 0.003) {
          const vDir = diff > 0 ? 1 : -1;
          if (lastVDir !== 0 && vDir !== lastVDir) {
            verticalReversals++;
          }
          lastVDir = vDir;
        }
      }

      if (verticalReversals >= 2 && spanY >= 0.022 && spanX <= 0.04) {
        this.lastNodTimestamp = now;
        this.activePrediction = {
          label: 'Head Nod (Yes / Agree 🟢)',
          confidence: 0.95,
          threshold: 0.70,
          isUnknown: false,
          timestamp: now,
        };
        this.activePredictionExpires = now + 900;
        this.faceHistory = [];
        return this.activePrediction;
      }
    }

    // 3. Evaluate Head Shake (No / Disagree)
    // Characterized by prominent horizontal oscillation (dx) with minimal vertical movement (dy)
    if (now - this.lastShakeTimestamp > 1200) {
      const xs = this.faceHistory.map((h) => h.x);
      const ys = this.faceHistory.map((h) => h.y);
      const spanX = Math.max(...xs) - Math.min(...xs);
      const spanY = Math.max(...ys) - Math.min(...ys);

      let horizontalReversals = 0;
      let lastHDir = 0;
      for (let i = 1; i < this.faceHistory.length; i++) {
        const diff = this.faceHistory[i].x - this.faceHistory[i - 1].x;
        if (Math.abs(diff) > 0.003) {
          const hDir = diff > 0 ? 1 : -1;
          if (lastHDir !== 0 && hDir !== lastHDir) {
            horizontalReversals++;
          }
          lastHDir = hDir;
        }
      }

      if (horizontalReversals >= 2 && spanX >= 0.025 && spanY <= 0.04) {
        this.lastShakeTimestamp = now;
        this.activePrediction = {
          label: 'Head Shake (No / Disagree 🔴)',
          confidence: 0.95,
          threshold: 0.70,
          isUnknown: false,
          timestamp: now,
        };
        this.activePredictionExpires = now + 900;
        this.faceHistory = [];
        return this.activePrediction;
      }
    }

    return null;
  }
}

export const motionTracker = new MotionGestureTracker();
