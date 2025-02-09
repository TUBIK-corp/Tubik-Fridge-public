from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
import schemas
from auth import auth_middleware
from datetime import datetime

router = APIRouter()

@router.get("/", response_model=List[schemas.ShoppingItem]) 
async def get_shopping_list(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_middleware)
):
    items = db.query(models.ShoppingItem)\
        .filter(models.ShoppingItem.user_id == current_user.id)\
        .order_by(models.ShoppingItem.created_at.desc())\
        .all()
    return items

@router.post("/", response_model=schemas.ShoppingItem) 
async def add_shopping_item(
    item: schemas.ShoppingItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_middleware)
):
    db_item = models.ShoppingItem(
        name=item.name,
        quantity=item.quantity,
        user_id=current_user.id
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/{item_id}", response_model=schemas.ShoppingItem)
async def update_shopping_item(
    item_id: int,
    item_data: schemas.ShoppingItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_middleware)
):
    item = db.query(models.ShoppingItem).filter(
        models.ShoppingItem.id == item_id,
        models.ShoppingItem.user_id == current_user.id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    for key, value in item_data.dict().items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}")  
async def remove_shopping_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_middleware)
):
    item = db.query(models.ShoppingItem)\
        .filter(
            models.ShoppingItem.id == item_id,
            models.ShoppingItem.user_id == current_user.id
        ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(item)
    db.commit()
    return {"success": True}

@router.post("/{item_id}/bought") 
async def mark_item_bought(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_middleware)
):
    item = db.query(models.ShoppingItem)\
        .filter(
            models.ShoppingItem.id == item_id,
            models.ShoppingItem.user_id == current_user.id
        ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(item)
    db.commit()
    
    return {"success": True}

