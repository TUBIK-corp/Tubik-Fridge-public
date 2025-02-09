from sqlalchemy import Column, Integer, String, Float, DateTime, ARRAY, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import pytz

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    sso_id = Column(String, unique=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    chat_id = Column(BigInteger, unique=True, nullable=True)
    code = Column(String, nullable=True)
    code_expires = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    products = relationship("Product", back_populates="owner")
    shopping_items = relationship("ShoppingItem", back_populates="owner")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    type = Column(String)
    manufacture_date = Column(DateTime(timezone=True), nullable=True)
    expiry_date = Column(DateTime(timezone=True))
    quantity = Column(Float, default=0)
    unit_type = Column(String, default='кг')
    measurement_type = Column(String, default='weight')
    calories = Column(Float, default=0)
    proteins = Column(Float, default=0)
    fats = Column(Float, default=0)
    carbohydrates = Column(Float, default=0)
    allergens = Column(ARRAY(String), default=list)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(pytz.UTC))
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    owner = relationship("User", back_populates="products")

class ShoppingItem(Base):
    __tablename__ = "shopping_list"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    quantity = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    owner = relationship("User", back_populates="shopping_items")