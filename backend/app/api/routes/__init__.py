from .health import router as health_router
from .gestures import router as gestures_router
from .phrases import router as phrases_router
from .models import router as models_router
from .history import router as history_router

__all__ = ["health_router", "gestures_router", "phrases_router", "models_router", "history_router"]
