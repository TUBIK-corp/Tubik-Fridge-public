import { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, shoppingApi  } from '../api/api';
import { useNavigate } from 'react-router-dom';
import './Scanner.css';

function Scanner() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [html5QrCode, setHtml5QrCode] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then(devices => {
        setCameras(devices);
        if (devices.length > 0) {
          setSelectedCamera(devices[0].id);
        }
      })
      .catch(err => console.error('Error getting cameras:', err));

    return () => {
      if (html5QrCode) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, []);

  const startScanner = async () => {
    if (!selectedCamera) return;

    const scanner = new Html5Qrcode('reader');
    setHtml5QrCode(scanner);
    setScanning(true);

    try {
      await scanner.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
        onScanError
      );
    } catch (err) {
      console.error('Error starting scanner:', err);
      alert('Ошибка при запуске сканера');
    }
  };

  const stopScanner = async () => {
    if (html5QrCode) {
      try {
        await html5QrCode.stop();
        setScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const onScanSuccess = async (decodedText) => {
    try {
      const parts = decodedText.split('|');

      const productData = {
        name: parts[0] || '',
        type: parts[1] || 'Другое',
        measurement_type: parts[2] === 'w' ? 'weight' : 'pieces',
        quantity: parseFloat(parts[3]) || 0,
        unit_type: parts[4] === 'k' ? 'кг' : parts[4],
        manufacture_date: parts[5] || null,
        expiry_date: parts[6] || null,
        calories: parseFloat(parts[7]) || 0,
        proteins: parseFloat(parts[8]) || 0,
        fats: parseFloat(parts[9]) || 0,
        carbohydrates: parseFloat(parts[10]) || 0,
        allergens: parts[11] ? parts[11].split('.') : []
      };

      setScannedProduct(productData);
      await stopScanner();
    } catch (error) {
      console.error("Ошибка чтения QR:", error);
      alert("Ошибка чтения QR-кода. Попробуйте еще раз.");
    }
  };

  const onScanError = (error) => {
    console.debug('QR scan error:', error);
  };

  const addToFridge = async () => {
    if (!scannedProduct) return;

    try {
      const dataToSend = {
        ...scannedProduct,
        manufacture_date: scannedProduct.manufacture_date
          ? new Date(scannedProduct.manufacture_date).toISOString()
          : null,
        expiry_date: new Date(scannedProduct.expiry_date).toISOString(),
        quantity: parseFloat(scannedProduct.quantity) || 0,
        calories: parseFloat(scannedProduct.calories) || 0,
        proteins: parseFloat(scannedProduct.proteins) || 0,
        fats: parseFloat(scannedProduct.fats) || 0,
        carbohydrates: parseFloat(scannedProduct.carbohydrates) || 0
      };

      await productsApi.add(dataToSend);
      alert('Продукт успешно добавлен в холодильник');
      navigate('/');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Ошибка при добавлении продукта: ' + error.message);
    }
  };

  const addToShoppingMutation = useMutation({
    mutationFn: (item) => shoppingApi.addItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries(['shopping']);
      setScannedProduct(null);
      alert('Добавлено в список покупок');
    },
    onError: (error) => {
      console.error('Error:', error);
      alert('Произошла ошибка при добавлении в список: ' + error.message);
    }
  });

  const addToShopping = async () => {
    if (!scannedProduct) return;

    const shoppingItem = {
      name: scannedProduct.name,
      quantity: scannedProduct.quantity,
      measurement_type: scannedProduct.measurement_type,
      unit_type: scannedProduct.unit_type
    };

    await addToShoppingMutation.mutateAsync(shoppingItem);
  };

  return (
    <div className="scanner-page-container">
      <div className="scanner-page-controls">
        <select
          className="scanner-page-camera-select"
          value={selectedCamera}
          onChange={(e) => setSelectedCamera(e.target.value)}
        >
          {cameras.map(camera => (
            <option key={camera.id} value={camera.id}>
              {camera.label || `Camera ${camera.id}`}
            </option>
          ))}
        </select>

        {!scanning ? (
          <button className="scanner-page-control-button" onClick={startScanner}>Запустить сканер</button>
        ) : (
          <button className="scanner-page-control-button" onClick={stopScanner}>Остановить сканер</button>
        )}
      </div>

      <div id="reader" />

      {scannedProduct && (
        <div className="scanner-page-scanned-product-info">
          <h3>Информация о продукте</h3>
          <div className="scanner-page-product-details-grid">
            <div className="scanner-page-detail-item">
              <strong>Название:</strong>
              <p>{scannedProduct.name}</p>
            </div>
            <div className="scanner-page-detail-item">
              <strong>Тип:</strong>
              <p>{scannedProduct.type}</p>
            </div>
            <div className="scanner-page-detail-item">
              <strong>Количество:</strong>
              <p>{scannedProduct.quantity} {scannedProduct.unit_type}</p>
            </div>
            <div className="scanner-page-detail-item">
              <strong>Срок годности:</strong>
              <p>{new Date(scannedProduct.expiry_date).toLocaleDateString()}</p>
            </div>
          </div>

          {scannedProduct.allergens?.length > 0 && (
            <div className="scanner-page-allergens-container">
              <p><strong>Аллергены:</strong></p>
              {scannedProduct.allergens.map(allergen => (
                <span key={allergen} className="scanner-page-allergen-tag">{allergen}</span>
              ))}
            </div>
          )}

          <div className="scanner-page-action-buttons">
            <button className="scanner-page-add-to-fridge-button" onClick={addToFridge}>
              Добавить в холодильник
            </button>
            <button className="scanner-page-add-to-shopping-button" onClick={addToShopping}>
              Добавить в список покупок
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Scanner;