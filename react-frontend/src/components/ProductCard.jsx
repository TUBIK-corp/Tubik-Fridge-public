import React, { useState, useCallback } from 'react';
import './ProductCard.css';

import CartIcon from '../assets/CartBlue.svg';
import CalendarIcon from '../assets/CalendarBlue.svg';
import ObjectsIcon from '../assets/ObjectsBlue.svg';
import WarningIcon from '../assets/Warning.svg';
import AllergenIcon from '../assets/Allergen.svg';

const ProductCard = ({ product, onDelete, onClick, viewMode }) => {
  const expiryDate = new Date(product.expiry_date);
  const isExpired = new Date() > expiryDate;
  const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));

  const getDayWord = (days) => {
    const absoluteDays = Math.abs(days);
    const lastDigit = absoluteDays % 10;
    const lastTwo = absoluteDays % 100;

    if (lastTwo >= 11 && lastTwo <= 14) return 'дней';

    switch(lastDigit) {
      case 1: return 'день';
      case 2:
      case 3:
      case 4: return 'дня';
      default: return 'дней';
    }
  };

  const getTextColor = () => {
    const MAX_DAYS = 30;
    if (isExpired) return '#ff4444';
    if (daysUntilExpiry <= MAX_DAYS) {
      const ratio = daysUntilExpiry / MAX_DAYS;
      const hue = 200 * ratio;
      return `hsl(${hue}, 100%, 40%)`;
    }
    return 'hsl(200, 100%, 40%)';
  };

  const getCardStyles = useCallback(() => {
    const MAX_DAYS = 30;
    let border = '1px solid hsl(200, 100%, 50%)';
    let background = 'white';

    if (isExpired) {
      border = '1px solid #ff0000';
      background = '#f8d8d8';
    } else if (daysUntilExpiry <= MAX_DAYS) {
      const ratio = daysUntilExpiry / MAX_DAYS;
      const hue = 200 * ratio;
      border = `1px solid hsl(${hue}, 100%, 70%)`;
      background = `hsla(${hue}, 100%, 97%, 0.05)`;
    }

    return { border, backgroundColor: background };
  }, [isExpired, daysUntilExpiry]);

  const getExpiryText = () => {
    if (isExpired) {
      return (
        <span style={{ color: getTextColor() }}>
          Истёк
        </span>
      );
    }

    return (
      <>
        Истекает через{' '}
        <span style={{ color: getTextColor() }}>
          {daysUntilExpiry} {getDayWord(daysUntilExpiry)}
        </span>
      </>
    );
  };

  return (
    <div
      className={`product-card-container ${viewMode === 'list' ? 'product-card-list' : ''} ${viewMode === 'compact' ? 'product-card-compact' : ''}`}
      style={getCardStyles()}
      onClick={() => onClick(product)}
      role="button"
      tabIndex={0}
    >
      <h3 className="product-card-title">
        {product.name}<br/>
        <span className="product-card-expiry-date-minimum">
          {getExpiryText()}
        </span>
      </h3>

      <div className="product-card-section">
        <div className="product-card-row">
          <div className="product-card-item">
            <img src={ObjectsIcon} alt="" className="icon-md icon-mr" />
            <span className="product-card-text">{product.type}</span>
          </div>
          {product.quantity > 0 && (
            <div className="product-card-item">
              <img src={CartIcon} alt="" className="icon-md icon-mr" />
              <span className="product-card-text">{product.quantity} {product.unit_type}</span>
            </div>
          )}
        </div>

        <div className="product-card-row">
          <div className="product-card-item">
          <img src={CalendarIcon} alt="" className="icon-md icon-mr" />
            <span className="product-card-text">
              {expiryDate.toLocaleDateString('ru-RU')}
              {isExpired && (
                <img src={WarningIcon} alt="warning" className="icon-md icon-ml" />
              )}
            </span>
          </div>
        </div>
      </div>

      {product.allergens?.length > 0 && (
        <div className="product-card-allergens">
          <img src={AllergenIcon} alt="" className="icon-md icon-mr" />
          <span className="product-card-text">Аллергены: {product.allergens.join(', ')}</span>
        </div>
      )}
    </div>
  );
};

export default ProductCard;