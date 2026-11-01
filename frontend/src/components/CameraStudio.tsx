import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, CameraOff, Pause, Play, FlipHorizontal, Eye, EyeOff, Copy, Download, Trash2, RotateCcw, AlertTriangle, Check, Sparkles, BookOpen } from 'lucide-react';
import { EVERYDAY_GESTURES, SUPPORTED_GESTURES } from '../data/gestures';
import { ISL_MODEL } from '../data/islModelData';
import { PHRASES_MODEL } from '../data/phrasesModelData';
import { classifyHandLandmarks, countExtendedFingers, type RecognitionMode } from '../utils/gestureClassifier';
import { drawHandLandmarks, drawHeartEffect, drawPrayerEffect } from '../utils/handMeshRenderer';
import { drawFaceLandmarks, getSimulatedFaceLandmarks } from '../utils/faceMeshRenderer';
import { motionTracker } from '../utils/motionGestureTracker';
import { twoHandTracker } from '../utils/twoHandGestureTracker';
import type { LandmarkPoint, RecognitionPrediction } from '../types';

// Helper to dynamically load a script from CDN if not already loaded in document
function loadMediaPipeScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

// Ensure window.Holistic, window.Hands, or window.FaceMesh exists before starting detection
async function ensureMediaPipeLoaded(timeoutMs = 6000): Promise<{ holisticReady: boolean; handsReady: boolean; faceReady: boolean }> {
  const startTime = Date.now();

  const check = () => ({
    holisticReady: typeof (window as any).Holistic !== 'undefined',
    handsReady: typeof (window as any).Hands !== 'undefined',
    faceReady: typeof (window as any).FaceMesh !== 'undefined',
  });

  let state = check();
  if (state.holisticReady || (state.handsReady && state.faceReady)) return state;

  // Proactively inject script tags if missing
  if (!state.holisticReady) {
    loadMediaPipeScript('https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js');
  }
  if (!state.handsReady) {
    loadMediaPipeScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
  }
  if (!state.faceReady) {
    loadMediaPipeScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
  }

  while (Date.now() - startTime < timeoutMs) {
    state = check();
    if (state.holisticReady || (state.handsReady && state.faceReady)) return state;
    await new Promise((r) => setTimeout(r, 100));
  }

  // Fallback to unpkg if jsdelivr timed out
  state = check();
  if (!state.holisticReady) {
    await loadMediaPipeScript('https://unpkg.com/@mediapipe/holistic/holistic.js');
  }
  if (!state.handsReady) {
    await loadMediaPipeScript('https://unpkg.com/@mediapipe/hands/hands.js');
  }

  return check();
}

export const CameraStudio: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // MediaPipe Holistic (unified dual-hand + face mesh) & fallback instances
  const mediaPipeHolisticRef = useRef<any>(null);
  const mediaPipeHandsRef = useRef<any>(null);
  const mediaPipeFaceRef = useRef<any>(null);
  const isProcessingRef = useRef(false);
  const lastProcessTimeRef = useRef(0);

  const [cameraActive, setCameraActive] = useState(false);
  const cameraActiveRef = useRef(false);

  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);

  // Default mode: simplified (Everyday & Face gestures)
  const [recognitionMode, setRecognitionMode] = useState<RecognitionMode>('simplified');
  const recognitionModeRef = useRef<RecognitionMode>('simplified');

  const [isMirrored, setIsMirrored] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [sandboxTab, setSandboxTab] = useState<'simplified' | 'gestures' | 'isl' | 'phrases'>('simplified');
  const [statusMessage, setStatusMessage] = useState('Camera is off. Video is processed on your device — only anonymous landmark numbers reach our server.');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Recognition states
  const [currentPrediction, setCurrentPrediction] = useState<RecognitionPrediction>({
    label: '—',
    confidence: 0,
    threshold: 0.70,
    isUnknown: true,
    timestamp: Date.now(),
  });

  const [sequence, setSequence] = useState<string[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeSimulatedGesture, setActiveSimulatedGesture] = useState<string | null>(null);

  // Live Multimodal Detection State (Face, Hand 1, Hand 2)
  const [trackingStatus, setTrackingStatus] = useState<{
    face: boolean;
    handCount: number;
    isSmiling: boolean;
    allDetected: boolean;
  }>({
    face: false,
    handCount: 0,
    isSmiling: false,
    allDetected: false,
  });

  const lastStatusRef = useRef({ face: false, handCount: 0, isSmiling: false });

  const updateTrackingHUD = useCallback((face: boolean, handCount: number, isSmiling: boolean) => {
    const last = lastStatusRef.current;
    if (last.face !== face || last.handCount !== handCount || last.isSmiling !== isSmiling) {
      lastStatusRef.current = { face, handCount, isSmiling };
      setTrackingStatus({
        face,
        handCount,
        isSmiling,
        allDetected: face && handCount >= 2,
      });
    }
  }, []);

  // Stable sequence accumulator
  const stableCountRef = useRef(0);
  const candidateSignRef = useRef<string | null>(null);
  const lastCommittedSignRef = useRef<string | null>(null);

  // Landmarks to render on canvas
  const currentSimulatedPointsRef = useRef<LandmarkPoint[] | null>(null);
  const currentHandsListRef = useRef<LandmarkPoint[][]>([]);
  const currentFacePointsRef = useRef<LandmarkPoint[] | null>(null);
  const activeHeartEffectRef = useRef<{ center: { x: number; y: number }; size: number } | null>(null);
  const activePrayerEffectRef = useRef<{ center: { x: number; y: number }; size: number } | null>(null);

  // Sync ref with states
  useEffect(() => {
    cameraActiveRef.current = cameraActive;
  }, [cameraActive]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    recognitionModeRef.current = recognitionMode;
  }, [recognitionMode]);

  const handleModeChange = (mode: RecognitionMode) => {
    setRecognitionMode(mode);
    if (mode === 'simplified') setSandboxTab('simplified');
    else if (mode === 'phrases') setSandboxTab('phrases');
    else if (mode === 'isl') setSandboxTab('isl');
    else if (mode === 'gestures') setSandboxTab('gestures');
    setStatusMessage(
      `Recognition target: ${
        mode === 'simplified'
          ? '🌟 Everyday & Face (Nodding, Waving, Hi/Bye, Smile, Thumbs Up/Down)'
          : mode === 'phrases'
          ? 'Conversational Phrases (44 ISL Classes)'
          : mode === 'isl'
          ? 'ISL Alphabet (23 Letters)'
          : mode === 'gestures'
          ? '8 Core Gestures'
          : 'Smart Auto (Multi-Model)'
      }`
    );
  };

  const handleSandboxTabChange = (tab: 'simplified' | 'gestures' | 'isl' | 'phrases') => {
    setSandboxTab(tab);
    setRecognitionMode(tab === 'simplified' ? 'simplified' : tab);
    setStatusMessage(
      `Active target set to ${
        tab === 'simplified'
          ? '🌟 Everyday & Face Gestures (Nodding, Waving, Hi/Bye, Smile, Thumbs)'
          : tab === 'phrases'
          ? 'Conversational Phrases (44 Classes)'
          : tab === 'isl'
          ? 'ISL Alphabet (23 Letters)'
          : 'Core Gestures (8 Classes)'
      }`
    );
  };

  // Helper to generate coordinates for a gesture or ISL sign
  const getGestureCoordinates = useCallback((shape: string): LandmarkPoint[] => {
    // Check if it is an ISL alphabet class
    if (shape.startsWith('isl_')) {
      const letter = shape.replace('isl_', '');
      const centroid = ISL_MODEL.centroids[letter];
      if (centroid && centroid.length === 63) {
        const points: LandmarkPoint[] = [];
        for (let i = 0; i < 21; i++) {
          points.push({
            x: 0.5 + centroid[i * 3] * 0.28,
            y: 0.62 + centroid[i * 3 + 1] * 0.28,
            z: centroid[i * 3 + 2] * 0.28,
          });
        }
        return points;
      }
    }

    // Check if it is a trained phrase class
    if (shape.startsWith('phrase_')) {
      const phraseKey = shape.replace('phrase_', '');
      const centroid = PHRASES_MODEL.centroids[phraseKey];
      if (centroid && centroid.length === 63) {
        const points: LandmarkPoint[] = [];
        for (let i = 0; i < 21; i++) {
          points.push({
            x: 0.5 + centroid[i * 3] * 0.28,
            y: 0.62 + centroid[i * 3 + 1] * 0.28,
            z: centroid[i * 3 + 2] * 0.28,
          });
        }
        return points;
      }
    }

    // Generate normalized 21 keypoints
    const basePoints: LandmarkPoint[] = [
      { x: 0.5, y: 0.85, z: 0 },   // 0 wrist
      { x: 0.38, y: 0.75, z: 0 },  // 1
      { x: 0.30, y: 0.65, z: 0 },  // 2
      { x: 0.25, y: 0.55, z: 0 },  // 3
      { x: 0.20, y: 0.45, z: 0 },  // 4 thumb tip
      { x: 0.40, y: 0.52, z: 0 },  // 5 index MCP
      { x: 0.38, y: 0.38, z: 0 },  // 6
      { x: 0.36, y: 0.26, z: 0 },  // 7
      { x: 0.35, y: 0.15, z: 0 },  // 8 index tip
      { x: 0.50, y: 0.50, z: 0 },  // 9 middle MCP
      { x: 0.50, y: 0.35, z: 0 },  // 10
      { x: 0.50, y: 0.23, z: 0 },  // 11
      { x: 0.50, y: 0.12, z: 0 },  // 12 middle tip
      { x: 0.60, y: 0.53, z: 0 },  // 13 ring MCP
      { x: 0.62, y: 0.39, z: 0 },  // 14
      { x: 0.64, y: 0.28, z: 0 },  // 15
      { x: 0.65, y: 0.18, z: 0 },  // 16 ring tip
      { x: 0.70, y: 0.58, z: 0 },  // 17 pinky MCP
      { x: 0.74, y: 0.46, z: 0 },  // 18
      { x: 0.76, y: 0.36, z: 0 },  // 19
      { x: 0.78, y: 0.28, z: 0 },  // 20 pinky tip
    ];

    if (shape === 'closed_fist') {
      basePoints[4] = { x: 0.45, y: 0.55, z: 0 };
      basePoints[8] = { x: 0.42, y: 0.56, z: 0 };
      basePoints[12] = { x: 0.50, y: 0.55, z: 0 };
      basePoints[16] = { x: 0.58, y: 0.56, z: 0 };
      basePoints[20] = { x: 0.66, y: 0.58, z: 0 };
    } else if (shape === 'point_up') {
      basePoints[4] = { x: 0.44, y: 0.56, z: 0 };
      basePoints[12] = { x: 0.50, y: 0.55, z: 0 };
      basePoints[16] = { x: 0.58, y: 0.56, z: 0 };
      basePoints[20] = { x: 0.66, y: 0.58, z: 0 };
    } else if (shape === 'peace_v') {
      basePoints[4] = { x: 0.44, y: 0.56, z: 0 };
      basePoints[8] = { x: 0.38, y: 0.16, z: 0 };
      basePoints[12] = { x: 0.62, y: 0.16, z: 0 };
      basePoints[16] = { x: 0.58, y: 0.56, z: 0 };
      basePoints[20] = { x: 0.66, y: 0.58, z: 0 };
    } else if (shape === 'thumbs_up') {
      basePoints[4] = { x: 0.45, y: 0.18, z: 0 };
      basePoints[8] = { x: 0.42, y: 0.56, z: 0 };
      basePoints[12] = { x: 0.50, y: 0.55, z: 0 };
      basePoints[16] = { x: 0.58, y: 0.56, z: 0 };
      basePoints[20] = { x: 0.66, y: 0.58, z: 0 };
    } else if (shape === 'ok_ring') {
      basePoints[4] = { x: 0.42, y: 0.42, z: 0 };
      basePoints[8] = { x: 0.42, y: 0.42, z: 0 };
    } else if (shape === 'call_me') {
      basePoints[4] = { x: 0.18, y: 0.48, z: 0 };
      basePoints[8] = { x: 0.42, y: 0.56, z: 0 };
      basePoints[12] = { x: 0.50, y: 0.55, z: 0 };
      basePoints[16] = { x: 0.58, y: 0.56, z: 0 };
      basePoints[20] = { x: 0.82, y: 0.45, z: 0 };
    } else if (shape === 'three_fingers') {
      basePoints[4] = { x: 0.48, y: 0.56, z: 0 };
      basePoints[20] = { x: 0.66, y: 0.58, z: 0 };
    } else if (shape === 'thumbs_down') {
      basePoints[4] = { x: 0.45, y: 0.88, z: 0 };
      basePoints[8] = { x: 0.42, y: 0.56, z: 0 };
      basePoints[12] = { x: 0.50, y: 0.55, z: 0 };
      basePoints[16] = { x: 0.58, y: 0.56, z: 0 };
      basePoints[20] = { x: 0.66, y: 0.58, z: 0 };
    } else if (shape === 'love_rock') {
      basePoints[4] = { x: 0.20, y: 0.45, z: 0 };
      basePoints[8] = { x: 0.35, y: 0.15, z: 0 };
      basePoints[12] = { x: 0.50, y: 0.55, z: 0 };
      basePoints[16] = { x: 0.58, y: 0.56, z: 0 };
      basePoints[20] = { x: 0.78, y: 0.28, z: 0 };
    }

    return basePoints;
  }, []);

  // Helper to generate coordinates for two-handed gestures
  const getTwoHandCoordinates = useCallback((shape: string): LandmarkPoint[][] | null => {
    if (shape === 'complete_heart' || shape === 'heart_smile' || shape === 'detect_all') {
      const leftHand: LandmarkPoint[] = [
        { x: 0.35, y: 0.70, z: 0 }, // 0 wrist
        { x: 0.38, y: 0.68, z: 0 }, // 1 thumb cmc
        { x: 0.41, y: 0.65, z: 0 }, // 2 thumb mcp
        { x: 0.44, y: 0.63, z: 0 }, // 3 thumb ip
        { x: 0.47, y: 0.62, z: 0 }, // 4 thumb tip
        { x: 0.39, y: 0.52, z: 0 }, // 5 index mcp
        { x: 0.41, y: 0.44, z: 0 }, // 6 index pip
        { x: 0.44, y: 0.38, z: 0 }, // 7 index dip
        { x: 0.48, y: 0.36, z: 0 }, // 8 index tip
        { x: 0.35, y: 0.53, z: 0 }, // 9 middle mcp
        { x: 0.37, y: 0.45, z: 0 }, // 10 middle pip
        { x: 0.40, y: 0.40, z: 0 }, // 11 middle dip
        { x: 0.44, y: 0.38, z: 0 }, // 12 middle tip
        { x: 0.32, y: 0.56, z: 0 }, // 13 ring mcp
        { x: 0.33, y: 0.49, z: 0 }, // 14 ring pip
        { x: 0.35, y: 0.45, z: 0 }, // 15 ring dip
        { x: 0.38, y: 0.43, z: 0 }, // 16 ring tip
        { x: 0.29, y: 0.60, z: 0 }, // 17 pinky mcp
        { x: 0.29, y: 0.54, z: 0 }, // 18 pinky pip
        { x: 0.30, y: 0.50, z: 0 }, // 19 pinky dip
        { x: 0.32, y: 0.48, z: 0 }, // 20 pinky tip
      ];
      const rightHand: LandmarkPoint[] = leftHand.map((pt) => ({
        x: 1.0 - pt.x,
        y: pt.y,
        z: pt.z,
      }));
      return [leftHand, rightHand];
    }

    if (shape === 'namaste_prayer' || shape === 'namaste_smile') {
      const leftHand: LandmarkPoint[] = [
        { x: 0.46, y: 0.70, z: 0 }, // 0
        { x: 0.44, y: 0.66, z: 0 }, // 1
        { x: 0.43, y: 0.62, z: 0 }, // 2
        { x: 0.44, y: 0.58, z: 0 }, // 3
        { x: 0.46, y: 0.55, z: 0 }, // 4
        { x: 0.47, y: 0.55, z: 0 }, // 5
        { x: 0.48, y: 0.46, z: 0 }, // 6
        { x: 0.49, y: 0.38, z: 0 }, // 7
        { x: 0.49, y: 0.30, z: 0 }, // 8
        { x: 0.48, y: 0.55, z: 0 }, // 9
        { x: 0.49, y: 0.45, z: 0 }, // 10
        { x: 0.50, y: 0.36, z: 0 }, // 11
        { x: 0.50, y: 0.28, z: 0 }, // 12
        { x: 0.49, y: 0.56, z: 0 }, // 13
        { x: 0.50, y: 0.47, z: 0 }, // 14
        { x: 0.50, y: 0.39, z: 0 }, // 15
        { x: 0.50, y: 0.32, z: 0 }, // 16
        { x: 0.50, y: 0.58, z: 0 }, // 17
        { x: 0.50, y: 0.51, z: 0 }, // 18
        { x: 0.51, y: 0.45, z: 0 }, // 19
        { x: 0.51, y: 0.38, z: 0 }, // 20
      ];
      const rightHand: LandmarkPoint[] = leftHand.map((pt) => ({
        x: 1.0 - pt.x,
        y: pt.y,
        z: pt.z,
      }));
      return [leftHand, rightHand];
    }

    if (shape === 'both_hands_up' || shape === 'both_hands_smile') {
      const leftHand: LandmarkPoint[] = [
        { x: 0.26, y: 0.78, z: 0 }, // 0 wrist
        { x: 0.20, y: 0.72, z: 0 }, // 1
        { x: 0.16, y: 0.65, z: 0 }, // 2
        { x: 0.14, y: 0.58, z: 0 }, // 3
        { x: 0.12, y: 0.52, z: 0 }, // 4 thumb tip
        { x: 0.22, y: 0.56, z: 0 }, // 5 index MCP
        { x: 0.21, y: 0.46, z: 0 }, // 6
        { x: 0.20, y: 0.38, z: 0 }, // 7
        { x: 0.19, y: 0.30, z: 0 }, // 8 index tip
        { x: 0.26, y: 0.54, z: 0 }, // 9 middle MCP
        { x: 0.26, y: 0.44, z: 0 }, // 10
        { x: 0.26, y: 0.36, z: 0 }, // 11
        { x: 0.26, y: 0.28, z: 0 }, // 12 middle tip
        { x: 0.31, y: 0.56, z: 0 }, // 13 ring MCP
        { x: 0.32, y: 0.46, z: 0 }, // 14
        { x: 0.33, y: 0.38, z: 0 }, // 15
        { x: 0.34, y: 0.32, z: 0 }, // 16 ring tip
        { x: 0.36, y: 0.60, z: 0 }, // 17 pinky MCP
        { x: 0.38, y: 0.52, z: 0 }, // 18
        { x: 0.39, y: 0.45, z: 0 }, // 19
        { x: 0.40, y: 0.40, z: 0 }, // 20 pinky tip
      ];
      const rightHand: LandmarkPoint[] = leftHand.map((pt) => ({
        x: 1.0 - pt.x,
        y: pt.y,
        z: pt.z,
      }));
      return [leftHand, rightHand];
    }

    return null;
  }, []);

  // Handle stable prediction accumulation
  const handleStableSign = useCallback((label: string) => {
    if (isPausedRef.current || label === 'Unknown') return;

    if (label === candidateSignRef.current) {
      stableCountRef.current++;
      // Once held steady for 7 frames (~0.7s)
      if (stableCountRef.current === 7 && label !== lastCommittedSignRef.current) {
        setSequence((prev) => [...prev, label]);
        lastCommittedSignRef.current = label;
      }
    } else {
      candidateSignRef.current = label;
      stableCountRef.current = 1;
    }
  }, []);

  // Start Real Camera with MediaPipe Holistic (Unified Dual-Hand + Face Mesh Tracking)
  const startCamera = async () => {
    setCameraError(null);
    setStatusMessage('Requesting camera permission...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        cameraActiveRef.current = true;
        setActiveSimulatedGesture(null);
        setStatusMessage('Camera active · Loading AI models (Both Hands & Face)...');

        // Ensure MediaPipe scripts are loaded
        const { holisticReady, handsReady } = await ensureMediaPipeLoaded();

        // 1. Primary Engine: MediaPipe Holistic (Single unified WebGL pipeline for both hands & face)
        if (holisticReady && typeof (window as any).Holistic !== 'undefined') {
          try {
            const holistic = new (window as any).Holistic({
              locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`
            });

            holistic.setOptions({
              modelComplexity: 1,
              smoothLandmarks: true,
              minDetectionConfidence: 0.35,
              minTrackingConfidence: 0.35,
              refineFaceLandmarks: true,
            });

            holistic.onResults((results: any) => {
              if (!cameraActiveRef.current) return;

              // Extract Face Mesh Landmarks (468 points)
              const faceLandmarks: LandmarkPoint[] | null = results.faceLandmarks || null;
              currentFacePointsRef.current = faceLandmarks;

              // Extract Both Hands (left and right, 21 points each)
              const allHands: LandmarkPoint[][] = [];
              if (results.leftHandLandmarks && results.leftHandLandmarks.length >= 21) {
                allHands.push(results.leftHandLandmarks);
              }
              if (results.rightHandLandmarks && results.rightHandLandmarks.length >= 21) {
                allHands.push(results.rightHandLandmarks);
              }
              currentHandsListRef.current = allHands;
              currentSimulatedPointsRef.current = allHands[0] || null;

              // Evaluate Face motion (Smile, Nod, Shake)
              let facePrediction: RecognitionPrediction | null = null;
              if (faceLandmarks) {
                facePrediction = motionTracker.updateFace(faceLandmarks);
              } else {
                motionTracker.updateFace(null);
              }

              // Update tracking HUD pill
              updateTrackingHUD(!!faceLandmarks, allHands.length, motionTracker.isSmiling);

              // 1. Check Two-Handed Gestures (Heart 🫶, Namaste 🙏, Both Hands Up 🙌)
              if (allHands.length >= 2) {
                const twoHandResult = twoHandTracker.detect(allHands);
                if (twoHandResult && (recognitionModeRef.current === 'simplified' || recognitionModeRef.current === 'auto')) {
                  activeHeartEffectRef.current = twoHandResult.heartEffect || null;
                  activePrayerEffectRef.current = twoHandResult.prayerEffect || null;

                  let finalLabel = twoHandResult.prediction.label;
                  if (twoHandResult.gestureId === 'complete-heart' && motionTracker.isSmiling) {
                    finalLabel = 'Heart & Smile (Love 🫶😊)';
                  } else if (twoHandResult.gestureId === 'namaste-prayer' && motionTracker.isSmiling) {
                    finalLabel = 'Namaste & Smile (Welcome 🙏😊)';
                  } else if (twoHandResult.gestureId === 'both-hands-up' && motionTracker.isSmiling) {
                    finalLabel = 'Both Hands & Smile (Joy 🙌😊)';
                  }

                  const pred = { ...twoHandResult.prediction, label: finalLabel };
                  setCurrentPrediction(pred);
                  const faceActiveNote = faceLandmarks ? ' + Face 👤' : '';
                  setStatusMessage(`ALL DETECTED: Both hands${faceActiveNote} active · Recognized: ${finalLabel} (${(pred.confidence * 100).toFixed(0)}%)`);
                  handleStableSign(finalLabel);
                  return;
                }
              }

              activeHeartEffectRef.current = null;
              activePrayerEffectRef.current = null;

              // 2. Check Single Hand Gestures (Open Palm, Thumbs Up, Peace, etc.)
              if (allHands.length > 0) {
                const activeHand = allHands[0];
                const extFingers = countExtendedFingers(activeHand);

                // Check dynamic waving (Hi / Bye) combined with Face
                const wavePrediction = motionTracker.updateHand(activeHand, extFingers);
                if (wavePrediction && (recognitionModeRef.current === 'simplified' || recognitionModeRef.current === 'auto')) {
                  const finalWave = motionTracker.isSmiling ? 'Wave & Smile (Hi! 👋😊)' : wavePrediction.label;
                  const pred = { ...wavePrediction, label: finalWave };
                  setCurrentPrediction(pred);
                  setStatusMessage(`Dynamic hand wave & Face · Recognized: ${finalWave}`);
                  handleStableSign(finalWave);
                  return;
                }

                // Run trained classifier on active hand (or hand 1 if hand 0 is unknown)
                let prediction = classifyHandLandmarks(activeHand, recognitionModeRef.current);
                if ((prediction.isUnknown || prediction.label === 'Unknown') && allHands.length > 1) {
                  const pred2 = classifyHandLandmarks(allHands[1], recognitionModeRef.current);
                  if (!pred2.isUnknown && pred2.label !== 'Unknown') {
                    prediction = pred2;
                  }
                }

                setCurrentPrediction(prediction);

                if (!prediction.isUnknown && prediction.label !== 'Unknown') {
                  const handPrefix = allHands.length > 1 ? 'Both hands detected · ' : 'Tracking hand · ';
                  const faceSuffix = faceLandmarks ? ' + Face active' : '';
                  setStatusMessage(`${handPrefix}Recognized: ${prediction.label} (${(prediction.confidence * 100).toFixed(0)}%)${faceSuffix}`);
                  handleStableSign(prediction.label);
                } else {
                  candidateSignRef.current = null;
                  stableCountRef.current = 0;
                  if (facePrediction && (recognitionModeRef.current === 'simplified' || recognitionModeRef.current === 'auto')) {
                    setCurrentPrediction(facePrediction);
                    setStatusMessage(`Face action · Recognized: ${facePrediction.label}`);
                    handleStableSign(facePrediction.label);
                  } else {
                    const faceNote = faceLandmarks ? ' + Face active 👤' : '';
                    setStatusMessage(allHands.length >= 2 ? `Both hands${faceNote} active` : `Hand detected${faceNote} · Show a recognized sign`);
                  }
                }
              } else {
                motionTracker.updateHand(null);
                candidateSignRef.current = null;
                stableCountRef.current = 0;
                lastCommittedSignRef.current = null;

                if (facePrediction && (recognitionModeRef.current === 'simplified' || recognitionModeRef.current === 'auto')) {
                  setCurrentPrediction(facePrediction);
                  setStatusMessage(`Face action · Recognized: ${facePrediction.label}`);
                  handleStableSign(facePrediction.label);
                } else if (!faceLandmarks) {
                  setCurrentPrediction({
                    label: '—',
                    confidence: 0,
                    threshold: 0.70,
                    isUnknown: true,
                    timestamp: Date.now(),
                  });
                  setStatusMessage('Camera active · Show hands or face (thumbs up 👍, open palm ✋, smile 😊, wave 👋)');
                }
              }
            });

            mediaPipeHolisticRef.current = holistic;
            setStatusMessage('Camera active · AI tracking both hands & face in real-time');
            return;
          } catch (e) {
            console.warn('Holistic initialization deferred, trying fallback:', e);
          }
        }

        // 2. Fallback: Initialize MediaPipe Hands if Holistic unavailable
        if (handsReady && typeof (window as any).Hands !== 'undefined') {
          try {
            const hands = new (window as any).Hands({
              locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            });

            hands.setOptions({
              maxNumHands: 2,
              modelComplexity: 1,
              minDetectionConfidence: 0.35,
              minTrackingConfidence: 0.35,
            });

            hands.onResults((results: any) => {
              if (!cameraActiveRef.current) return;

              if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                const allHands: LandmarkPoint[][] = results.multiHandLandmarks;
                currentHandsListRef.current = allHands;
                const rawLandmarks: LandmarkPoint[] = allHands[0];
                currentSimulatedPointsRef.current = rawLandmarks;
                updateTrackingHUD(false, allHands.length, false);

                let prediction = classifyHandLandmarks(rawLandmarks, recognitionModeRef.current);
                if ((prediction.isUnknown || prediction.label === 'Unknown') && allHands.length > 1) {
                  const pred2 = classifyHandLandmarks(allHands[1], recognitionModeRef.current);
                  if (!pred2.isUnknown && pred2.label !== 'Unknown') {
                    prediction = pred2;
                  }
                }

                setCurrentPrediction(prediction);

                if (!prediction.isUnknown && prediction.label !== 'Unknown') {
                  const handPrefix = allHands.length > 1 ? 'Both hands detected · ' : 'Tracking hand · ';
                  setStatusMessage(`${handPrefix}Recognized: ${prediction.label} (${(prediction.confidence * 100).toFixed(0)}%)`);
                  handleStableSign(prediction.label);
                }
              } else {
                currentHandsListRef.current = [];
                currentSimulatedPointsRef.current = null;
                updateTrackingHUD(false, 0, false);
              }
            });

            mediaPipeHandsRef.current = hands;
            setStatusMessage('Camera active · AI tracking hands in real-time');
          } catch (e) {
            console.error('Hands fallback initialization failed:', e);
          }
        }
      }
    } catch (err: unknown) {
      console.warn('Camera access unavailable or denied:', err);
      setCameraError('Camera access unavailable or denied. You can still test all gestures with the interactive test panel below!');
      setStatusMessage('Camera denied or unavailable · Interactive test mode ready');
    }
  };

  // Stop Camera
  const stopCamera = () => {
    cameraActiveRef.current = false;
    setCameraActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    if (mediaPipeHolisticRef.current) {
      try {
        mediaPipeHolisticRef.current.close();
      } catch {}
      mediaPipeHolisticRef.current = null;
    }
    if (mediaPipeHandsRef.current) {
      try {
        mediaPipeHandsRef.current.close();
      } catch {}
      mediaPipeHandsRef.current = null;
    }
    if (mediaPipeFaceRef.current) {
      try {
        mediaPipeFaceRef.current.close();
      } catch {}
      mediaPipeFaceRef.current = null;
    }
    isProcessingRef.current = false;
    setActiveSimulatedGesture(null);
    currentSimulatedPointsRef.current = null;
    currentHandsListRef.current = [];
    currentFacePointsRef.current = null;
    activeHeartEffectRef.current = null;
    activePrayerEffectRef.current = null;
    motionTracker.reset();
    candidateSignRef.current = null;
    stableCountRef.current = 0;
    lastCommittedSignRef.current = null;
    updateTrackingHUD(false, 0, false);
    setStatusMessage('Camera is off. Video is processed on your device — only anonymous landmark numbers reach our server.');
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setCurrentPrediction({
      label: '—',
      confidence: 0,
      threshold: 0.70,
      isUnknown: true,
      timestamp: Date.now(),
    });
  };

  // Trigger manual simulation of simplified / everyday / face gesture
  const simulateEverydayGesture = (name: string, shape: string = 'open_palm') => {
    setActiveSimulatedGesture(name);
    setStatusMessage(`Simulated action: ${name}`);

    const twoHands = getTwoHandCoordinates(shape);
    if (twoHands) {
      currentHandsListRef.current = twoHands;
      currentSimulatedPointsRef.current = twoHands[0];
      if (shape === 'complete_heart') {
        activeHeartEffectRef.current = { center: { x: 0.5, y: 0.49 }, size: 0.28 };
        activePrayerEffectRef.current = null;
        currentFacePointsRef.current = null;
        updateTrackingHUD(false, 2, false);
      } else if (shape === 'heart_smile' || shape === 'detect_all') {
        activeHeartEffectRef.current = { center: { x: 0.5, y: 0.55 }, size: 0.26 };
        activePrayerEffectRef.current = null;
        currentFacePointsRef.current = getSimulatedFaceLandmarks(true);
        updateTrackingHUD(true, 2, true);
      } else if (shape === 'namaste_prayer') {
        activePrayerEffectRef.current = { center: { x: 0.5, y: 0.45 }, size: 0.28 };
        activeHeartEffectRef.current = null;
        currentFacePointsRef.current = null;
        updateTrackingHUD(false, 2, false);
      } else if (shape === 'namaste_smile') {
        activePrayerEffectRef.current = { center: { x: 0.5, y: 0.50 }, size: 0.26 };
        activeHeartEffectRef.current = null;
        currentFacePointsRef.current = getSimulatedFaceLandmarks(true);
        updateTrackingHUD(true, 2, true);
      } else if (shape === 'both_hands_up') {
        activeHeartEffectRef.current = null;
        activePrayerEffectRef.current = null;
        currentFacePointsRef.current = null;
        updateTrackingHUD(false, 2, false);
      } else if (shape === 'both_hands_smile') {
        activeHeartEffectRef.current = null;
        activePrayerEffectRef.current = null;
        currentFacePointsRef.current = getSimulatedFaceLandmarks(true);
        updateTrackingHUD(true, 2, true);
      }
    } else {
      currentHandsListRef.current = [];
      activeHeartEffectRef.current = null;
      activePrayerEffectRef.current = null;
      if (shape === 'wave_smile') {
        const points = getGestureCoordinates('open_palm');
        currentSimulatedPointsRef.current = points;
        currentFacePointsRef.current = getSimulatedFaceLandmarks(true);
        updateTrackingHUD(true, 1, true);
      } else if (shape === 'open_palm' && (name.includes('Smile') || name.includes('Nod') || name.includes('Shake'))) {
        currentFacePointsRef.current = getSimulatedFaceLandmarks(name.includes('Smile'));
        currentSimulatedPointsRef.current = null;
        updateTrackingHUD(true, 0, name.includes('Smile'));
      } else {
        const points = getGestureCoordinates(shape);
        currentSimulatedPointsRef.current = points;
        currentFacePointsRef.current = null;
        updateTrackingHUD(false, 1, false);
      }
    }

    const prediction: RecognitionPrediction = {
      label: name,
      confidence: 0.98,
      threshold: 0.70,
      isUnknown: false,
      timestamp: Date.now(),
    };
    setCurrentPrediction(prediction);

    if (!isPaused) {
      appendSign(prediction.label);
    }
  };

  // Trigger manual simulation of any supported gesture
  const simulateGesture = (gestureId: string) => {
    const gesture = SUPPORTED_GESTURES.find((g) => g.id === gestureId);
    if (!gesture) return;

    setActiveSimulatedGesture(gesture.name);
    setStatusMessage(`Simulated pose: ${gesture.name} · 63 landmark coordinates active`);
    const points = getGestureCoordinates(gesture.svgShape);
    currentSimulatedPointsRef.current = points;
    currentHandsListRef.current = [points];
    currentFacePointsRef.current = null;
    activeHeartEffectRef.current = null;
    activePrayerEffectRef.current = null;
    updateTrackingHUD(false, 1, false);

    const prediction = classifyHandLandmarks(points, 'gestures');
    setCurrentPrediction(prediction);

    if (!isPaused && prediction.label !== 'Unknown') {
      appendSign(prediction.label);
    }
  };

  // Trigger manual simulation of ISL alphabet
  const simulateISL = (letter: string) => {
    const label = `ISL: ${letter}`;
    setActiveSimulatedGesture(label);
    setStatusMessage(`Simulated pose: ${label} · ISL Dataset centroid profile active`);
    const points = getGestureCoordinates(`isl_${letter}`);
    currentSimulatedPointsRef.current = points;
    currentHandsListRef.current = [points];
    currentFacePointsRef.current = null;
    activeHeartEffectRef.current = null;
    activePrayerEffectRef.current = null;
    updateTrackingHUD(false, 1, false);

    const prediction = classifyHandLandmarks(points, 'isl');
    setCurrentPrediction(prediction);

    if (!isPaused && prediction.label !== 'Unknown') {
      appendSign(prediction.label);
    }
  };

  // Trigger manual simulation of trained phrases
  const simulatePhrase = (phraseKey: string) => {
    const meta = PHRASES_MODEL.metadata[phraseKey];
    const displayName = meta ? meta.name : phraseKey.toUpperCase();
    const label = `Phrase: ${displayName}`;
    setActiveSimulatedGesture(label);
    setStatusMessage(`Simulated pose: ${label} · Trained Phrases Dataset centroid active`);
    const points = getGestureCoordinates(`phrase_${phraseKey}`);
    currentSimulatedPointsRef.current = points;
    currentHandsListRef.current = [points];
    currentFacePointsRef.current = null;
    activeHeartEffectRef.current = null;
    activePrayerEffectRef.current = null;
    updateTrackingHUD(false, 1, false);

    const prediction = classifyHandLandmarks(points, 'phrases');
    setCurrentPrediction(prediction);

    if (!isPaused && prediction.label !== 'Unknown') {
      appendSign(prediction.label);
    }
  };

  // Appends a recognized sign to text sequence
  const appendSign = (label: string) => {
    setSequence((prev) => [...prev, label]);
  };

  const removeLast = () => {
    setSequence((prev) => prev.slice(0, -1));
  };

  const clearTranscript = () => {
    setSequence([]);
    lastCommittedSignRef.current = null;
  };

  const copyTranscript = () => {
    const text = sequence.join(' ');
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const downloadTranscript = () => {
    const text = sequence.join(' ');
    const blob = new Blob([text || 'Empty transcript'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signbridge-transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Main animation / tracking loop
  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // 1. If camera is on, draw video frame
      const video = videoRef.current;
      const isVideoReady =
        cameraActive &&
        video &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0;

      if (isVideoReady) {
        ctx.save();
        if (isMirrored) {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, width, height);
        ctx.restore();

        const now = Date.now();
        // Prevent watchdog lockups
        if (isProcessingRef.current && now - lastProcessTimeRef.current > 1200) {
          isProcessingRef.current = false;
        }

        // Dispatch frame to MediaPipe Holistic (unified dual-hand + face pipeline)
        if (mediaPipeHolisticRef.current && !isProcessingRef.current && !isPausedRef.current) {
          isProcessingRef.current = true;
          lastProcessTimeRef.current = now;
          mediaPipeHolisticRef.current
            .send({ image: video })
            .catch((err: any) => {
              console.warn('MediaPipe Holistic send error:', err);
            })
            .finally(() => {
              isProcessingRef.current = false;
            });
        } else if (mediaPipeHandsRef.current && !isProcessingRef.current && !isPausedRef.current) {
          // Fallback to Hands if Holistic not active
          isProcessingRef.current = true;
          lastProcessTimeRef.current = now;
          mediaPipeHandsRef.current
            .send({ image: video })
            .catch((err: any) => {
              console.warn('MediaPipe Hands send error:', err);
            })
            .finally(() => {
              isProcessingRef.current = false;
            });
        }
      } else {
        // Draw dark blueprint background when off
        ctx.fillStyle = '#071D3A';
        ctx.fillRect(0, 0, width, height);

        // Grid lines
        ctx.strokeStyle = 'rgba(106, 155, 221, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 40) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // 2. Overlay Landmarks if enabled
      if (showOverlay) {
        // Draw Hand Landmarks (supports both hands with distinct colors)
        if (currentHandsListRef.current && currentHandsListRef.current.length > 0) {
          currentHandsListRef.current.forEach((handPoints, idx) => {
            drawHandLandmarks(
              ctx,
              handPoints,
              width,
              height,
              isMirrored,
              idx === 0
                ? { strokeColor: '#00C2A8', glowColor: 'rgba(0, 194, 168, 0.6)', tipColor: '#7B61FF', tipGlow: '#7B61FF' }
                : { strokeColor: '#EC4899', glowColor: 'rgba(236, 72, 153, 0.6)', tipColor: '#FF69B4', tipGlow: '#FF1493' }
            );
          });
        } else if (currentSimulatedPointsRef.current) {
          drawHandLandmarks(ctx, currentSimulatedPointsRef.current, width, height, isMirrored);
        }

        // Draw Face Landmarks
        const facePointsToDraw = currentFacePointsRef.current;
        if (facePointsToDraw) {
          drawFaceLandmarks(ctx, facePointsToDraw, width, height, isMirrored);
        }

        // Pulsing Neon Heart Effect if Complete Heart is formed
        if (activeHeartEffectRef.current) {
          drawHeartEffect(
            ctx,
            activeHeartEffectRef.current.center,
            activeHeartEffectRef.current.size,
            width,
            height,
            isMirrored
          );
        }

        // Warm Spiritual Glow if Namaste is formed
        if (activePrayerEffectRef.current) {
          drawPrayerEffect(
            ctx,
            activePrayerEffectRef.current.center,
            activePrayerEffectRef.current.size,
            width,
            height,
            isMirrored
          );
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [cameraActive, isMirrored, showOverlay]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPaused((p) => !p);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        clearTranscript();
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        copyTranscript();
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        downloadTranscript();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Studio Header info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', color: 'var(--color-navy)', margin: 0 }}>
            Recognition Studio
          </h1>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '750px', fontSize: '1rem', lineHeight: 1.55 }}>
          Hold a supported gesture steady in front of your camera for about a second — it will be recognized and appended to your text sequence. Video stays 100% on your device.
        </p>
      </div>

      {cameraError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem 1.25rem',
            backgroundColor: 'var(--color-status-warning-bg)',
            border: '1px solid var(--color-status-warning-border)',
            borderRadius: 'var(--radius-md)',
            color: '#8A5200',
            fontSize: '0.9rem',
          }}
        >
          <AlertTriangle size={20} color="#E58A00" style={{ flexShrink: 0 }} />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Main Studio Two-Column Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)',
          gap: '1.75rem',
          alignItems: 'start',
        }}
        className="studio-grid"
      >
        {/* Left Column: Camera Viewport and Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Viewport Card */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#071D3A',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--color-border-dark)',
              aspectRatio: '4/3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Native video element - kept active on GPU compositor with opacity: 0.01 */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.01,
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />

            {/* Canvas for video + landmark overlay */}
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                zIndex: 2,
              }}
            />

            {/* Top Left Camera Status Badge */}
            <div
              style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(8, 34, 68, 0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                fontSize: '0.78rem',
                fontWeight: 500,
                zIndex: 10,
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: cameraActive
                    ? isPaused
                      ? '#E58A00'
                      : '#00C2A8'
                    : activeSimulatedGesture
                    ? '#7B61FF'
                    : '#8B95A5',
                  boxShadow: cameraActive
                    ? isPaused
                      ? '0 0 8px #E58A00'
                      : '0 0 8px #00C2A8'
                    : activeSimulatedGesture
                    ? '0 0 8px #7B61FF'
                    : 'none',
                }}
              />
              <span>
                {cameraActive
                  ? isPaused
                    ? 'Paused'
                    : 'Camera active'
                  : activeSimulatedGesture
                  ? `Simulated feed (${activeSimulatedGesture})`
                  : 'Camera off'}
              </span>
            </div>

            {/* Top Right Active Target Badge */}
            <div
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(8, 34, 68, 0.88)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color:
                  recognitionMode === 'simplified'
                    ? '#10B981'
                    : recognitionMode === 'phrases'
                    ? '#00C2A8'
                    : recognitionMode === 'isl'
                    ? '#C084FC'
                    : recognitionMode === 'gestures'
                    ? '#60A5FA'
                    : '#FBBF24',
                fontSize: '0.78rem',
                fontWeight: 600,
                zIndex: 10,
              }}
            >
              <span>Target:</span>
              <span>
                {recognitionMode === 'simplified'
                  ? `🌟 Everyday & Face (${EVERYDAY_GESTURES.length})`
                  : recognitionMode === 'auto'
                  ? '🌟 Auto (All)'
                  : recognitionMode === 'phrases'
                  ? '💬 Phrases (44)'
                  : recognitionMode === 'isl'
                  ? '🔤 ISL Alphabet (23)'
                  : '✋ Core Gestures (8)'}
              </span>
            </div>

            {/* Real-time Multimodal Tracking HUD Pill: Face + Hand 1 + Hand 2 */}
            {(cameraActive || activeSimulatedGesture) && (
              <div
                style={{
                  position: 'absolute',
                  top: '3.4rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.4rem 1rem',
                  borderRadius: '9999px',
                  backgroundColor: trackingStatus.allDetected
                    ? 'rgba(6, 78, 59, 0.94)'
                    : 'rgba(8, 34, 68, 0.88)',
                  backdropFilter: 'blur(10px)',
                  border: trackingStatus.allDetected
                    ? '1.5px solid #10B981'
                    : '1px solid rgba(255, 255, 255, 0.16)',
                  boxShadow: trackingStatus.allDetected
                    ? '0 0 16px rgba(16, 185, 129, 0.55)'
                    : '0 4px 14px rgba(0, 0, 0, 0.35)',
                  color: '#FFFFFF',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  zIndex: 11,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  transition: 'all 0.25s ease',
                }}
              >
                {/* Face Badge */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    color: trackingStatus.face ? '#C084FC' : 'rgba(255, 255, 255, 0.42)',
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: trackingStatus.face ? '#A855F7' : 'rgba(255, 255, 255, 0.25)',
                      boxShadow: trackingStatus.face ? '0 0 8px #A855F7' : 'none',
                    }}
                  />
                  👤 Face {trackingStatus.face ? (trackingStatus.isSmiling ? '😊 Smile' : '✓') : '—'}
                </span>

                <span style={{ opacity: 0.35 }}>|</span>

                {/* Hand 1 Badge */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    color: trackingStatus.handCount >= 1 ? '#00C2A8' : 'rgba(255, 255, 255, 0.42)',
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: trackingStatus.handCount >= 1 ? '#00C2A8' : 'rgba(255, 255, 255, 0.25)',
                      boxShadow: trackingStatus.handCount >= 1 ? '0 0 8px #00C2A8' : 'none',
                    }}
                  />
                  ✋ Hand 1 {trackingStatus.handCount >= 1 ? '✓' : '—'}
                </span>

                <span style={{ opacity: 0.35 }}>|</span>

                {/* Hand 2 Badge */}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    color: trackingStatus.handCount >= 2 ? '#EC4899' : 'rgba(255, 255, 255, 0.42)',
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: trackingStatus.handCount >= 2 ? '#EC4899' : 'rgba(255, 255, 255, 0.25)',
                      boxShadow: trackingStatus.handCount >= 2 ? '0 0 8px #EC4899' : 'none',
                    }}
                  />
                  ✋ Hand 2 {trackingStatus.handCount >= 2 ? '✓' : '—'}
                </span>

                {trackingStatus.allDetected && (
                  <span
                    style={{
                      marginLeft: '0.2rem',
                      padding: '0.15rem 0.55rem',
                      borderRadius: '9999px',
                      backgroundColor: '#10B981',
                      color: '#064E3B',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.03em',
                    }}
                  >
                    ✨ ALL DETECTED
                  </span>
                )}
              </div>
            )}

            {/* Camera Off Placeholder Message - only shown if no simulated gesture is selected */}
            {!cameraActive && !activeSimulatedGesture && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#A7C7E7',
                  pointerEvents: 'none',
                }}
              >
                <CameraOff size={42} style={{ marginBottom: '1rem', opacity: 0.6, color: '#6A9BDD' }} />
                <p style={{ maxWidth: '380px', fontSize: '0.95rem', color: '#A7C7E7', lineHeight: 1.55 }}>
                  Camera is off. Video is processed on your device — only anonymous landmark numbers reach our server.
                </p>
              </div>
            )}

            {/* Subtle banner when simulation is active without camera */}
            {!cameraActive && activeSimulatedGesture && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.9rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(8, 34, 68, 0.88)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(123, 97, 255, 0.35)',
                  color: '#EFE8FF',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                }}
              >
                <Sparkles size={13} color="#00C2A8" />
                <span>Simulated 21 landmarks active · Click 'Start Camera' for live feed</span>
              </div>
            )}
          </div>

          {/* Camera Action Control Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.85rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--color-surface-white)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-light)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {cameraActive ? (
                <button
                  onClick={stopCamera}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: '#E63946',
                    color: '#FFFFFF',
                    padding: '0.6rem 1.25rem',
                    borderRadius: 'var(--radius-pill)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    transition: 'all var(--transition-fast)',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  <CameraOff size={16} /> Stop Camera
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  className="btn-primary"
                  style={{ padding: '0.6rem 1.35rem', fontSize: '0.9rem' }}
                >
                  <Camera size={16} /> Start Camera
                </button>
              )}

              <button
                onClick={() => setIsPaused(!isPaused)}
                disabled={!cameraActive}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 1.1rem',
                  borderRadius: 'var(--radius-pill)',
                  backgroundColor: isPaused ? 'var(--color-purple)' : 'var(--color-surface-subtle)',
                  color: isPaused ? '#FFFFFF' : 'var(--color-navy)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  border: '1px solid var(--color-border-light)',
                  opacity: cameraActive ? 1 : 0.5,
                  cursor: cameraActive ? 'pointer' : 'not-allowed',
                }}
              >
                {isPaused ? <Play size={15} /> : <Pause size={15} />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: 'var(--color-navy)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <FlipHorizontal size={16} color="var(--color-text-secondary)" />
                <span>Mirror</span>
                <input
                  type="checkbox"
                  checked={isMirrored}
                  onChange={(e) => setIsMirrored(e.target.checked)}
                  style={{ accentColor: 'var(--color-teal)', cursor: 'pointer' }}
                />
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: 'var(--color-navy)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                {showOverlay ? <Eye size={16} color="var(--color-teal)" /> : <EyeOff size={16} color="var(--color-text-muted)" />}
                <span>Overlay</span>
                <input
                  type="checkbox"
                  checked={showOverlay}
                  onChange={(e) => setShowOverlay(e.target.checked)}
                  style={{ accentColor: 'var(--color-teal)', cursor: 'pointer' }}
                />
              </label>
            </div>
          </div>

          {/* Camera Recognition Target Selector Bar */}
          <div
            style={{
              padding: '0.85rem 1.15rem',
              backgroundColor: 'var(--color-surface-white)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border-light)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} color="var(--color-teal)" />
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                  Camera Recognition Target
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                  (Select what signs the live camera actively recognizes)
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  padding: '0.15rem 0.6rem',
                  borderRadius: '9999px',
                  backgroundColor:
                    recognitionMode === 'simplified'
                      ? 'rgba(16, 185, 129, 0.12)'
                      : recognitionMode === 'phrases'
                      ? 'var(--color-teal-tint-1)'
                      : recognitionMode === 'isl'
                      ? 'var(--color-purple-tint-1)'
                      : recognitionMode === 'gestures'
                      ? 'rgba(7, 29, 58, 0.08)'
                      : 'rgba(229, 138, 0, 0.1)',
                  color:
                    recognitionMode === 'simplified'
                      ? '#059669'
                      : recognitionMode === 'phrases'
                      ? 'var(--color-teal-shade)'
                      : recognitionMode === 'isl'
                      ? 'var(--color-purple-shade)'
                      : recognitionMode === 'gestures'
                      ? 'var(--color-navy)'
                      : '#8A5200',
                }}
              >
                Active: {recognitionMode === 'simplified' ? `🌟 Everyday & Face (${EVERYDAY_GESTURES.length})` : recognitionMode === 'auto' ? 'Auto (Intelligent)' : recognitionMode === 'phrases' ? 'Phrases (44)' : recognitionMode === 'isl' ? 'ISL Alphabet (23)' : 'Core Gestures (8)'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.45rem' }}>
              <button
                type="button"
                onClick={() => handleModeChange('simplified')}
                style={{
                  padding: '0.5rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${recognitionMode === 'simplified' ? '#10B981' : 'var(--color-border-light)'}`,
                  backgroundColor: recognitionMode === 'simplified' ? 'rgba(16, 185, 129, 0.12)' : 'var(--color-surface-subtle)',
                  color: recognitionMode === 'simplified' ? '#047857' : 'var(--color-navy)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all var(--transition-fast)',
                }}
              >
                🌟 Everyday & Face ({EVERYDAY_GESTURES.length})
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('phrases')}
                style={{
                  padding: '0.5rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${recognitionMode === 'phrases' ? 'var(--color-teal)' : 'var(--color-border-light)'}`,
                  backgroundColor: recognitionMode === 'phrases' ? 'var(--color-teal-tint-1)' : 'var(--color-surface-subtle)',
                  color: recognitionMode === 'phrases' ? 'var(--color-teal-shade)' : 'var(--color-navy)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all var(--transition-fast)',
                }}
              >
                💬 Phrases (44)
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('isl')}
                style={{
                  padding: '0.5rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${recognitionMode === 'isl' ? 'var(--color-purple)' : 'var(--color-border-light)'}`,
                  backgroundColor: recognitionMode === 'isl' ? 'var(--color-purple-tint-1)' : 'var(--color-surface-subtle)',
                  color: recognitionMode === 'isl' ? 'var(--color-purple-shade)' : 'var(--color-navy)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all var(--transition-fast)',
                }}
              >
                🔤 ISL Alphabet (23)
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('gestures')}
                style={{
                  padding: '0.5rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${recognitionMode === 'gestures' ? 'var(--color-navy)' : 'var(--color-border-light)'}`,
                  backgroundColor: recognitionMode === 'gestures' ? 'rgba(7, 29, 58, 0.08)' : 'var(--color-surface-subtle)',
                  color: 'var(--color-navy)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all var(--transition-fast)',
                }}
              >
                ✋ Core Gestures (8)
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('auto')}
                style={{
                  padding: '0.5rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${recognitionMode === 'auto' ? '#E58A00' : 'var(--color-border-light)'}`,
                  backgroundColor: recognitionMode === 'auto' ? 'rgba(229, 138, 0, 0.1)' : 'var(--color-surface-subtle)',
                  color: recognitionMode === 'auto' ? '#8A5200' : 'var(--color-navy)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all var(--transition-fast)',
                }}
              >
                🌟 Auto (Smart)
              </button>
            </div>
          </div>

          {/* Status line */}
          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', paddingLeft: '0.25rem' }}>
            {statusMessage}
          </span>

          {/* Interactive Gesture & ISL Alphabet Test Sandbox */}
          <div
            style={{
              marginTop: '0.5rem',
              padding: '1.25rem',
              backgroundColor: 'var(--color-surface-white)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border-light)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} color="var(--color-teal)" />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                  Interactive Sign Sandbox
                </span>
              </div>

              {/* Tab Selector */}
              <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--color-surface-subtle)', padding: '0.2rem', borderRadius: 'var(--radius-sm)' }}>
                <button
                  onClick={() => handleSandboxTabChange('simplified')}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    backgroundColor: sandboxTab === 'simplified' ? 'var(--color-surface-white)' : 'transparent',
                    color: sandboxTab === 'simplified' ? '#047857' : 'var(--color-text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    boxShadow: sandboxTab === 'simplified' ? 'var(--shadow-xs)' : 'none',
                  }}
                >
                  🌟 Everyday & Face ({EVERYDAY_GESTURES.length})
                </button>
                <button
                  onClick={() => handleSandboxTabChange('gestures')}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    backgroundColor: sandboxTab === 'gestures' ? 'var(--color-surface-white)' : 'transparent',
                    color: sandboxTab === 'gestures' ? 'var(--color-navy)' : 'var(--color-text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    boxShadow: sandboxTab === 'gestures' ? 'var(--shadow-xs)' : 'none',
                  }}
                >
                  Core Gestures (8)
                </button>
                <button
                  onClick={() => handleSandboxTabChange('phrases')}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    backgroundColor: sandboxTab === 'phrases' ? 'var(--color-surface-white)' : 'transparent',
                    color: sandboxTab === 'phrases' ? 'var(--color-teal-shade)' : 'var(--color-text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    boxShadow: sandboxTab === 'phrases' ? 'var(--shadow-xs)' : 'none',
                  }}
                >
                  Phrases (44)
                </button>
                <button
                  onClick={() => handleSandboxTabChange('isl')}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    backgroundColor: sandboxTab === 'isl' ? 'var(--color-surface-white)' : 'transparent',
                    color: sandboxTab === 'isl' ? 'var(--color-purple)' : 'var(--color-text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    boxShadow: sandboxTab === 'isl' ? 'var(--shadow-xs)' : 'none',
                  }}
                >
                  ISL Alphabet (23)
                </button>
              </div>
            </div>

            {sandboxTab === 'simplified' && (
              <div>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.65rem' }}>
                  Super-simple everyday gestures, two-handed heart 🫶 & face detection (Complete Heart, Namaste, Waving Hi/Bye, Nodding, Shaking, Smiling, Thumbs, Peace, etc.):
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.45rem' }}>
                  {EVERYDAY_GESTURES.map((g) => {
                    const isActive = currentPrediction.label === g.name;
                    const isDetectAll = g.id === 'detect-all';
                    return (
                      <button
                        key={g.id}
                        onClick={() => simulateEverydayGesture(g.name, g.svgShape)}
                        title={`${g.shortDescription} • ${g.howToSign}`}
                        style={{
                          padding: isDetectAll ? '0.55rem 0.65rem' : '0.5rem 0.55rem',
                          borderRadius: 'var(--radius-sm)',
                          gridColumn: isDetectAll ? '1 / -1' : undefined,
                          backgroundColor: isActive
                            ? 'rgba(16, 185, 129, 0.22)'
                            : isDetectAll
                            ? 'rgba(123, 97, 255, 0.12)'
                            : 'var(--color-surface-subtle)',
                          border: `1.5px solid ${
                            isActive
                              ? '#10B981'
                              : isDetectAll
                              ? '#7B61FF'
                              : 'var(--color-border-light)'
                          }`,
                          boxShadow: isDetectAll
                            ? '0 0 12px rgba(123, 97, 255, 0.22)'
                            : 'none',
                          color: isActive ? '#047857' : isDetectAll ? '#6B21A8' : 'var(--color-navy)',
                          fontSize: isDetectAll ? '0.82rem' : '0.78rem',
                          fontWeight: 700,
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        {isDetectAll && <span>⭐</span>}
                        {g.name}
                        {isDetectAll && <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>(Face + Hand 1 + Hand 2)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {sandboxTab === 'gestures' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.5rem' }}>
                {SUPPORTED_GESTURES.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => simulateGesture(g.id)}
                    style={{
                      padding: '0.5rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: currentPrediction.label === g.name ? 'var(--color-teal-tint-1)' : 'var(--color-surface-subtle)',
                      border: `1px solid ${currentPrediction.label === g.name ? 'var(--color-teal)' : 'var(--color-border-light)'}`,
                      color: currentPrediction.label === g.name ? 'var(--color-teal-shade)' : 'var(--color-navy)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}

            {sandboxTab === 'phrases' && (
              <div>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.65rem' }}>
                  Trained on 44 phrase classes from dataset. Click any phrase to test landmark profile:
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))',
                    gap: '0.4rem',
                    maxHeight: '260px',
                    overflowY: 'auto',
                    paddingRight: '4px',
                  }}
                >
                  {PHRASES_MODEL.classes.map((cls) => {
                    const meta = PHRASES_MODEL.metadata[cls];
                    const name = meta ? meta.name : cls;
                    const phraseLabel = `Phrase: ${name}`;
                    const isActive = currentPrediction.label === phraseLabel;
                    return (
                      <button
                        key={cls}
                        onClick={() => simulatePhrase(cls)}
                        title={meta ? `${meta.description} • ${meta.howTo}` : name}
                        style={{
                          padding: '0.45rem 0.45rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isActive ? 'var(--color-teal-tint-1)' : 'var(--color-surface-subtle)',
                          border: `1px solid ${isActive ? 'var(--color-teal)' : 'var(--color-border-light)'}`,
                          color: isActive ? 'var(--color-teal-shade)' : 'var(--color-navy)',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          textAlign: 'center',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {sandboxTab === 'isl' && (
              <div>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.65rem' }}>
                  Centroids trained directly from Indian Sign Language dataset (23 classes):
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))', gap: '0.35rem' }}>
                  {ISL_MODEL.classes.map((letter) => {
                    const islLabel = `ISL: ${letter}`;
                    const isActive = currentPrediction.label === islLabel;
                    return (
                      <button
                        key={letter}
                        onClick={() => simulateISL(letter)}
                        style={{
                          padding: '0.45rem 0.2rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isActive ? 'var(--color-purple-tint-1)' : 'var(--color-surface-subtle)',
                          border: `1px solid ${isActive ? 'var(--color-purple)' : 'var(--color-border-light)'}`,
                          color: isActive ? 'var(--color-purple-shade)' : 'var(--color-navy)',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recognized Sign & Text Sequence Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Card 1: RECOGNIZED SIGN */}
          <div
            className="card-enterprise"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                RECOGNIZED SIGN
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--color-purple-tint-1)',
                  color: 'var(--color-purple-shade)',
                  border: '1px solid var(--color-purple-tint-2)',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-purple)' }} />
                Trained AI Model
              </span>
            </div>

            {/* Big Detected Sign Label */}
            <div style={{ minHeight: '56px', display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  color: currentPrediction.isUnknown ? 'var(--color-text-muted)' : 'var(--color-navy)',
                  letterSpacing: '-0.02em',
                }}
              >
                {currentPrediction.label}
              </span>
            </div>

            {/* Live Multimodal Detection Status Indicators */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
                padding: '0.45rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: trackingStatus.allDetected ? 'rgba(16, 185, 129, 0.12)' : 'var(--color-surface-subtle)',
                border: `1px solid ${trackingStatus.allDetected ? '#10B981' : 'var(--color-border-light)'}`,
                fontSize: '0.76rem',
                fontWeight: 600,
              }}
            >
              <span style={{ color: 'var(--color-text-muted)' }}>Tracking:</span>
              <span style={{ color: trackingStatus.face ? '#7C3AED' : 'var(--color-text-muted)' }}>
                👤 Face {trackingStatus.face ? (trackingStatus.isSmiling ? '😊' : '✓') : '—'}
              </span>
              <span style={{ color: 'var(--color-border-dark)' }}>•</span>
              <span style={{ color: trackingStatus.handCount >= 1 ? '#0D9488' : 'var(--color-text-muted)' }}>
                ✋ Hand 1 {trackingStatus.handCount >= 1 ? '✓' : '—'}
              </span>
              <span style={{ color: 'var(--color-border-dark)' }}>•</span>
              <span style={{ color: trackingStatus.handCount >= 2 ? '#DB2777' : 'var(--color-text-muted)' }}>
                ✋ Hand 2 {trackingStatus.handCount >= 2 ? '✓' : '—'}
              </span>
              {trackingStatus.allDetected && (
                <span style={{ marginLeft: 'auto', color: '#047857', fontWeight: 700 }}>
                  ✨ All 3 Detected
                </span>
              )}
            </div>

            {/* Confidence Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>Confidence</span>
                <span style={{ color: currentPrediction.isUnknown ? 'var(--color-text-muted)' : 'var(--color-teal)', fontWeight: 700 }}>
                  {currentPrediction.isUnknown ? '—' : `${(currentPrediction.confidence * 100).toFixed(0)}%`}
                </span>
              </div>

              <div
                style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--color-surface-subtle)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: currentPrediction.isUnknown ? '0%' : `${currentPrediction.confidence * 100}%`,
                    backgroundColor: 'var(--color-teal)',
                    borderRadius: '9999px',
                    transition: 'width 200ms ease-out',
                  }}
                />
              </div>

              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                Threshold 70% · results below it are not labeled
              </span>
            </div>
          </div>

          {/* Card 2: TEXT SEQUENCE */}
          <div
            className="card-enterprise"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                TEXT SEQUENCE
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                {sequence.length} signs
              </span>
            </div>

            {/* Built Transcript Box */}
            <div
              style={{
                minHeight: '130px',
                maxHeight: '220px',
                overflowY: 'auto',
                padding: '1rem',
                backgroundColor: 'var(--color-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-subtle)',
                fontSize: '0.98rem',
                lineHeight: 1.6,
              }}
            >
              {sequence.length === 0 ? (
                <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  Recognized gestures will build up here. Hold a gesture steady for about a second.
                </span>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {sequence.map((word, i) => (
                    <span
                      key={i}
                      style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.55rem',
                        backgroundColor: 'var(--color-surface-white)',
                        border: '1px solid var(--color-border-light)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-navy)',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        boxShadow: 'var(--shadow-xs)',
                      }}
                    >
                      {word}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons Row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                onClick={removeLast}
                disabled={sequence.length === 0}
                className="btn-secondary"
                style={{
                  padding: '0.5rem 0.9rem',
                  fontSize: '0.82rem',
                  opacity: sequence.length === 0 ? 0.45 : 1,
                  cursor: sequence.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <RotateCcw size={13} /> Remove last
              </button>

              <button
                onClick={clearTranscript}
                disabled={sequence.length === 0}
                className="btn-secondary"
                style={{
                  padding: '0.5rem 0.9rem',
                  fontSize: '0.82rem',
                  opacity: sequence.length === 0 ? 0.45 : 1,
                  cursor: sequence.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <Trash2 size={13} /> Clear
              </button>

              <button
                onClick={copyTranscript}
                disabled={sequence.length === 0}
                className="btn-secondary"
                style={{
                  padding: '0.5rem 0.9rem',
                  fontSize: '0.82rem',
                  opacity: sequence.length === 0 ? 0.45 : 1,
                  cursor: sequence.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {copySuccess ? <Check size={13} color="#00C2A8" /> : <Copy size={13} />}
                <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                onClick={downloadTranscript}
                disabled={sequence.length === 0}
                className="btn-secondary"
                style={{
                  padding: '0.5rem 0.9rem',
                  fontSize: '0.82rem',
                  opacity: sequence.length === 0 ? 0.45 : 1,
                  cursor: sequence.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <Download size={13} /> Download
              </button>
            </div>

            {/* Guest notice */}
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.5, borderTop: '1px solid var(--color-border-subtle)', paddingTop: '0.75rem' }}>
              Guest mode — recognition works, but history, saved transcripts and practice progress need an account.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Card: Keyboard shortcuts & Model details */}
      <div
        className="card-enterprise"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-navy)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Keyboard shortcuts
          </span>

          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
            <BookOpen size={14} color="var(--color-teal)" />
            Trained Dataset: <strong style={{ color: 'var(--color-navy)' }}>702 ISL images</strong> across 23 classes
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <kbd
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                backgroundColor: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border-medium)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-navy)',
                boxShadow: '0 1px 2px rgba(11, 45, 91, 0.08)',
              }}
            >
              Space
            </kbd>
            <span style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>Pause / resume recognition</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <kbd
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                backgroundColor: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border-medium)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-navy)',
                boxShadow: '0 1px 2px rgba(11, 45, 91, 0.08)',
              }}
            >
              C
            </kbd>
            <span style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>Clear transcript</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <kbd
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                backgroundColor: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border-medium)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-navy)',
                boxShadow: '0 1px 2px rgba(11, 45, 91, 0.08)',
              }}
            >
              K
            </kbd>
            <span style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>Copy transcript</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <kbd
              style={{
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                backgroundColor: 'var(--color-surface-subtle)',
                border: '1px solid var(--color-border-medium)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-navy)',
                boxShadow: '0 1px 2px rgba(11, 45, 91, 0.08)',
              }}
            >
              D
            </kbd>
            <span style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>Download transcript</span>
          </div>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          The on-screen model recognizes isolated gestures and ISL alphabet signs — see the <a href="/library" style={{ color: 'var(--color-teal)', fontWeight: 600 }}>gesture library</a> for classes and holding guidance.
        </p>
      </div>

      {/* Responsive layout styles */}
      <style>{`
        @media (max-width: 900px) {
          .studio-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
