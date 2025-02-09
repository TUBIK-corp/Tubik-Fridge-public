import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shoppingApi, productsApi } from '../api/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import debounce from 'lodash.debounce';
import './Shopping.css';

import CartIcon from '../assets/CartBlue.svg';
import TrashCanIcon from '../assets/TrashCan.svg';
import LoginIcon from '../assets/Login.svg';
import EditIcon from '../assets/Edit.svg';
import PlusIcon from '../assets/Plus.svg';
import CancelIcon from '../assets/Cancel.svg';
import SaveIcon from '../assets/Save.svg';
import ExportIcon from '../assets/Export.svg';

export default function ShoppingPage() {
  const queryClient = useQueryClient();
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, unit_type: 'шт' });
  const [editItem, setEditItem] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [groupedItems, setGroupedItems] = useState({});
  const wrapperRef = useRef(null);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        const response = await productsApi.getAll();
        setAllProducts(Array.isArray(response) ? response : []);
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Error fetching products:', error);
        return [];
      }
    },
  });

  const { data: shoppingList = [], isLoading } = useQuery({
    queryKey: ['shopping'],
    queryFn: async () => {
      try {
        const response = await shoppingApi.getList();
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Error fetching shopping list:', error);
        return [];
      }
    },
    onSuccess: (data) => {
      const grouped = data.reduce((acc, item) => {
        const category = item.category?.trim() || 'Без категории';
        acc[category] = acc[category] || [];
        acc[category].push(item);
        return acc;
      }, {});
      setGroupedItems(grouped);
    },
  });

  const addMutation = useMutation({
    mutationFn: (item) => shoppingApi.addItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries(['shopping']);
      toast.success('Добавлено в список');
    },
    onError: () => toast.error('Ошибка при добавлении')
  });

  const updateMutation = useMutation({
    mutationFn: (updatedItem) => shoppingApi.updateItem(updatedItem.id, {
      name: updatedItem.name,
      quantity: updatedItem.quantity,
      unit_type: updatedItem.unit_type,
      category: updatedItem.category
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['shopping']);
      setEditItem(null);
      toast.success('Изменения сохранены');
    },
    onError: () => {
      toast.error('Ошибка при сохранении изменений');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => shoppingApi.removeItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['shopping']);
      toast.success('Удалено из списка');
    },
    onError: () => toast.error('Ошибка при удалении')
  });

  const debouncedSearch = useCallback(
    debounce((searchTerm) => {
      const term = searchTerm.trim().toLowerCase();
      if (!term) return setSuggestions([]);
      const results = allProducts
        .filter(p => p.name?.toLowerCase().includes(term))
        .slice(0, 5);

      setSuggestions(results);
    }, 300),
    [allProducts]
  );

  const handleClickOutside = useCallback((e) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
      setSuggestions([]);
    }
  }, []);

  const handleSuggestionClick = (product) => {
    const existing = shoppingList.find(i => i.name.toLowerCase() === product.name.toLowerCase());
    if (existing) return toast.info(`Уже в списке: ${existing.name}`);

    setNewItem({
      name: product.name,
      quantity: 1,
      unit_type: product.unit_type || 'шт',
      category: product.type
    });
    setSuggestions([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) return toast.warning('Введите название продукта');
    addMutation.mutate(newItem);
    setNewItem({ name: '', quantity: 1, unit_type: 'шт' });
  };

  const handleExport = () => {
    const text = shoppingList
      .map(item => `${item.name} - ${item.quantity} ${item.unit_type}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopping-list.txt';
    a.click();
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  return (
    <div className="shopping-page-container">
      <div className="main-content">
        <header className="shopping-page-header">
          <h1 className="shopping-page-main-title">
            <img src={CartIcon} alt="" className="icon-md icon-mr" />
            Список покупок
          </h1>
          <button className="shopping-page-export-button" onClick={handleExport}>
            <img src={ExportIcon} alt="" className="icon-md icon-mr" />
            Экспорт списка
          </button>
        </header>

        <section className="shopping-page-input-section">
          <form onSubmit={handleSubmit} className="shopping-page-product-form">
            <div className="shopping-page-search-group">
              <input
                type="text"
                placeholder="Начните вводить название продукта..."
                value={newItem.name}
                onChange={(e) => {
                  setNewItem({...newItem, name: e.target.value});
                  debouncedSearch(e.target.value);
                }}
                className="shopping-page-search-input"
              />

              {suggestions.length > 0 && (
                <div className="shopping-page-suggestions-box">
                  {suggestions.map((product) => (
                    <div
                      key={product.id}
                      className="shopping-page-suggestion-item"
                      onClick={() => handleSuggestionClick(product)}
                    >
                      <span className="shopping-page-item-name">{product.name}</span>
                      <div className="product-meta">
                        <span className="product-category">{product.type || 'Без категории'}</span>
                        <span className="product-unit">{product.unit_type || 'шт'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="shopping-page-controls-group">
              <div className="shopping-page-quantity-control">
                <input
                  type="number"
                  min="1"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({
                    ...newItem,
                    quantity: Math.max(1, parseInt(e.target.value))
                  })}
                  className="shopping-page-quantity-input"
                />
                <select
                  value={newItem.unit_type}
                  onChange={(e) => setNewItem({...newItem, unit_type: e.target.value})}
                  className="shopping-page-unit-select"
                >
                  {['шт', 'кг', 'г', 'л', 'мл'].map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="shopping-page-add-button"
                disabled={addMutation.isLoading}
              >
                <img src={PlusIcon} alt="" className="icon-md icon-mr" />
                {addMutation.isLoading ? 'Добавление...' : 'Добавить'}
              </button>
            </div>
          </form>
        </section>

        <section className="shopping-page-list-section">
          {isLoading ? (
            <div className="loading-state">
              Загрузка списка...
            </div>
          ) : shoppingList.length > 0 ? (
            <div className="shopping-page-items-grid">
              {shoppingList.map((item) => (
                <div key={item.id} className="shopping-page-shopping-item">
                  <div className="shopping-page-item-main">
                    <span className="shopping-page-item-name">{item.name}</span>
                    <div className="shopping-page-item-details">
                      {editItem?.id === item.id ? (
                        <div className="edit-controls">
                          <input
                            type="number"
                            value={editItem.quantity}
                            onChange={(e) => setEditItem({
                              ...editItem,
                              quantity: Math.max(1, parseInt(e.target.value))
                            })}
                            className="edit-input"
                          />
                          <select
                            value={editItem.unit_type}
                            onChange={(e) => setEditItem({
                              ...editItem,
                              unit_type: e.target.value
                            })}
                            className="edit-select"
                          >
                            {['шт', 'кг', 'г', 'л', 'мл'].map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <>
                          <span className="quantity">{item.quantity}</span>
                          <span className="unit">{item.unit_type}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="shopping-page-item-actions">
                    {editItem?.id === item.id ? (
                      <>
                        <button
                          onClick={() => updateMutation.mutate(editItem)}
                          className="shopping-page-icon-button shopping-page-save-button"
                          disabled={updateMutation.isLoading}
                        >
                          <img src={SaveIcon} alt="" className="icon-md icon-mr" />
                          Сохранить
                        </button>
                        <button
                          onClick={() => setEditItem(null)}
                          className="shopping-page-icon-button shopping-page-cancel-button"
                        >
                          <img src={CancelIcon} alt="" className="icon-md icon-mr" />
                          Отмена
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditItem({...item})}
                          className="shopping-page-icon-button shopping-page-edit-button"
                        >
                          <img src={EditIcon} alt="" className="icon-md" />
                          Изменить
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(item.id)}
                          className="shopping-page-icon-button shopping-page-delete-button"
                          disabled={deleteMutation.isLoading}
                        >
                          <img src={TrashCanIcon} alt="" className="icon-sm" />
                          Удалить
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="shopping-page-empty-state">
              <img src={CartIcon} alt="" className="icon-xl" />
              <h2>Список покупок пуст</h2>
              <p>Добавьте продукты через форму выше</p>
            </div>
          )}
        </section>
      </div>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar
        toastStyle={{
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          fontSize: '14px'
        }}
      />
    </div>
  );
}