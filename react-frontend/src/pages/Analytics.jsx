import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { productsApi } from '../api/api';
import './Analytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

import AnalyticsIcon from '../assets/Analytics.svg';
import AnalyticsBlueIcon from '../assets/AnalyticsBlue.svg';
import AnalyticsAltBlueIcon from '../assets/AnalyticsAltBlue.svg';
import CalendarIcon from '../assets/Calendar.svg';
import CalendarBlueIcon from '../assets/CalendarBlue.svg';
import CartIcon from '../assets/Cart.svg';
import CartBlueIcon from '../assets/CartBlue.svg';
import NotificationIcon from '../assets/NotificationBlue.svg';

const ANALYTICS_MODES = {
  CONSUMPTION: {
    key: 'consumption',
    label: 'Динамика',
    icon: AnalyticsBlueIcon,
    activeIcon: AnalyticsIcon
  },
  CATEGORIES: {
    key: 'categories',
    label: 'Категории',
    icon: CartBlueIcon,
    activeIcon: CartIcon
  },
  EXPIRY: {
    key: 'expiry',
    label: 'Сроки',
    icon: CalendarBlueIcon,
    activeIcon: CalendarIcon
  }
};

const DATE_RANGES = {
  WEEK: { days: 7, label: 'Неделя' },
  MONTH: { days: 30, label: 'Месяц' },
  QUARTER: { days: 90, label: 'Квартал' },
  CUSTOM: { label: 'Другой период' }
};

const Analytics = () => {
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [selectedRange, setSelectedRange] = useState(DATE_RANGES.MONTH);
  const [mode, setMode] = useState(ANALYTICS_MODES.CONSUMPTION.key);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics', dateRange, mode],
    queryFn: () => productsApi.getAnalytics(
      format(dateRange.start, "yyyy-MM-dd'T'HH:mm:ss"),
      format(dateRange.end, "yyyy-MM-dd'T'HH:mm:ss")
    ),
    keepPreviousData: true
  });

  const handleRangeSelect = (range) => {
    setSelectedRange(range);
    if (range !== DATE_RANGES.CUSTOM) {
      setDateRange({
        start: subDays(new Date(), range.days),
        end: new Date()
      });
    }
  };

  const getDisplayValue = (product) => {
    const value = product.quantity || 0;
    const unitType = product.unit_type?.toLowerCase() || 'шт';

    switch(unitType) {
      case 'kg': return `${value} кг`;
      case 'g': return `${value} г`;
      case 'l': return `${value} л`;
      default: return `${value} шт`;
    }
  };

  const processCategoryData = (sourceData, type = 'count') => {
    if (!sourceData) return {};

    return Object.keys(sourceData).reduce((acc, category) => {
      acc[category] = sourceData[category][type];
      return acc;
    }, {});
  };

  const getChartData = () => {
    if (!data) return null;

    switch(mode) {
      case ANALYTICS_MODES.CONSUMPTION.key: {
        const addedData = processCategoryData(data.added, 'count');
        const removedData = processCategoryData(data.removed, 'count');

        const allCategories = [
          ...new Set([
            ...Object.keys(addedData),
            ...Object.keys(removedData)
          ])
        ].sort();

        return {
          labels: allCategories,
          datasets: [
            {
              label: 'Добавлено',
              data: allCategories.map(cat => addedData[cat] || 0),
              backgroundColor: '#10B981',
              borderWidth: 0,
              borderRadius: 8
            },
            {
              label: 'Удалено',
              data: allCategories.map(cat => removedData[cat] || 0),
              backgroundColor: '#EF4444',
              borderWidth: 0,
              borderRadius: 8
            }
          ]
        };
      }

      case ANALYTICS_MODES.CATEGORIES.key: {
        const categoriesData = processCategoryData(data.added, 'count');
        const categories = Object.keys(categoriesData);

        return {
          labels: categories,
          datasets: [{
            data: categories.map(cat => categoriesData[cat]),
            backgroundColor: categories.map((_, i) =>
              `hsl(${(i * 360) / categories.length}, 70%, 50%)`
            ),
            borderWidth: 2,
            hoverOffset: 20
          }]
        };
      }

      case ANALYTICS_MODES.EXPIRY.key:
        return {
          labels: ['Свежие', 'Просрочено'],
          datasets: [{
            data: [
              data.current.total_items - data.current.expired,
              data.current.expired
            ],
            backgroundColor: ['#10B981', '#EF4444'],
            borderWidth: 2
          }]
        };

      default:
        return null;
    }
  };

  return (
    <div className="analytics-page-container">
      <div className="analytics-page-controls-panel">
        <div className="analytics-page-date-range-selector">
          {Object.values(DATE_RANGES).map((range) => (
            <button
              key={range.label}
              className={`analytics-page-range-button ${selectedRange.label === range.label ? 'analytics-page-range-button-active' : ''}`}
              onClick={() => handleRangeSelect(range)}
            >
              {range.label}
            </button>
          ))}
        </div>

        <div className="analytics-page-custom-date-picker">
          <DatePicker
            selected={dateRange.start}
            onChange={date => {
              handleRangeSelect(DATE_RANGES.CUSTOM);
              setDateRange(prev => ({ ...prev, start: date }));
            }}
            dateFormat="dd.MM.yy"
            locale={ru}
            className="analytics-page-date-input"
            placeholderText="Начало"
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            timeCaption="Время"
          />
          <span className="analytics-page-date-separator">—</span>
          <DatePicker
            selected={dateRange.end}
            onChange={date => {
              handleRangeSelect(DATE_RANGES.CUSTOM);
              setDateRange(prev => ({ ...prev, end: date }));
            }}
            dateFormat="dd.MM.yy"
            locale={ru}
            className="analytics-page-date-input"
            placeholderText="Конец"
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            timeCaption="Время"
          />
        </div>

        <div className="analytics-page-mode-selector">
          {Object.values(ANALYTICS_MODES).map(({ key, label, icon, activeIcon }) => (
            <button
              key={key}
              className={`analytics-page-mode-button ${mode === key ? 'analytics-page-mode-button-active' : ''}`}
              onClick={() => setMode(key)}
            >
              <img 
                src={mode === key ? activeIcon : icon} 
                alt="" 
                className="icon-md icon-mr" 
              />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="analytics-page-visualization-section">
        {isLoading && (
          <div className="analytics-page-loading-overlay">
            <div className="analytics-page-loader"></div>
            <p>Загружаем вкусную аналитику...</p>
          </div>
        )}

        {error && (
          <div className="analytics-page-error-message">
            <img src={NotificationIcon} alt="" className="icon-md icon-mr" />
            Ошибка: {error.message}
          </div>
        )}

        {!isLoading && !error && data && (
          <>
            <div className="analytics-page-chart-wrapper">
              {mode === ANALYTICS_MODES.CONSUMPTION.key && (
                <Bar
                  data={getChartData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: { font: { size: 14 } }
                      }
                    },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: { font: { size: 12 } }
                      },
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: value => `${value} шт`
                        }
                      }
                    }
                  }}
                />
              )}

              {(mode === ANALYTICS_MODES.CATEGORIES.key || mode === ANALYTICS_MODES.EXPIRY.key) && (
                <Pie
                  data={getChartData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: { font: { size: 14 } }
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const unit = mode === ANALYTICS_MODES.EXPIRY.key ? 'шт' : 'шт';
                            return `${label}: ${value} ${unit}`;
                          }
                        }
                      }
                    }
                  }}
                />
              )}
            </div>

            {data.top_added?.length > 0 && (
              <div className="analytics-page-top-products">
                <h3 className="analytics-page-section-title">
                  <img src={AnalyticsAltBlueIcon} alt="" className="icon-lg icon-mr" />
                  Топ продуктов
                </h3>
                <div className="analytics-page-products-grid">
                  {data.top_added.map((product, index) => (
                    <div key={product.name} className="analytics-page-product-card">
                      <div className="analytics-page-product-badge">#{index + 1}</div>
                      <div className="product-content">
                        <h4 className="product-name">{product.name}</h4>
                        <div className="product-meta">
                          <span className="product-quantity">
                            {getDisplayValue(product)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;