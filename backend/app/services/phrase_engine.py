"""Phrase Engine Service
Performs real-time centroid-based classification for multi-hand and everyday phrase gestures.
"""

import json
import logging
import math
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

import numpy as np
from app.core.config import settings
from app.models.schemas import LandmarkPoint, PhrasePredictionResponse

logger = logging.getLogger(__name__)

class PhraseEngine:
    def __init__(self):
        self.phrase_classes: List[str] = []
        self.phrase_centroids: Dict[str, np.ndarray] = {}
        self.metadata: Dict[str, Any] = {}
        self.is_loaded: bool = False
        self.load_model()

    def load_model(self) -> bool:
        path = settings.phrases_model_path
        if not path.exists():
            alt_path = Path("backend/app/data/phrases_model.json")
            if alt_path.exists():
                path = alt_path
            else:
                logger.warning(f"Phrases Model file not found at {path}")
                self.is_loaded = False
                return False

        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)

            self.phrase_classes = data.get("classes", [])
            centroids_raw = data.get("centroids", {})
            self.phrase_centroids = {
                cls: np.array(vec, dtype=np.float32)
                for cls, vec in centroids_raw.items()
            }
            self.metadata = {
                "classes_count": len(self.phrase_classes),
                "feature_dim": data.get("feature_dim", 63),
                "trained_timestamp": data.get("trained_timestamp", "2026-10-29"),
            }
            self.is_loaded = True
            logger.info(f"Loaded Phrase model with {len(self.phrase_centroids)} class centroids.")
            return True
        except Exception as e:
            logger.error(f"Failed to load Phrase model: {e}")
            self.is_loaded = False
            return False

    @staticmethod
    def extract_features(landmarks: List[LandmarkPoint]) -> Optional[np.ndarray]:
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
        diff = features - centroid
        dist_orig = float(np.sqrt(np.sum(diff ** 2)))

        # Horizontally mirrored check
        features_flipped = features.copy()
        features_flipped[0::3] = -features_flipped[0::3]
        diff_flipped = features_flipped - centroid
        dist_flipped = float(np.sqrt(np.sum(diff_flipped ** 2)))

        return min(dist_orig, dist_flipped)

    def classify_phrase(
        self,
        landmarks_list: List[List[LandmarkPoint]],
        hand_count: int = 1,
        confidence_threshold: Optional[float] = None
    ) -> PhrasePredictionResponse:
        """Classify landmarks against phrase centroids."""
        threshold = confidence_threshold or 0.65

        if not self.is_loaded and not self.load_model():
            return PhrasePredictionResponse(
                predicted_phrase="Phrase Model Not Loaded",
                confidence=0.0,
                status="unknown",
                hand_count=hand_count,
            )

        if not landmarks_list or len(landmarks_list) == 0:
            return PhrasePredictionResponse(
                predicted_phrase="No landmarks provided",
                confidence=0.0,
                status="unknown",
                hand_count=0,
            )

        # Primary hand features
        primary_landmarks = landmarks_list[0]
        features = self.extract_features(primary_landmarks)

        if features is None or len(features) != 63:
            return PhrasePredictionResponse(
                predicted_phrase="Invalid Hand Landmarks",
                confidence=0.0,
                status="unknown",
                hand_count=hand_count,
            )

        min_distance = float("inf")
        best_class = ""

        for cls, centroid in self.phrase_centroids.items():
            dist = self.compute_distance(features, centroid)
            if dist < min_distance:
                min_distance = dist
                best_class = cls

        if not best_class:
            return PhrasePredictionResponse(
                predicted_phrase="Unknown Phrase",
                confidence=0.0,
                status="unknown",
                hand_count=hand_count,
            )

        # Confidence scaling aligned with phrases distribution (range / 3.8)
        confidence = max(0.0, min(0.97, 1.02 - (min_distance / 3.8)))
        status = "match" if confidence >= threshold else "unknown"

        display_name = best_class.replace("_", " ").title()

        return PhrasePredictionResponse(
            predicted_phrase=display_name if status == "match" else f"Uncertain ({display_name})",
            confidence=round(confidence, 4),
            status=status,
            hand_count=hand_count,
        )

phrase_engine = PhraseEngine()
