from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import uvicorn
from routes import auth
from database import SessionLocal, engine, get_db
import models
import schemas
from auth import auth_middleware
from routes import telegram
import logging
from heartbeat import setup_heartbeat

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartFridge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    setup_heartbeat()
    logging.info("Application startup complete")

from routes import products, shopping, analytics
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(shopping.router, prefix="/api/shopping", tags=["shopping"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(telegram.router, prefix="/api/telegram", tags=["telegram"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=24030, reload=True)
