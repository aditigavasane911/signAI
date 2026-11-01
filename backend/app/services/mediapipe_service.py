"""MediaPipe Server-Side Vision Service
Provides optional server-side landmark detection using hand_landmarker.task.
"""

import logging
from pathlib import Path
from typing import List, Optional

import numpy as np
from app.core.config import settings
from app.models.schemas import LandmarkPoint

logger = logging.getLogger(__name__)

class MediaPipeService:
    def __init__(self):
        self.detector = None
        self.is_initialized: bool = False
        self._init_detector()

    def _init_detector(self):
        task_path = settings.hand_landmarker_path
        if not task_path.exists():
            alt_path = Path("backend/app/data/hand_landmarker.task")
            if alt_path.exists():
                task_path = alt_path
            else:
                logger.warning(f"MediaPipe task asset not found at {task_path}")
                return

        try:
            import mediapipe as mp
            from mediapipe.tasks import python
            from mediapipe.tasks.python import vision

            base_options = python.BaseOptions(model_asset_path=str(task_path))
            options = vision.HandLandmarkerOptions(
                base_options=base_options,
                num_hands=2,
                min_hand_detection_confidence=0.1,
                min_hand_presence_confidence=0.1,
            )
            self.detector = vision.HandLandmarker.create_from_options(options)
            self.is_initialized = True
            logger.info("Server-side MediaPipe Hand Landmarker initialized successfully.")
        except Exception as e:
            logger.warning(f"Could not initialize server-side MediaPipe detector: {e}")
            self.detector = None
            self.is_initialized = False

    def detect_landmarks_from_image_bytes(self, image_bytes: bytes) -> Optional[List[List[LandmarkPoint]]]:
        if not self.is_initialized or self.detector is None:
            return None

        try:
            import cv2
            import mediapipe as mp

            np_arr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if img is None:
                return None

            rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_img)

            detection_result = self.detector.detect(mp_image)
            if not detection_result.hand_landmarks:
                return None

            hands_result: List[List[LandmarkPoint]] = []
            for hand in detection_result.hand_landmarks:
                landmarks = [
                    LandmarkPoint(x=float(pt.x), y=float(pt.y), z=float(pt.z))
                    for pt in hand
                ]
                hands_result.append(landmarks)

            return hands_result
        except Exception as e:
            logger.error(f"Error during MediaPipe landmark extraction: {e}")
            return None

mediapipe_service = MediaPipeService()
