"""SQLAlchemy Database ORM Models"""
from datetime import datetime
import uuid
from sqlalchemy import Column, String, Numeric, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from .session import Base

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class Translation(Base):
    __tablename__ = "translations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    recognition_mode = Column(String(50), default="isl", nullable=False)
    predicted_label = Column(String(100), nullable=False)
    confidence = Column(Numeric(5, 4), nullable=False)
    status = Column(String(20), default="match")
    hand_count = Column(Integer, default=1)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class SavedPhrase(Base):
    __tablename__ = "saved_phrases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    phrase_key = Column(String(100), nullable=False)
    phrase_name = Column(String(150), nullable=False)
    category = Column(String(50), default="everyday")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
