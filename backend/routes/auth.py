
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
import httpx
import os

from auth import verify_and_sync_user 
from typing import Optional
from database import get_db
from sqlalchemy.orm import Session
import jwt
from pydantic import BaseModel

router = APIRouter()
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")

class CodeExchange(BaseModel):
    code: str

@router.post("/callback")
async def callback(code_data: CodeExchange, db: Session = Depends(get_db)):
    try:
        print(CLIENT_ID)
        print(CLIENT_SECRET)
        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://auth.tubik-corp.ru/api/auth/code-exchange',
                json={
                    "ClientId": CLIENT_ID,
                    "ClientSecret": CLIENT_SECRET,
                    "TempCode": code_data.code
                }
            )
        print(response.status_code)
        if response.status_code != 200:
            message = response.text
            print(message)
            raise HTTPException(status_code=400, detail="Failed to exchange code")
            
        token = response.text.strip('"')
        
        user = await verify_and_sync_user(token, db)
        
        return {"token": token}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@router.get("/check")
async def auth_check(request: Request, db: Session = Depends(get_db)):
    try:
        jwt_cookie = request.cookies.get("jwt")
        
        if not jwt_cookie:
            raise HTTPException(status_code=401, detail="No JWT token found")

        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://auth.tubik-corp.ru/api/auth/check',
                headers={
                    'Cookie': f'jwt={jwt_cookie}',
                    'Content-Type': 'application/json'
                }
            )
        
        if response.status_code == 200:
            return {"status": "ok"}
        else:
            raise HTTPException(status_code=response.status_code, detail="Auth check failed")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))