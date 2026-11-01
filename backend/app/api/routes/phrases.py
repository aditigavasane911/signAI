"""Everyday & Multi-Hand Phrases Classification Routes"""
from typing import List
from fastapi import APIRouter
from app.models.schemas import (
    ClassifyPhraseRequest,
    PhrasePredictionResponse,
)
from app.services.phrase_engine import phrase_engine

router = APIRouter(prefix="/phrases", tags=["Phrases"])

@router.get("/classes", response_model=List[str])
async def get_phrase_classes():
    """Retrieve list of all supported everyday phrase signs."""
    return phrase_engine.phrase_classes

@router.post("/classify-landmarks", response_model=PhrasePredictionResponse)
async def classify_phrase_landmarks(payload: ClassifyPhraseRequest):
    """Classify hand landmarks against phrase centroids (e.g. Namaste, Help, Thank You)."""
    return phrase_engine.classify_phrase(
        payload.landmarks,
        hand_count=payload.hand_count or 1
    )
