from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
from database import get_db
from models import User
from auth import auth_middleware

router = APIRouter()

@router.post("/generate-code")
async def generate_verification_code(
    db: Session = Depends(get_db),
    user: User = Depends(auth_middleware)
):
    code = f"{secrets.randbelow(1000000):06d}"
    user.code = code
    user.code_expires = datetime.utcnow() + timedelta(minutes=10)
    db.commit()
    return {"code": code, "expires": user.code_expires.isoformat()}

@router.get("/me")
async def get_telegram_info(
    user: User = Depends(auth_middleware)
):
    return {"chat_id": user.chat_id}
