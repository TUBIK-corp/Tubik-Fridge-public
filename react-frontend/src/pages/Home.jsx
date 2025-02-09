import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../api/api';
import ProductCard from '../components/ProductCard';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Home.css';

import CompactViewIcon from '../assets/CompactView.svg';
import GridViewIcon from '../assets/GridView.svg';
import ListViewIcon from '../assets/ListView.svg';
import WarningIcon from '../assets/Warning.svg';
import UnfoldlessIcon from '../assets/Unfold_less.svg';
import UnfoldmoreIcon from '../assets/Unfold_more.svg';

const SORT_OPTIONS = {
  expiry_asc: 'Срок годности (ближайшие)',
  type: 'Тип продукта',
  added_desc: 'Дата добавления (новые)'
};

const VIEW_MODES = {
  grid: 'grid',
  list: 'list',
  compact: 'compact'
};

function Home() {
  const [searchTerm, setSearchTerm] = useState('');

  const [expanded, setExpanded] = useState('');
  const [sortBy, setSortBy] = useState('expiry_asc');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.grid);

  const { data: products = [], refetch } = useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getAll,
  });

  const { data: expiring = [] } = useQuery({
    queryKey: ['expiring'],
    queryFn: productsApi.getExpiring,
  });

  useEffect(() => {
    const checkExpiryNotifications = () => {
      expiring.forEach(product => {
        const daysLeft = Math.ceil(
          (new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
        );

        if (daysLeft <= 3 && daysLeft > 0) {
          toast.warning(`${product.name} истекает через ${daysLeft} ${getDaysWord(daysLeft)}`, {
            autoClose: 5000,
            hideProgressBar: true,
          });
        }
      });
    };

    const interval = setInterval(checkExpiryNotifications, 3600000);
    checkExpiryNotifications();

    return () => clearInterval(interval);
  }, [expiring]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch(sortBy) {
      case 'expiry_asc':
        return new Date(a.expiry_date) - new Date(b.expiry_date);
      case 'type':
        return a.type.localeCompare(b.type);
      case 'added_desc':
        return new Date(b.created_at) - new Date(a.created_at);
      default:
        return 0;
    }
  });

  const getExpiryStatus = (daysLeft) => {
    if (daysLeft < 0) {
      return {
        status: 'expired',
        color: '#ff4444',
        background: '#ffe5e5',
        percentage: 100
      };
    }
    if (daysLeft === 0) {
      return {
        status: 'today',
        color: '#ff6666',
        background: '#fff0f0',
        percentage: 100
      };
    }
    if (daysLeft <= 1) {
      return {
        status: '1-day',
        color: '#ff6666',
        background: '#fff0f0',
        percentage: 100
      };
    }
    if (daysLeft <= 3) {
      return {
        status: '3-days',
        color: '#ffa726',
        background: '#fff3e0',
        percentage: 70
      };
    }
    if (daysLeft <= 7) {
      return {
        status: '7-days',
        color: '#ffd700',
        background: '#fff9c4',
        percentage: 40
      };
    }
    return {
      status: 'normal',
      color: '#4CAF50',
      background: '#e8f5e9',
      percentage: 20
    };
  }

  const handleDeleteProduct = async (productId) => {
    const confirmDelete = window.confirm('Вы уверены, что хотите удалить этот продукт?');
    if (!confirmDelete) return;

    try {
      await productsApi.remove(productId);
      refetch();
      toast.success('Продукт успешно удален');
      setSelectedProduct(null);
    } catch (error) {
      toast.error('Ошибка при удалении продукта');
    }
  };


  const ProductModal = () => (
    <div className="home-page-product-modal-overlay" onClick={() => setSelectedProduct(null)}>
      <div className="home-page-product-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{selectedProduct?.name || "не указано"}</h2>

        <div className="home-page-modal-details-grid">
          <div className="home-page-detail-row">
            <span>Тип:</span>
            <span>{selectedProduct?.type || "не указано"}</span>
          </div>
          <div className="home-page-detail-row">
            <span>Количество:</span>
            <span>
              {selectedProduct?.quantity ? `${selectedProduct.quantity} ${selectedProduct?.unit_type || ""}` : "не указано"}
            </span>
          </div>
          <div className="home-page-detail-row">
            <span>Срок годности:</span>
            <span>
              {selectedProduct?.expiry_date ? new Date(selectedProduct.expiry_date).toLocaleDateString('ru-RU') : "не указано"}
            </span>
          </div>
          <div className="home-page-detail-row">
            <span>Дата добавления:</span>
            <span>
              {selectedProduct?.created_at ? new Date(selectedProduct.created_at).toLocaleDateString('ru-RU') : "не указано"}
            </span>
          </div>
          <div className="home-page-detail-row">
            <span>Пищевая ценность (на 100г):</span>
            <span>
              {selectedProduct?.calories ? `${selectedProduct.calories} ккал` : "-"} ·
              Б: {selectedProduct?.proteins ? `${selectedProduct.proteins}г` : "-"} ·
              Ж: {selectedProduct?.fats ? `${selectedProduct.fats}г` : "-"} ·
              У: {selectedProduct?.carbohydrates ? `${selectedProduct.carbohydrates}г` : "-"}
            </span>
          </div>
          <div className="home-page-detail-row">
            <span>Аллергены:</span>
            <span>{selectedProduct?.allergens?.join(', ') || 'отсутствуют'}</span>
          </div>
        </div>

        <div className="home-page-modal-buttons">
          <button
            className="home-page-modal-close-button"
            onClick={() => setSelectedProduct(null)}
          >
            Закрыть
          </button>
          <button
            className="home-page-modal-delete-button"
            onClick={() => handleDeleteProduct(selectedProduct.id)}
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="home-page-container">
      <div className="home-page-controls-container">
        <div className="home-page-view-controls">
          <button
            className={`home-page-view-button ${viewMode === VIEW_MODES.grid ? 'home-page-view-button-active' : ''}`}
            onClick={() => setViewMode(VIEW_MODES.grid)}
            aria-label="Плиточный вид"
          >
            <img src={GridViewIcon} alt="grid_view" className="icon-md icon-lg" />
          </button>
          <button
            className={`home-page-view-button ${viewMode === VIEW_MODES.list ? 'home-page-view-button-active' : ''}`}
            onClick={() => setViewMode(VIEW_MODES.list)}
            aria-label="Список"
          >
            <img src={ListViewIcon} alt="view_list" className="icon-md icon-lg" />
          </button>
          <button
            className={`home-page-view-button ${viewMode === VIEW_MODES.compact ? 'home-page-view-button-active' : ''}`}
            onClick={() => setViewMode(VIEW_MODES.compact)}
            aria-label="Компактный вид"
          >
            <img src={CompactViewIcon} alt="view_compact" className="icon-md icon-lg" />
          </button>
        </div>

        <section className="home-page-search-container">
          <input
            type="text"
            placeholder="Поиск продуктов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="home-page-search-input"
          />
        </section>

        <select
          className="home-page-sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          {Object.entries(SORT_OPTIONS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <section className="home-page-products-container">
        <h2>Содержимое холодильника</h2>
        <div className={`home-page-products-${viewMode}`}>
          {sortedProducts.length > 0 ? (
            sortedProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setSelectedProduct(product)}
                viewMode={viewMode}
              />
            ))
          ) : (
            <div className="home-page-no-products">
              <p>Продукты не найдены</p>
            </div>
          )}
        </div>
      </section>

      {expiring.length > 0 && (
        <section className="home-page-expiring-container">
          <div className="home-page-expiring-header">
            <h3>
            <img src={WarningIcon} alt="" className="icon-lg icon-mr" />
              Истекающие продукты
              <span className="home-page-expiring-count">{expiring.length}</span>
            </h3>
            <button
              className="home-page-expanding-button"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? "Свернуть" : "Развернуть"}
            >
              <img src={expanded ? UnfoldlessIcon : UnfoldmoreIcon} alt="" className="icon-md icon-mr" />
            </button>
          </div>

          <div className={`home-page-expiring-scroll ${expanded ? 'home-page-expiring-scroll-expanded' : ''}`}>
            {expiring
              .sort((a, b) => {
                const daysLeftA = Math.ceil(
                  (new Date(a.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
                );
                const daysLeftB = Math.ceil(
                  (new Date(b.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
                );
                return daysLeftA - daysLeftB;
              })
              .map(product => {
                const daysLeft = Math.ceil(
                  (new Date(product.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
                );

                const statusConfig = getExpiryStatus(daysLeft);
                const isExpired = daysLeft < 0;
                const daysText = isExpired
                  ? `${Math.abs(daysLeft)} ${getDaysWord(Math.abs(daysLeft))} назад`
                  : `${daysLeft} ${getDaysWord(daysLeft)} осталось`;

                return (
                  <div
                    key={product.id}
                    className="home-page-expiring-card"
                    data-status={statusConfig.status}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="home-page-status-indicator" style={{ background: statusConfig.color }}></div>
                    <div className="expiring-content">
                      <div className="expiring-main">
                        <span className="product-name">{product.name}</span>
                        <div className="home-page-days-left">
                          {isExpired || daysLeft === 0 ? (
                            <span className="home-page-days-alert">!</span>
                          ) : (
                            <span className="home-page-days-count" style={{ color: statusConfig.color }}>
                              {daysLeft}
                            </span>
                          )}
                          <span className="home-page-days-label">
                            {daysLeft === 0
                              ? "Сегодня истекает!"
                              : isExpired
                                ? `Просрочен ${Math.abs(daysLeft)} ${getDaysWord(Math.abs(daysLeft))} назад`
                                : `Осталось ${daysLeft} ${getDaysWord(daysLeft)}`}
                          </span>
                        </div>
                      </div>
                      <div className="home-page-expiry-visualization">
                        <div
                          className="home-page-timeline-bar"
                          style={{
                            background: statusConfig.background,
                            opacity: isExpired ? 0.3 : 1
                          }}
                        >
                          {!isExpired && (
                            <div
                              className="home-page-timeline-progress"
                              style={{
                                width: `${statusConfig.percentage}%`,
                                background: statusConfig.color
                              }}
                            ></div>
                          )}
                        </div>
                        <div className="home-page-expiry-labels">
                          <span>Свежий</span>
                          <span>{isExpired ? 'Просрочен' : 'Истекает'}</span>
                        </div>
                      </div>
                      <div className="product-quantity">
                        {product.quantity} {product.unit_type}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {selectedProduct && <ProductModal />}

      <ToastContainer
        position="bottom-right"
        newestOnTop
        pauseOnFocusLoss={false}
      />
    </div>
  );
}

function getDaysWord(days) {
  const lastDigit = days % 10;
  if (days >= 11 && days <= 14) return 'дней';
  if (lastDigit === 1) return 'день';
  if (lastDigit >= 2 && lastDigit <= 4) return 'дня';
  return 'дней';
}

export default Home;