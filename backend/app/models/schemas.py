"""Pydantic Request and Response Schemas"""
from typing import List, Optional
from pydantic import BaseModel, Field

class LandmarkPoint(BaseModel):
    x: float = Field(..., description="Normalized X coordinate (0.0 - 1.0)")
    y: float = Field(..., description="Normalized Y coordinate (0.0 - 1.0)")
    z: float = Field(..., description="Normalized Z coordinate (depth estimation)")

class ClassifyLandmarksRequest(BaseModel):
    landmarks: List[LandmarkPoint] = Field(..., description="Array of 21 hand landmarks from MediaPipe")
    num_hands: Optional[int] = Field(1, description="Number of hands detected")
    mode: Optional[str] = Field("isl", description="Recognition mode: isl, everyday, or numbers")

class ClassifyPhraseRequest(BaseModel):
    landmarks: List[List[LandmarkPoint]] = Field(..., description="List of landmark sets (for two hands)")
    hand_count: Optional[int] = Field(2, description="Count of hands detected (1 or 2)")

class PredictionCandidate(BaseModel):
    label: str
    confidence: float
    distance: float

class PredictionResponse(BaseModel):
    predicted_label: str
    confidence: float
    status: str = Field("match", description="'match' if above threshold, else 'unknown'")
    distance: Optional[float] = None
    top_predictions: List[PredictionCandidate] = []
    feature_count: int = 63

class PhrasePredictionResponse(BaseModel):
    predicted_phrase: str
    confidence: float
    status: str = Field("match", description="'match' if above threshold, else 'unknown'")
    hand_count: int

class ModelInfoResponse(BaseModel):
    isl_classes: List[str]
    phrase_classes: List[str]
    total_isl_classes: int
    total_phrase_classes: int
    isl_trained_date: str
    phrases_trained_date: str
    feature_dim: int

class HealthResponse(BaseModel):
    status: str
    models_loaded: bool
    isl_classes_count: int
    phrases_classes_count: int
    timestamp: str
