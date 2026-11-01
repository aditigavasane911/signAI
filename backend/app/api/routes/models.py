"""Model Metadata and Inspection Routes"""
from fastapi import APIRouter
from app.models.schemas import ModelInfoResponse
from app.services.gesture_engine import gesture_engine
from app.services.phrase_engine import phrase_engine

router = APIRouter(prefix="/models", tags=["Models"])

@router.get("/info", response_model=ModelInfoResponse)
async def get_model_information():
    """Retrieve metadata about active sign language and phrase recognition models."""
    return ModelInfoResponse(
        isl_classes=gesture_engine.isl_classes,
        phrase_classes=phrase_engine.phrase_classes,
        total_isl_classes=len(gesture_engine.isl_classes),
        total_phrase_classes=len(phrase_engine.phrase_classes),
        isl_trained_date=gesture_engine.isl_metadata.get("trained_timestamp", "2026-10-28"),
        phrases_trained_date=phrase_engine.metadata.get("trained_timestamp", "2026-10-29"),
        feature_dim=63,
    )
