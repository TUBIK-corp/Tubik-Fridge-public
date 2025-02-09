
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from database import get_db
import models
import pytz
from models import Product
import schemas
from auth import auth_middleware

router = APIRouter()

@router.get("/")
async def get_products(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_middleware)
):
    return db.query(models.Product).filter(
        models.Product.user_id == current_user.id,
        models.Product.deleted_at == None 
    ).all()

@router.get("/all")
async def get_all_products(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_middleware)
):
    return db.query(models.Product).filter(
        models.Product.user_id == current_user.id
    ).all()

@router.post("/", response_model=schemas.Product)
async def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_middleware)
):
    try:
        print("Received product data:", product.dict())
        product_dict = product.dict()
        
        if product_dict.get('manufacture_date'):
            product_dict['manufacture_date'] = datetime.fromisoformat(str(product_dict['manufacture_date']).replace('Z', '+00:00'))
        product_dict['expiry_date'] = datetime.fromisoformat(str(product_dict['expiry_date']).replace('Z', '+00:00'))
        
        db_product = models.Product(**product_dict, user_id=current_user.id)
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product
    except Exception as e:
        print("Error creating product:", str(e))
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_middleware)
):
    product = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.user_id == current_user.id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product.deleted_at = datetime.now(pytz.UTC)  
    db.commit()
    return {"status": "success"}

@router.get("/expiring/")
async def get_expiring_products(
    db: Session = Depends(get_db),
    user = Depends(auth_middleware)
):
    expiring_date = datetime.now() + timedelta(days=7)
    products = db.query(Product).filter(
        Product.deleted_at == None, 
        Product.expiry_date <= expiring_date,
        Product.user_id == user.id
    ).all()
    return products

@router.get("/categories/", response_model=List[str])
async def get_product_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_middleware)
):
    categories = db.query(models.Product.type).filter(
        models.Product.user_id == current_user.id,
        models.Product.deleted_at == None,
        models.Product.type.isnot(None)
    ).distinct().all()
    
    return [type_[0] for type_ in categories if type_[0]]
