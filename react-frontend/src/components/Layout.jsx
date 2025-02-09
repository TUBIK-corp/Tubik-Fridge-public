import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { authApi } from '../api/api';
import './Layout.css';

import QrIcon from '../assets/Qr_codeBl.svg';
import ScannerIcon from '../assets/ScannerBl.svg';
import AnalyticsIcon from '../assets/AnalyticsAltBl.svg';
import NotificationIcon from '../assets/NotificationBl.svg';
import CartIcon from '../assets/CartBl.svg';
import HeaderIcon from '../assets/Header.svg';
import HomeIcon from '../assets/HomeBl.svg'
import ExitIcon from '../assets/Exit.svg';
import MenuIcon from '../assets/Menu.svg';

function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="layout-container">
      <header className="layout-header">
        <Link to="/">
          <h1 className="layout-logo">
            <img src={HeaderIcon} alt="TUBIK-Fridge" className="icon-header" />
          </h1>
        </Link>
        <nav className="layout-nav">
          <button className="layout-menu-button" onClick={toggleMenu}>
            <img src={MenuIcon} alt="menu" className="icon-sm icon-mr" />
            {!isMobile && "Меню"}
          </button>
          {isMenuOpen && (
            <div className="layout-menu">
              <Link to="/" className="layout-menu-item" onClick={toggleMenu}><img src={HomeIcon} alt="" className="icon-md icon-mr" /> Главная</Link>
              <Link to="/scanner" className="layout-menu-item" onClick={toggleMenu}><img src={ScannerIcon} alt="" className="icon-md icon-mr" /> Сканер</Link>
              <Link to="/analytics" className="layout-menu-item" onClick={toggleMenu}><img src={AnalyticsIcon} alt="" className="icon-md icon-mr" /> Аналитика</Link>
              <Link to="/shopping" className="layout-menu-item" onClick={toggleMenu}><img src={CartIcon} alt="" className="icon-md icon-mr" /> Список покупок</Link>
              <Link to="/generator" className="layout-menu-item" onClick={toggleMenu}><img src={QrIcon} alt="" className="icon-md icon-mr" /> Генератор QR</Link>
              <Link to="/code" className="layout-menu-item" onClick={toggleMenu}><img src={NotificationIcon} alt="" className="icon-md icon-mr" /> Уведомления</Link>
              <hr />
              <button onClick={() => { authApi.logout(); toggleMenu(); }} className="layout-menu-item layout-menu-item-logout">
                <img src={ExitIcon} alt="" className="icon-md icon-mr" /> Выйти
              </button>
            </div>
          )}
        </nav>
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;