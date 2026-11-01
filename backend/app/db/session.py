"""PostgreSQL Database Session Module
Provides SQLAlchemy engine, connection pooling, dependency injection, and Supabase Admin client.
"""

import logging
from typing import Generator, Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

# Initialize Supabase Python Client
supabase_admin = None
if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
    try:
        from supabase import create_client
        supabase_admin = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        logger.info("Supabase Admin Client initialized successfully.")
    except Exception as e:
        logger.warning(f"Could not initialize Supabase Admin client: {e}")

# Formulate database URL (Supabase or direct PostgreSQL)
db_url = settings.DATABASE_URL

engine = None
SessionLocal = None

if db_url and db_url.startswith("postgres"):
    # Ensure psycopg2 driver is specified for SQLAlchemy
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    try:
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_recycle=300,
            pool_size=5,
            max_overflow=10,
        )
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        logger.info("Configured PostgreSQL database engine.")
    except Exception as e:
        logger.warning(f"Could not initialize PostgreSQL engine: {e}")
        engine = None
        SessionLocal = None
else:
    logger.info("DATABASE_URL not configured. Running in memory/offline mode for database operations.")

def get_db() -> Generator[Optional[Session], None, None]:
    """FastAPI database session dependency."""
    if SessionLocal is None:
        yield None
        return

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
