"""ISL & Gesture Classification Routes"""
from typing import List
from fastapi import APIRouter, File, HTTPException, UploadFile
from app.models.schemas import (
    ClassifyLandmarksRequest,
    PredictionResponse,
)
from app.services.gesture_engine import gesture_engine
from app.services.mediapipe_service import mediapipe_service

router = APIRouter(prefix="/gestures", tags=["Gestures"])

@router.get("/classes", response_model=List[str])
async def get_supported_isl_classes():
    """Retrieve list of all supported Indian Sign Language alphabet & digit classes."""
    return gesture_engine.isl_classes

@router.post("/classify-landmarks", response_model=PredictionResponse)
async def classify_landmarks(payload: ClassifyLandmarksRequest):
    """Classify 21 normalized 3D hand landmarks into an ISL alphabet/number."""
    if len(payload.landmarks) != 21:
        raise HTTPException(
            status_code=422,
            detail=f"Expected 21 landmarks, received {len(payload.landmarks)}"
        )
    return gesture_engine.classify_landmarks(payload.landmarks)

@router.post("/classify-image", response_model=PredictionResponse)
async def classify_image(file: UploadFile = File(...)):
    """Extract hand landmarks from an uploaded image and classify the ISL gesture."""
    image_bytes = await file.read()
    detected_hands = mediapipe_service.detect_landmarks_from_image_bytes(image_bytes)

    if not detected_hands or len(detected_hands) == 0:
        return PredictionResponse(
            predicted_label="No Hands Detected",
            confidence=0.0,
            status="unknown",
            feature_count=0,
        )

    return gesture_engine.classify_landmarks(detected_hands[0])
