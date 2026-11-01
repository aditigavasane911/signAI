export interface Gesture {
  id: string;
  name: string;
  shortDescription: string;
  detailedDescription?: string;
  howToSign: string;
  svgShape: 'open_palm' | 'closed_fist' | 'point_up' | 'peace_v' | 'thumbs_up' | 'ok_ring' | 'call_me' | 'three_fingers' | string;
  tags?: string[];
  defaultConfidence?: number;
  category?: 'core' | 'phrase' | 'isl' | string;
  twoHanded?: boolean;
}

export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

export interface RecognitionPrediction {
  label: string;
  confidence: number;
  threshold: number;
  isUnknown: boolean;
  timestamp: number;
}

export interface StudioOptions {
  isMirrored: boolean;
  showOverlay: boolean;
  confidenceThreshold: number;
  historyOptIn: boolean;
}
