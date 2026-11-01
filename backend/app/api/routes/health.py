"""Health Check Route"""
from datetime import datetime
from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.services.gesture_engine import gesture_engine
from app.services.phrase_engine import phrase_engine

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
async def check_health():
    """Verify backend health and model loading status."""
    is_ready = gesture_engine.is_loaded and phrase_engine.is_loaded
    return HealthResponse(
        status="healthy" if is_ready else "degraded",
        models_loaded=is_ready,
        isl_classes_count=len(gesture_engine.isl_classes),
        phrases_classes_count=len(phrase_engine.phrase_classes),
        timestamp=datetime.utcnow().isoformat() + "Z",
    )
