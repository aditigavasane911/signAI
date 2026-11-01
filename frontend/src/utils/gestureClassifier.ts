import type { LandmarkPoint, RecognitionPrediction } from '../types';
import { ISL_MODEL } from '../data/islModelData';
import { PHRASES_MODEL } from '../data/phrasesModelData';

/**
 * Calculates Euclidean distance between two 3D or 2D points
 */
export function distance(p1: LandmarkPoint, p2: LandmarkPoint): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Checks whether a finger is extended based on tip vs PIP distance from wrist
 */
function isFingerExtended(wrist: LandmarkPoint, mcp: LandmarkPoint, pip: LandmarkPoint, tip: LandmarkPoint): boolean {
  const tipDist = distance(wrist, tip);
  const pipDist = distance(wrist, pip);
  const mcpDist = distance(wrist, mcp);
  return tipDist > pipDist * 1.05 && tipDist > mcpDist * 1.1;
}

/**
 * Checks whether a finger is curled inward toward the palm
 */
function isFingerCurled(wrist: LandmarkPoint, mcp: LandmarkPoint, pip: LandmarkPoint, tip: LandmarkPoint): boolean {
  const tipDist = distance(wrist, tip);
  const pipDist = distance(wrist, pip);
  return tipDist <= pipDist * 1.2 || distance(mcp, tip) < distance(mcp, pip) * 1.25;
}

/**
 * Normalizes 21 landmark points relative to wrist and palm scale
 */
export function getNormalizedFeatures(landmarks: LandmarkPoint[]): number[] {
  if (!landmarks || landmarks.length < 21) return [];
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  const scale = distance(wrist, middleMcp) || 1.0;
  
  const feats: number[] = [];
  for (let i = 0; i < 21; i++) {
    const p = landmarks[i];
    feats.push(
      (p.x - wrist.x) / scale,
      (p.y - wrist.y) / scale,
      ((p.z || 0) - (wrist.z || 0)) / scale
    );
  }
  return feats;
}

/**
 * Computes min Euclidean distance between features and centroid, checking both normal
 * and horizontally mirrored features (to support both left and right hand signing).
 */
function computeCentroidDistance(feats: number[], centroid: number[]): number {
  let sumSq = 0;
  let sumSqFlipped = 0;
  const len = Math.min(feats.length, centroid.length);
  for (let i = 0; i < len; i++) {
    const isX = (i % 3 === 0);
    const f = feats[i];
    const fFlip = isX ? -f : f;
    const c = centroid[i];
    sumSq += (f - c) * (f - c);
    sumSqFlipped += (fFlip - c) * (fFlip - c);
  }
  return Math.sqrt(Math.min(sumSq, sumSqFlipped));
}

/**
 * Classifies against trained ISL Alphabet centroids
 */
export function classifyISLAlphabet(landmarks: LandmarkPoint[]): { label: string; confidence: number; letter: string } | null {
  const feats = getNormalizedFeatures(landmarks);
  if (feats.length !== 63) return null;

  let minDistance = Infinity;
  let bestClass = '';

  for (const [cls, centroid] of Object.entries(ISL_MODEL.centroids)) {
    const dist = computeCentroidDistance(feats, centroid);
    if (dist < minDistance) {
      minDistance = dist;
      bestClass = cls;
    }
  }

  if (!bestClass) return null;
  // Scaled for ISL alphabet centroid distribution
  const confidence = Math.max(0, Math.min(0.97, 1.02 - (minDistance / 2.8)));
  return { label: `ISL: ${bestClass}`, confidence, letter: bestClass };
}

/**
 * Classifies against trained Phrase centroids
 */
export function classifyPhrase(landmarks: LandmarkPoint[]): { label: string; confidence: number; phraseKey: string } | null {
  const feats = getNormalizedFeatures(landmarks);
  if (feats.length !== 63) return null;

  let minDistance = Infinity;
  let bestClass = '';

  for (const [cls, centroid] of Object.entries(PHRASES_MODEL.centroids)) {
    const dist = computeCentroidDistance(feats, centroid);
    if (dist < minDistance) {
      minDistance = dist;
      bestClass = cls;
    }
  }

  if (!bestClass) return null;
  // Scaled for Phrase dataset centroid distribution
  const confidence = Math.max(0, Math.min(0.97, 1.02 - (minDistance / 3.8)));
  const meta = PHRASES_MODEL.metadata[bestClass];
  const displayName = meta ? meta.name : bestClass.toUpperCase();
  return { label: `Phrase: ${displayName}`, confidence, phraseKey: bestClass };
}

export type RecognitionMode = 'simplified' | 'gestures' | 'phrases' | 'isl' | 'auto';

/**
 * Counts how many fingers are extended on the hand
 */
export function countExtendedFingers(landmarks: LandmarkPoint[]): number {
  if (!landmarks || landmarks.length < 21) return 0;
  const wrist = landmarks[0];
  let count = 0;
  if (distance(wrist, landmarks[4]) > distance(wrist, landmarks[2]) * 1.15) count++;
  if (isFingerExtended(wrist, landmarks[5], landmarks[6], landmarks[8])) count++;
  if (isFingerExtended(wrist, landmarks[9], landmarks[10], landmarks[12])) count++;
  if (isFingerExtended(wrist, landmarks[13], landmarks[14], landmarks[16])) count++;
  if (isFingerExtended(wrist, landmarks[17], landmarks[18], landmarks[20])) count++;
  return count;
}

/**
 * Classifies 21 3D landmarks into gestures, phrases, or ISL alphabet based on the active mode.
 */
export function classifyHandLandmarks(
  landmarks: LandmarkPoint[],
  mode: RecognitionMode = 'simplified',
  threshold = 0.70
): RecognitionPrediction {
  const now = Date.now();

  if (!landmarks || landmarks.length < 21) {
    return {
      label: 'Unknown',
      confidence: 0,
      threshold,
      isUnknown: true,
      timestamp: now,
    };
  }

  // 1. Explicit Phrases mode: focuses specifically on the 44 trained conversational phrases
  if (mode === 'phrases') {
    const phrasePrediction = classifyPhrase(landmarks);
    if (phrasePrediction && phrasePrediction.confidence >= threshold) {
      return {
        label: phrasePrediction.label,
        confidence: Number(phrasePrediction.confidence.toFixed(2)),
        threshold,
        isUnknown: false,
        timestamp: now,
      };
    }
    return {
      label: 'Unknown',
      confidence: Number((phrasePrediction?.confidence || 0).toFixed(2)),
      threshold,
      isUnknown: true,
      timestamp: now,
    };
  }

  // 2. Explicit ISL Alphabet mode: focuses specifically on the 23 ISL alphabet letters
  if (mode === 'isl') {
    const islPrediction = classifyISLAlphabet(landmarks);
    if (islPrediction && islPrediction.confidence >= threshold) {
      return {
        label: islPrediction.label,
        confidence: Number(islPrediction.confidence.toFixed(2)),
        threshold,
        isUnknown: false,
        timestamp: now,
      };
    }
    return {
      label: 'Unknown',
      confidence: Number((islPrediction?.confidence || 0).toFixed(2)),
      threshold,
      isUnknown: true,
      timestamp: now,
    };
  }

  // Geometric heuristics for Everyday & Core Gestures
  const wrist = landmarks[0];

  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const thumbMcp = landmarks[2];

  const indexTip = landmarks[8];
  const indexPip = landmarks[6];
  const indexMcp = landmarks[5];

  const middleTip = landmarks[12];
  const middlePip = landmarks[10];
  const middleMcp = landmarks[9];

  const ringTip = landmarks[16];
  const ringPip = landmarks[14];
  const ringMcp = landmarks[13];

  const pinkyTip = landmarks[20];
  const pinkyPip = landmarks[18];
  const pinkyMcp = landmarks[17];

  const thumbExtended = distance(wrist, thumbTip) > distance(wrist, thumbMcp) * 1.15;
  const indexExtended = isFingerExtended(wrist, indexMcp, indexPip, indexTip);
  const middleExtended = isFingerExtended(wrist, middleMcp, middlePip, middleTip);
  const ringExtended = isFingerExtended(wrist, ringMcp, ringPip, ringTip);
  const pinkyExtended = isFingerExtended(wrist, pinkyMcp, pinkyPip, pinkyTip);

  const indexCurled = isFingerCurled(wrist, indexMcp, indexPip, indexTip);
  const middleCurled = isFingerCurled(wrist, middleMcp, middlePip, middleTip);
  const ringCurled = isFingerCurled(wrist, ringMcp, ringPip, ringTip);
  const pinkyCurled = isFingerCurled(wrist, pinkyMcp, pinkyPip, pinkyTip);

  const thumbIndexTipDist = distance(thumbTip, indexTip);
  const palmScale = distance(wrist, middleMcp) || 1;
  const normalizedThumbIndexDist = thumbIndexTipDist / palmScale;

  let coreLabel = 'Unknown';
  let coreConfidence = 0.50;

  const thumbPointingUp = thumbTip.y < thumbMcp.y && thumbTip.y < thumbIp.y;
  const thumbPointingDown = thumbTip.y > thumbMcp.y + 0.03 && thumbTip.y > thumbIp.y;
  const thumbHigherThanFingers = thumbTip.y < indexTip.y && thumbTip.y < middleTip.y;
  const fourFingersCurled = indexCurled && middleCurled && ringCurled && pinkyCurled;

  // 1. Thumbs Up
  if (thumbExtended && fourFingersCurled && (thumbPointingUp || thumbHigherThanFingers)) {
    coreLabel = mode === 'simplified' ? 'Thumbs Up (Good! 👍)' : 'Thumbs Up';
    coreConfidence = 0.96;
  }
  // 2. Thumbs Down (New everyday gesture)
  else if (thumbExtended && fourFingersCurled && thumbPointingDown) {
    coreLabel = mode === 'simplified' ? 'Thumbs Down (No / Dislike 👎)' : 'Thumbs Down 👎';
    coreConfidence = 0.96;
  }
  // 3. I Love You / Rock On (Thumb + Index + Pinky)
  else if (thumbExtended && indexExtended && pinkyExtended && middleCurled && ringCurled) {
    coreLabel = mode === 'simplified' ? 'Love / Rock On 🤟' : 'Love 🤟';
    coreConfidence = 0.95;
  }
  // 4. OK Ring
  else if (normalizedThumbIndexDist < 0.35 && middleExtended && ringExtended) {
    coreLabel = mode === 'simplified' ? 'OK Sign (Perfect 👌)' : 'OK Ring';
    coreConfidence = Math.min(0.98, 0.85 + (0.35 - normalizedThumbIndexDist));
  }
  // 5. Open Palm (Stop / Wait)
  else if (indexExtended && middleExtended && ringExtended && pinkyExtended && thumbExtended) {
    coreLabel = mode === 'simplified' ? 'Open Palm (Stop / Wait ✋)' : 'Open Palm';
    coreConfidence = 0.96;
  }
  // 6. Three Fingers
  else if (indexExtended && middleExtended && ringExtended && pinkyCurled) {
    coreLabel = mode === 'simplified' ? 'Three Fingers 3️⃣' : 'Three Fingers';
    coreConfidence = 0.93;
  }
  // 7. Peace / V
  else if (indexExtended && middleExtended && ringCurled && pinkyCurled) {
    coreLabel = mode === 'simplified' ? 'Peace / Victory ✌️' : 'Peace / V';
    coreConfidence = 0.95;
  }
  // 8. Point Up
  else if (indexExtended && middleCurled && ringCurled && pinkyCurled) {
    coreLabel = mode === 'simplified' ? 'Point Up (One / Look ☝️)' : 'Point Up';
    coreConfidence = 0.94;
  }
  // 9. Call Me / Shaka
  else if (thumbExtended && pinkyExtended && indexCurled && middleCurled && ringCurled) {
    coreLabel = mode === 'simplified' ? 'Call Me / Shaka 🤙' : 'Call Me / Shaka';
    coreConfidence = 0.93;
  }
  // 10. Closed Fist
  else if (indexCurled && middleCurled && ringCurled && pinkyCurled && !thumbPointingUp && !thumbPointingDown) {
    coreLabel = mode === 'simplified' ? 'Closed Fist (Power ✊)' : 'Closed Fist';
    coreConfidence = 0.94;
  }

  // 3. Explicit Simplified or Core Gestures mode
  if (mode === 'simplified' || mode === 'gestures') {
    const isUnknown = coreConfidence < threshold || coreLabel === 'Unknown';
    return {
      label: isUnknown ? 'Unknown' : coreLabel,
      confidence: Number(coreConfidence.toFixed(2)),
      threshold,
      isUnknown,
      timestamp: now,
    };
  }

  // 4. Auto mode: Intelligent Multi-Model Arbitration
  const phrasePrediction = classifyPhrase(landmarks);
  const islPrediction = classifyISLAlphabet(landmarks);

  let finalLabel = coreLabel;
  let finalConfidence = coreConfidence;

  // If a distinct core gesture is detected with high confidence (>= 0.88), prioritize it
  if (coreLabel !== 'Unknown' && coreConfidence >= 0.88) {
    finalLabel = coreLabel;
    finalConfidence = coreConfidence;
  } else if (phrasePrediction && phrasePrediction.confidence >= 0.78) {
    finalLabel = phrasePrediction.label;
    finalConfidence = phrasePrediction.confidence;
  } else if (islPrediction && islPrediction.confidence >= 0.78) {
    finalLabel = islPrediction.label;
    finalConfidence = islPrediction.confidence;
  } else if (coreLabel !== 'Unknown') {
    finalLabel = coreLabel;
    finalConfidence = coreConfidence;
  } else if (phrasePrediction && phrasePrediction.confidence >= threshold) {
    finalLabel = phrasePrediction.label;
    finalConfidence = phrasePrediction.confidence;
  } else if (islPrediction && islPrediction.confidence >= threshold) {
    finalLabel = islPrediction.label;
    finalConfidence = islPrediction.confidence;
  }

  const isUnknown = finalConfidence < threshold || finalLabel === 'Unknown';

  return {
    label: isUnknown ? 'Unknown' : finalLabel,
    confidence: Number(finalConfidence.toFixed(2)),
    threshold,
    isUnknown,
    timestamp: now,
  };
}
