// src/components/Sidebar.jsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { path: '/',              icon: 'fas fa-chart-line',   name: 'Dashboard',      exact: true },
  { path: '/clientes',      icon: 'fas fa-users',        name: 'Clientes' },
  { path: '/compras',       icon: 'fas fa-shopping-bag', name: 'Compras' },
  { path: '/produtos',      icon: 'fas fa-box-open',     name: 'Produtos' },
  { path: '/frete',         icon: 'fas fa-truck',        name: 'Frete' },
  { path: '/configuracoes', icon: 'fas fa-cog',          name: 'Configurações' },
];

function Sidebar({ isMini, isMobileOpen, onCloseMobile }) {
  const location = useLocation();
  const { currentTheme } = useTheme();

  const storeName = currentTheme?.storeName || 'Pink Bella CRM';
  const logoUrl   = currentTheme?.logoUrl;

  const showLabels = isMobileOpen || !isMini;

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <aside className="sidebar-container">
      {/* Logo */}
      <div className="sidebar-logo">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo"
            style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <span className="sidebar-logo-icon">
            <i className="fas fa-heart" />
          </span>
        )}
        {showLabels && <span className="sidebar-logo-text">{storeName}</span>}
      </div>

      {/* Navegação */}
      <nav className="sidebar-nav">
        {showLabels && <div className="sidebar-section-label">Menu</div>}

        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-nav-link ${isActive(item) ? 'active' : ''}`}
            onClick={onCloseMobile}
            title={!showLabels ? item.name : undefined}
          >
            <i className={`${item.icon} nav-icon`} />
            {showLabels && <span className="nav-label">{item.name}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
