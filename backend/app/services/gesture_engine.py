"""Gesture Engine Service
Performs real-time centroid-based classification on normalized hand landmarks.
Matches mathematically with frontend ISL & phrase models.
"""

import json
import logging
import math
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

import numpy as np
from app.core.config import settings
from app.models.schemas import LandmarkPoint, PredictionCandidate, PredictionResponse

logger = logging.getLogger(__name__)

class GestureEngine:
    def __init__(self):
        self.isl_classes: List[str] = []
        self.isl_centroids: Dict[str, np.ndarray] = {}
        self.isl_metadata: Dict[str, Any] = {}
        self.is_loaded: bool = False
        self.load_model()

    def load_model(self) -> bool:
        path = settings.isl_model_path
        if not path.exists():
            # Try alternate relative location if running from root
            alt_path = Path("backend/app/data/isl_model.json")
            if alt_path.exists():
                path = alt_path
            else:
                logger.warning(f"ISL Model file not found at {path}")
                self.is_loaded = False
                return False

        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)

            self.isl_classes = data.get("classes", [])
            centroids_raw = data.get("centroids", {})
            self.isl_centroids = {
                cls: np.array(vec, dtype=np.float32)
                for cls, vec in centroids_raw.items()
            }
            self.isl_metadata = {
                "total_samples": data.get("total_samples", 0),
                "feature_dim": data.get("feature_dim", 63),
                "trained_timestamp": data.get("trained_timestamp", "unknown"),
            }
            self.is_loaded = True
            logger.info(f"Loaded ISL model with {len(self.isl_centroids)} class centroids.")
            return True
        except Exception as e:
            logger.error(f"Failed to load ISL model: {e}")
            self.is_loaded = False
            return False

    @staticmethod
    def extract_normalized_features(landmarks: List[LandmarkPoint]) -> Optional[np.ndarray]:
        """Normalizes 21 landmark points relative to wrist and palm scale (dist wrist -> landmark 9)."""
        if not landmarks or len(landmarks) < 21:
            return None

        wrist = landmarks[0]
        middle_mcp = landmarks[9]

        scale = math.sqrt(
            (middle_mcp.x - wrist.x) ** 2 +
            (middle_mcp.y - wrist.y) ** 2 +
            (middle_mcp.z - wrist.z) ** 2
        )
        if scale == 0:
            scale = 1.0

        feats = []
        for p in landmarks[:21]:
            feats.extend([
                (p.x - wrist.x) / scale,
                (p.y - wrist.y) / scale,
                (p.z - wrist.z) / scale,
            ])

        return np.array(feats, dtype=np.float32)

    @staticmethod
    def compute_distance(features: np.ndarray, centroid: np.ndarray) -> float:
        """Computes Euclidean distance with horizontal mirroring check (supports left/right hands)."""
        # Original features distance
        diff = features - centroid
        dist_orig = float(np.sqrt(np.sum(diff ** 2)))

        # Horizontally mirrored features (flip X coordinates, which are indices 0, 3, 6, ...)
        features_flipped = features.copy()
        features_flipped[0::3] = -features_flipped[0::3]
        diff_flipped = features_flipped - centroid
        dist_flipped = float(np.sqrt(np.sum(diff_flipped ** 2)))

        return min(dist_orig, dist_flipped)

    def classify_landmarks(
        self,
        landmarks: List[LandmarkPoint],
        confidence_threshold: Optional[float] = None
    ) -> PredictionResponse:
        """Classify given 21 landmarks into the most matching ISL letter or number."""
        threshold = confidence_threshold or settings.CONFIDENCE_THRESHOLD

        if not self.is_loaded and not self.load_model():
            return PredictionResponse(
                predicted_label="Model Not Loaded",
                confidence=0.0,
                status="unknown",
                feature_count=0,
            )

        features = self.extract_normalized_features(landmarks)
        if features is None or len(features) != 63:
            return PredictionResponse(
                predicted_label="Invalid Landmarks (must have 21 points)",
                confidence=0.0,
                status="unknown",
                feature_count=len(features) if features is not None else 0,
            )

        candidates: List[Tuple[str, float, float]] = []

        for label, centroid in self.isl_centroids.items():
            dist = self.compute_distance(features, centroid)
            # Mathematical confidence scaling matching frontend distribution
            conf = max(0.0, min(0.97, 1.02 - (dist / 2.8)))
            candidates.append((label, conf, dist))

        # Sort by highest confidence (or lowest distance)
        candidates.sort(key=lambda x: x[2])

        top_candidates = [
            PredictionCandidate(label=lbl, confidence=round(conf, 4), distance=round(dst, 4))
            for lbl, conf, dst in candidates[:5]
        ]

        if not candidates:
            return PredictionResponse(
                predicted_label="Unknown",
                confidence=0.0,
                status="unknown",
                feature_count=63,
            )

        best_label, best_conf, best_dist = candidates[0]
        status = "match" if best_conf >= threshold else "unknown"

        return PredictionResponse(
            predicted_label=best_label if status == "match" else f"Uncertain ({best_label})",
            confidence=round(best_conf, 4),
            status=status,
            distance=round(best_dist, 4),
            top_predictions=top_candidates,
            feature_count=63,
        )

gesture_engine = GestureEngine()
