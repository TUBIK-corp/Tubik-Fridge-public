# schemas.py
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, validator
from datetime import datetime, date

class ProductBase(BaseModel):
    name: str
    type: str
    manufacture_date: Optional[datetime] = None
    expiry_date: datetime
    quantity: float = 0
    unit_type: str = 'кг'
    measurement_type: str = 'weight'
    calories: float = 0
    proteins: float = 0
    fats: float = 0
    carbohydrates: float = 0
    allergens: List[str] = []


class UserBase(BaseModel):
    first_name: str
    last_name: str
    chat_id: Optional[int] = None
    code: Optional[str] = None

class User(UserBase):
    id: int
    sso_id: str
    created_at: datetime

    class Config:
        orm_mode = True

class ProductCreate(ProductBase):
    pass


class Product(ProductBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True

class ShoppingItemBase(BaseModel):
    name: str
    quantity: int
    unit_type: str = 'шт'        
    category: Optional[str] = None 


class ShoppingItemCreate(ShoppingItemBase):
    name: Optional[str] = None
    quantity: Optional[int] = 1
    unit_type: Optional[str] = 'шт'
    category: Optional[str] = None


class ShoppingItem(ShoppingItemBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        orm_mode = True