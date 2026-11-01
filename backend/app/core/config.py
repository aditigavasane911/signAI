"""Application Core Configuration Module"""
import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

# Absolute path to backend directory
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
APP_DIR = BACKEND_DIR / "app"
DATA_DIR_DEFAULT = APP_DIR / "data"

class Settings(BaseSettings):
    APP_NAME: str = "SignAI Backend API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "127.0.0.1"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"

    # Database & Supabase Configuration
    DATABASE_URL: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_PUBLISHABLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""


    # Inference & Model defaults
    CONFIDENCE_THRESHOLD: float = 0.70
    FEATURE_DIM: int = 63

    
    # Paths
    DATA_DIR: Path = DATA_DIR_DEFAULT
    ISL_MODEL_FILE: str = "isl_model.json"
    PHRASES_MODEL_FILE: str = "phrases_model.json"
    HAND_LANDMARKER_TASK: str = "hand_landmarker.task"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def data_dir_resolved(self) -> Path:
        # Check standard default app/data first
        if DATA_DIR_DEFAULT.exists():
            return DATA_DIR_DEFAULT
        p = Path(self.DATA_DIR)
        if p.is_absolute() and p.exists():
            return p
        if (BACKEND_DIR / p).exists():
            return BACKEND_DIR / p
        if p.exists():
            return p.resolve()
        return DATA_DIR_DEFAULT

    @property
    def isl_model_path(self) -> Path:
        return self.data_dir_resolved / self.ISL_MODEL_FILE

    @property
    def phrases_model_path(self) -> Path:
        return self.data_dir_resolved / self.PHRASES_MODEL_FILE

    @property
    def hand_landmarker_path(self) -> Path:
        return self.data_dir_resolved / self.HAND_LANDMARKER_TASK

    class Config:
        env_file = str(BACKEND_DIR / ".env")
        env_file_encoding = "utf-8"
        extra = "allow"

settings = Settings()

