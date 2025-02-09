import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { productsApi } from '../api/api';
import { useNavigate } from 'react-router-dom';
import './Generator.css';

const DEFAULT_CATEGORIES = [
  "Хлеб",
  "Молочные",
  "Мясо",
  "Овощи",
  "Фрукты",
  "Напитки"
];

function Generator() {
  const navigate = useNavigate();
  const [productData, setProductData] = useState({
    name: '',
    type: '',
    measurement_type: 'weight',
    quantity: '',
    unit_type: 'кг',
    manufacture_date: '',
    expiry_date: '',
    calories: '',
    proteins: '',
    fats: '',
    carbohydrates: '',
    allergens: []
  });
  
  const [showCustomType, setShowCustomType] = useState(false);
  const { data: userCategories = [] } = useQuery({
    queryKey: ['productCategories'],
    queryFn: () => productsApi.getCategories(),
  });

  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...userCategories])];

  const handleTypeChange = (e) => {
    const value = e.target.value;
    if (value === "custom") {
      setShowCustomType(true);
      setProductData(prev => ({ ...prev, type: '' }));
    } else {
      setShowCustomType(false);
      setProductData(prev => ({ ...prev, type: value }));
    }
  };

  const handleCustomTypeChange = (e) => {
    setProductData(prev => ({ ...prev, type: e.target.value }));
  };

  const generateQR = async (e) => {
    e.preventDefault();    
    const qrData = [
      productData.name,
      productData.type,
      productData.measurement_type === 'weight' ? 'w' : 'p',
      productData.quantity || '0',
      productData.unit_type === 'кг' ? 'k' : productData.unit_type,
      productData.manufacture_date,
      productData.expiry_date,
      productData.calories || '0',
      productData.proteins || '0',
      productData.fats || '0',
      productData.carbohydrates || '0',
      productData.allergens.join('.')
    ].join('|');

    try {
      const canvas = document.getElementById('qrCode');
      await QRCode.toCanvas(canvas, qrData, {
        version: 13,
        width: 512,
        margin: 1,
        errorCorrectionLevel: 'H',
        toSJISFunc: undefined
      });

      canvas.setAttribute('data-original', JSON.stringify(productData));
      document.querySelector('.generator-page-qr-section').style.display = 'flex';
    } catch (error) {
      console.error('Ошибка при генерации QR-кода:', error);
      alert('Ошибка при генерации QR-кода');
    }
  };

  const handleAllergenChange = (allergen) => {
    setProductData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  const addToFridge = async () => {
    try {
      const dataToSend = {
        ...productData,
        manufacture_date: productData.manufacture_date ? new Date(productData.manufacture_date).toISOString() : null,
        expiry_date: new Date(productData.expiry_date).toISOString(),
        quantity: parseFloat(productData.quantity) || 0,
        calories: parseFloat(productData.calories) || 0,
        proteins: parseFloat(productData.proteins) || 0,
        fats: parseFloat(productData.fats) || 0,
        carbohydrates: parseFloat(productData.carbohydrates) || 0
      };

      await productsApi.add(dataToSend);
      alert('Продукт успешно добавлен в холодильник');
      navigate('/');
    } catch (error) {
      console.error('Error:', error);
      alert('Произошла ошибка при добавлении продукта: ' + error.message);
    }
  };

  const downloadQR = () => {
    const canvas = document.querySelector('#qrCode');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `qr-code-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="generator-page-wrapper">
      <div className="generator-page-container">
        <h1 className="generator-page-main-title">Генератор QR-кода</h1>

        <div className="generator-page-columns-container">
          <div className="form-column">
            <form onSubmit={generateQR} className="generator-page-main-form">
              <div className="generator-page-input-group">
                <label>Название продукта</label>
                <input
                  type="text"
                  placeholder="Название продукта"
                  value={productData.name}
                  onChange={e => setProductData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="generator-page-input-group">
                <label>Тип продукта</label>
                <div className="type-input-container">
                  <select
                    value={showCustomType ? "custom" : productData.type}
                    onChange={handleTypeChange}
                    required={!showCustomType}
                  >
                    <option value="">Выберите тип</option>
                    {allCategories.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                    <option value="custom">Другое</option>
                  </select>
                  
                  {showCustomType && (
                    <input
                      type="text"
                      placeholder="Введите тип продукта"
                      value={productData.type}
                      onChange={handleCustomTypeChange}
                      required
                      className="custom-type-input"
                    />
                  )}
                </div>
              </div>

              <div className="generator-page-input-group">
                <label>Дата срока годности</label>
                <input
                  type="date"
                  value={productData.expiry_date}
                  onChange={e => setProductData(prev => ({ ...prev, expiry_date: e.target.value }))}
                  required
                />
              </div>

              <details className="generator-page-expandable-section">
                <summary className="generator-page-section-summary">Дополнительные параметры</summary>
                <div className="generator-page-section-content">
                  <div className="generator-page-grid-row">
                    <div className="generator-page-input-group">
                      <label>Количество</label>
                      <input
                        type="number"
                        placeholder="Количество"
                        value={productData.quantity}
                        onChange={e => setProductData(prev => ({ ...prev, quantity: e.target.value }))}
                      />
                    </div>
                    <div className="generator-page-input-group">
                      <label>Единица измерения</label>
                      <select
                        value={productData.unit_type}
                        onChange={e => setProductData(prev => ({ ...prev, unit_type: e.target.value }))}
                      >
                        <option value="кг">кг</option>
                        <option value="г">г</option>
                        <option value="л">л</option>
                        <option value="мл">мл</option>
                        <option value="шт">шт</option>
                      </select>
                    </div>
                  </div>

                  <div className="generator-page-input-group">
                    <label>Дата производства</label>
                    <input
                      type="date"
                      value={productData.manufacture_date}
                      onChange={e => setProductData(prev => ({ ...prev, manufacture_date: e.target.value }))}
                    />
                  </div>

                  <div className="generator-page-input-group">
                    <label>Пищевая ценность (на 100г)</label>
                    <div className="generator-page-nutrition-grid">
                      <input
                        type="number"
                        placeholder="Калории"
                        value={productData.calories}
                        onChange={e => setProductData(prev => ({ ...prev, calories: e.target.value }))}
                      />
                      <input
                        type="number"
                        placeholder="Белки"
                        value={productData.proteins}
                        onChange={e => setProductData(prev => ({ ...prev, proteins: e.target.value }))}
                      />
                      <input
                        type="number"
                        placeholder="Жиры"
                        value={productData.fats}
                        onChange={e => setProductData(prev => ({ ...prev, fats: e.target.value }))}
                      />
                      <input
                        type="number"
                        placeholder="Углеводы"
                        value={productData.carbohydrates}
                        onChange={e => setProductData(prev => ({ ...prev, carbohydrates: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="generator-page-input-group">
                    <label className="allergen-label">Аллергены</label>
                    <div className="generator-page-allergen-grid">
                      {['gluten', 'lactose', 'nuts', 'eggs'].map(allergen => (
                        <label key={allergen} className="generator-page-checkbox-item">
                          <input
                            type="checkbox"
                            checked={productData.allergens.includes(allergen)}
                            onChange={() => handleAllergenChange(allergen)}
                          />
                          <span>{allergen}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </details>

              <button type="submit" className="generator-page-generate-button">
                Сгенерировать QR-код
              </button>
            </form>
          </div>

          <div className="generator-page-qr-column">
            <div className="generator-page-qr-section" style={{ display: 'none' }}>
              <div className="generator-page-qr-frame">
                <canvas id="qrCode"></canvas>
              </div>
              <div className="generator-page-qr-buttons">
                <button onClick={downloadQR} className="generator-page-qr-button">
                  Скачать QR-код
                </button>
                <button onClick={addToFridge} className="generator-page-qr-button">
                  Добавить в холодильник
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Generator;