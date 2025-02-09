from sqlalchemy import text
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from database import SessionLocal
import logging

logger = logging.getLogger(__name__)

async def db_heartbeat():
    try:
        db = SessionLocal()
        db.execute(text('SELECT 1'))
        db.close()
        logger.info("Database heartbeat successful")
    except Exception as e:
        logger.error(f"Database heartbeat failed: {str(e)}")

def setup_heartbeat():
    scheduler = AsyncIOScheduler()
    scheduler.add_job(db_heartbeat, 'interval', minutes=1)
    scheduler.start()
    logger.info("Database heartbeat scheduler started")
    return scheduler
