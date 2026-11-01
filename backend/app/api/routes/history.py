"""Translation and Gesture Recognition History Routes
Supports both direct SQLAlchemy PostgreSQL connection and Supabase REST fallback.
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db, supabase_admin
from app.db.models import Translation

router = APIRouter(prefix="/history", tags=["History"])

class SaveTranslationPayload(BaseModel):
    user_id: Optional[str] = None
    recognition_mode: str = "isl"
    predicted_label: str
    confidence: float
    status: str = "match"
    hand_count: int = 1
    notes: Optional[str] = None

class TranslationItemResponse(BaseModel):
    id: str
    user_id: Optional[str]
    recognition_mode: str
    predicted_label: str
    confidence: float
    status: str
    hand_count: int
    notes: Optional[str]
    created_at: str

@router.get("", response_model=List[TranslationItemResponse])
async def list_translations(
    user_id: Optional[str] = Query(None, description="Filter history by user UUID"),
    limit: int = Query(20, le=100),
    db: Optional[Session] = Depends(get_db)
):
    """Retrieve translation history from PostgreSQL (via SQLAlchemy or Supabase client)."""
    # 1. Try SQLAlchemy PostgreSQL connection first
    if db is not None:
        try:
            query = db.query(Translation)
            if user_id:
                query = query.filter(Translation.user_id == user_id)
            results = query.order_by(Translation.created_at.desc()).limit(limit).all()

            return [
                TranslationItemResponse(
                    id=str(item.id),
                    user_id=str(item.user_id) if item.user_id else None,
                    recognition_mode=item.recognition_mode,
                    predicted_label=item.predicted_label,
                    confidence=float(item.confidence),
                    status=item.status or "match",
                    hand_count=item.hand_count or 1,
                    notes=item.notes,
                    created_at=item.created_at.isoformat() if item.created_at else "",
                )
                for item in results
            ]
        except Exception:
            # Fall through to Supabase client
            pass

    # 2. Fallback to Supabase client
    if supabase_admin is not None:
        try:
            query = supabase_admin.table("translations").select("*")
            if user_id:
                query = query.eq("user_id", user_id)
            response = query.order("created_at", desc=True).limit(limit).execute()

            return [
                TranslationItemResponse(
                    id=str(item.get("id")),
                    user_id=str(item.get("user_id")) if item.get("user_id") else None,
                    recognition_mode=item.get("recognition_mode", "isl"),
                    predicted_label=item.get("predicted_label", ""),
                    confidence=float(item.get("confidence", 0.0)),
                    status=item.get("status", "match"),
                    hand_count=int(item.get("hand_count", 1)),
                    notes=item.get("notes"),
                    created_at=str(item.get("created_at", "")),
                )
                for item in (response.data or [])
            ]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")

    return []

@router.post("", response_model=TranslationItemResponse)
async def save_translation(
    payload: SaveTranslationPayload,
    db: Optional[Session] = Depends(get_db)
):
    """Persist a recognition result into PostgreSQL."""
    # 1. Try direct SQLAlchemy PostgreSQL connection
    if db is not None:
        try:
            new_record = Translation(
                user_id=UUID(payload.user_id) if payload.user_id else None,
                recognition_mode=payload.recognition_mode,
                predicted_label=payload.predicted_label,
                confidence=payload.confidence,
                status=payload.status,
                hand_count=payload.hand_count,
                notes=payload.notes,
            )
            db.add(new_record)
            db.commit()
            db.refresh(new_record)

            return TranslationItemResponse(
                id=str(new_record.id),
                user_id=str(new_record.user_id) if new_record.user_id else None,
                recognition_mode=new_record.recognition_mode,
                predicted_label=new_record.predicted_label,
                confidence=float(new_record.confidence),
                status=new_record.status or "match",
                hand_count=new_record.hand_count or 1,
                notes=new_record.notes,
                created_at=new_record.created_at.isoformat() if new_record.created_at else "",
            )
        except Exception:
            db.rollback()
            # Fall through to Supabase client
            pass

    # 2. Try Supabase Client
    if supabase_admin is not None:
        try:
            insert_data = {
                "recognition_mode": payload.recognition_mode,
                "predicted_label": payload.predicted_label,
                "confidence": payload.confidence,
                "status": payload.status,
                "hand_count": payload.hand_count,
                "notes": payload.notes,
            }
            if payload.user_id:
                insert_data["user_id"] = payload.user_id

            res = supabase_admin.table("translations").insert(insert_data).execute()
            if res.data and len(res.data) > 0:
                item = res.data[0]
                return TranslationItemResponse(
                    id=str(item.get("id")),
                    user_id=str(item.get("user_id")) if item.get("user_id") else None,
                    recognition_mode=item.get("recognition_mode", "isl"),
                    predicted_label=item.get("predicted_label", ""),
                    confidence=float(item.get("confidence", 0.0)),
                    status=item.get("status", "match"),
                    hand_count=int(item.get("hand_count", 1)),
                    notes=item.get("notes"),
                    created_at=str(item.get("created_at", "")),
                )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to persist translation: {str(e)}")

    raise HTTPException(
        status_code=503,
        detail="PostgreSQL database service unavailable. Please check credentials in backend/.env"
    )
