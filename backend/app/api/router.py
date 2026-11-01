"""API Router Module - Assembles all v1 routes"""
from fastapi import APIRouter
from app.api.routes import health_router, gestures_router, phrases_router, models_router

api_router = APIRouter(prefix="/v1")

api_router.include_router(health_router)
api_router.include_router(gestures_router)
api_router.include_router(phrases_router)
api_router.include_router(models_router)
