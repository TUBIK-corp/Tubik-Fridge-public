from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx
import jwt
from jwt.exceptions import InvalidTokenError, PyJWTError
from datetime import datetime
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
import os

security = HTTPBearer()
JWT_KEY = os.getenv("JWT_KEY")
JWT_ISSUER = os.getenv("JWT_ISSUER")

async def get_user_info(token: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            'https://auth.tubik-corp.ru/api/info/me',
            headers={'Authorization': f'Bearer {token}'}
        )
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid token")
        return response.json()

async def verify_and_sync_user(token: str, db: Session):
    try:
        payload = jwt.decode(
            token, 
            JWT_KEY,
            algorithms=["HS256"],
            issuer=JWT_ISSUER,
            audience=JWT_ISSUER,
            options={
                "verify_signature": True,
                "verify_aud": True,
                "verify_iss": True,
                "verify_exp": True
            }
        )
        print("Payload decoded successfully")
        
        sso_id = payload.get("user_id")
        if not sso_id:
            raise HTTPException(status_code=401, detail="Invalid token format")

        user = db.query(models.User).filter(models.User.sso_id == sso_id).first()
        
        if not user:
            user_info = await get_user_info(token)
            user = models.User(
                sso_id=sso_id,
                first_name=user_info['firstName'],
                last_name=user_info['lastName']
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        return user

    except InvalidTokenError as e:
        raise HTTPException(status_code=401, detail="Invalid token") from e

async def auth_middleware(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    user = await verify_and_sync_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
