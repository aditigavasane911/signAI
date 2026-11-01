/**
 * SignAI Backend API Client
 * Facilitates communication with the Python FastAPI backend service
 */

import type { LandmarkPoint, RecognitionPrediction } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export interface BackendHealthResponse {
  status: string;
  models_loaded: boolean;
  isl_classes_count: number;
  phrases_classes_count: number;
  timestamp: string;
}

export interface BackendPredictionResponse {
  predicted_label: string;
  confidence: number;
  status: 'match' | 'unknown';
  distance?: number;
  top_predictions: Array<{
    label: string;
    confidence: number;
    distance: number;
  }>;
  feature_count: number;
}

export interface BackendPhraseResponse {
  predicted_phrase: string;
  confidence: number;
  status: 'match' | 'unknown';
  hand_count: number;
}

export interface ModelMetadata {
  isl_classes: string[];
  phrase_classes: string[];
  total_isl_classes: number;
  total_phrase_classes: number;
  isl_trained_date: string;
  phrases_trained_date: string;
}

/**
 * Check if the backend FastAPI service is running and models are loaded
 */
export async function checkBackendHealth(): Promise<BackendHealthResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Send normalized 3D hand landmarks to the backend for centroid-based classification
 */
export async function classifyLandmarksRemote(
  landmarks: LandmarkPoint[],
  numHands = 1,
  mode = 'isl'
): Promise<RecognitionPrediction | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/gestures/classify-landmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        landmarks,
        num_hands: numHands,
        mode,
      }),
    });

    if (!res.ok) return null;
    const data: BackendPredictionResponse = await res.json();

    return {
      label: data.predicted_label,
      confidence: data.confidence,
      threshold: 0.7,
      isUnknown: data.status === 'unknown',
      timestamp: Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Send two-hand or sequential landmarks to the backend for phrase classification
 */
export async function classifyPhraseRemote(
  landmarks: LandmarkPoint[][],
  handCount = 2
): Promise<BackendPhraseResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/phrases/classify-landmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        landmarks,
        hand_count: handCount,
      }),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch trained model metadata and class counts from backend
 */
export async function fetchModelInfo(): Promise<ModelMetadata | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/models/info`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
