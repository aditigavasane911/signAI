"""SignAI FastAPI Server
Main entry point for the backend machine learning and REST inference service.
"""

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.core.config import settings
from app.api.router import api_router
from app.services.gesture_engine import gesture_engine
from app.services.phrase_engine import phrase_engine

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("signai.backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context for model loading and resource teardown."""
    logger.info("Initializing SignAI ML Engines...")
    gesture_engine.load_model()
    phrase_engine.load_model()
    logger.info(
        f"SignAI ready: {len(gesture_engine.isl_classes)} ISL classes, "
        f"{len(phrase_engine.phrase_classes)} Phrase classes."
    )
    yield
    logger.info("Shutting down SignAI backend service.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="SignAI Computer Vision & Deep Learning Gesture Recognition Backend API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Cross-Origin Resource Sharing (CORS) Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount consolidated v1 API under /api
app.include_router(api_router, prefix="/api")

@app.get("/", tags=["Root"])
async def root():
    """SignAI Backend Welcome & Quick Links"""
    return {
        "message": "Welcome to SignAI Backend API Service",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/api/v1/health",
        "models": "/api/v1/models/info",
        "status": "online",
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
