from sqlalchemy import func
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db
from models import Product
from auth import auth_middleware
import pytz

router = APIRouter()

def _convert_to_kg(quantity: float, unit: str) -> float:
    conversion = {
        'мг': 0.000001,
        'г': 0.001,
        'кг': 1.0
    }
    return quantity * conversion.get(unit, 1.0)

def _convert_to_liters(quantity: float, unit: str) -> float:
    conversion = {
        'мл': 0.001,
        'л': 1.0
    }
    return quantity * conversion.get(unit, 1.0)

@router.get("/consumption")
async def get_consumption_analytics(
    start_date: str,
    end_date: str,
    db: Session = Depends(get_db),
    user = Depends(auth_middleware)
):
    try:
        start_date = datetime.fromisoformat(start_date).astimezone(pytz.UTC)
        end_date = datetime.fromisoformat(end_date).astimezone(pytz.UTC)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Неверный формат даты"
        )

    user_filter = (Product.user_id == user.id)

    added_products = db.query(Product).filter(
        user_filter,
        Product.created_at.between(start_date, end_date)
    ).all()

    added_stats = {}
    for product in added_products:
        category = product.type
        if category not in added_stats:
            added_stats[category] = {"weight_kg": 0.0, "volume_l": 0.0, "count": 0}

        added_stats[category]["count"] += 1

        if product.measurement_type == "weight":
            added_stats[category]["weight_kg"] += _convert_to_kg(product.quantity, product.unit_type)
        elif product.measurement_type == "volume":
            added_stats[category]["volume_l"] += _convert_to_liters(product.quantity, product.unit_type)

    removed_products = db.query(Product).filter(
        user_filter,
        Product.deleted_at.between(start_date, end_date)
    ).all()

    removed_stats = {}
    for product in removed_products:
        category = product.type
        if category not in removed_stats:
            removed_stats[category] = {"weight_kg": 0.0, "volume_l": 0.0, "count": 0}

        removed_stats[category]["count"] += 1

        if product.measurement_type == "weight":
            removed_stats[category]["weight_kg"] += _convert_to_kg(product.quantity, product.unit_type)
        elif product.measurement_type == "volume":
            removed_stats[category]["volume_l"] += _convert_to_liters(product.quantity, product.unit_type)

    current_products = db.query(Product).filter(
        user_filter,
        Product.deleted_at.is_(None)
    ).all()

    current_time = datetime.now(pytz.UTC)
    expired_count = 0
    total_weight = 0.0
    total_volume = 0.0
    total_count = len(current_products)

    for product in current_products:
        if product.expiry_date and isinstance(product.expiry_date, datetime):
            expiry_date = product.expiry_date.astimezone(pytz.UTC) if product.expiry_date.tzinfo else pytz.UTC.localize(product.expiry_date)
            if expiry_date < current_time:
                expired_count += 1

        if product.measurement_type == "weight":
            total_weight += _convert_to_kg(product.quantity, product.unit_type)
        elif product.measurement_type == "volume":
            total_volume += _convert_to_liters(product.quantity, product.unit_type)

    top_added = db.query(
        Product.name,
        Product.type,
        func.sum(Product.quantity).label('total'),
        Product.measurement_type,
        Product.unit_type
    ).filter(
        user_filter,
        Product.created_at.between(start_date, end_date)
    ).group_by(Product.name, Product.type, Product.measurement_type, Product.unit_type
    ).order_by(func.sum(Product.quantity).desc()).limit(5).all()

    return {
        "added": added_stats,
        "removed": removed_stats,
        "current": {
            "total_items": len(current_products),
            "expired": expired_count,
            "total_weight_kg": round(total_weight, 2),
            "total_volume_l": round(total_volume, 2),
            "total_count": total_count
        },
        "top_added": [
            {
                "name": name,
                "category": type_,
                "quantity": round(float(total), 2),
                "measurement_type": measurement_type,
                "unit_type": unit_type
            }
            for name, type_, total, measurement_type, unit_type in top_added
        ]
    }