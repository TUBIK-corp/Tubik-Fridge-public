import { authApi } from '../api/api';
import './Login.css';

import FridgeIcon from '../assets/Fridge.svg';
import QrIcon from '../assets/Qr_code.svg';
import AnalyticsIcon from '../assets/Analytics.svg';
import NotificationIcon from '../assets/Notification.svg';
import CartIcon from '../assets/Cart.svg';
import LoginIcon from '../assets/Login.svg';
import HeaderIcon from '../assets/Header.svg';

export default function Login() {
  return (
    <div className="login-page-wrapper">
      <div className="login-page-content">
        <div className="login-page-left-panel">
          <div className="login-page-brand">
            <img src={HeaderIcon} alt="TUBIK-Fridge" className="icon-md icon-header" />
          </div>
          <div className="login-page-features">
            <h2>Умный холодильник для умной компании</h2>
            <div className="login-page-feature-item">
              <img src={QrIcon} alt="QR Scanner" className="icon-md" />
              <div>
                <h3>QR-Сканирование</h3>
                <p>Мгновенное добавление продуктов через QR-код</p>
              </div>
            </div>
            <div className="login-page-feature-item">
              <img src={AnalyticsIcon} alt="Analytics" className="icon-md" />
              <div>
                <h3>Умная аналитика</h3>
                <p>Отслеживание потребления и формирование отчётов</p>
              </div>
            </div>
            <div className="login-page-feature-item">
              <img src={NotificationIcon} alt="Notifications" className="icon-md" />
              <div>
                <h3>Уведомления</h3>
                <p>Автоматический контроль сроков годности</p>
              </div>
            </div>
            <div className="login-page-feature-item">
              <img src={CartIcon} alt="Shopping List" className="icon-md" />
              <div>
                <h3>Список покупок</h3>
                <p>Удобное планирование закупок</p>
              </div>
            </div>
          </div>
        </div>

        <div className="login-page-right-panel">
          <div className="login-page-login-box">
            <h2>Добро пожаловать!</h2>
            <p>Войдите через корпоративную учетную запись TUBIK для доступа к системе</p>
            <button onClick={authApi.login} className="login-page-login-button">
              <img src={LoginIcon} alt="Login" className="icon-md" />
              Войти в систему
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}