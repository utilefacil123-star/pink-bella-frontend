// src/App.jsx

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { CompraProvider } from './pages/Compras/CompraContext.js';
import { ToastProvider } from './context/ToastContext.js';

import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';

import Home from './pages/Home/index.jsx';
import Login from './pages/Login/Login.jsx';
import Clientes from './pages/Clientes/index.jsx';
import NovoCliente from './pages/Clientes/novo.jsx';
import Compras from './pages/Compras/index.jsx';
import NovaCompra from './pages/Compras/novo.jsx';
import EditarCompra from './pages/Compras/editarcompra.jsx';
import DetalherCompra from './pages/Compras/detalhecompra.jsx';
import FretePage from './pages/Frete/index.jsx';
import Produtos from './pages/Produtos/Produtos.jsx';
import NovoProduto from './pages/Produtos/NovoProduto.jsx';
import Configuracoes from './pages/Configuracoes/index.jsx';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

const DashboardLayout = () => {
  // Desktop: sidebar pode ser colapsada para mini-mode
  const [isMini, setIsMini] = useState(false);
  // Mobile: sidebar abre como drawer
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleDesktop = () => setIsMini((v) => !v);
  const toggleMobile  = () => setIsMobileOpen((v) => !v);
  const closeMobile   = () => setIsMobileOpen(false);

  const wrapperClass = [
    'app-wrapper',
    isMini ? 'sidebar-mini' : '',
    isMobileOpen ? 'mobile-sidebar-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClass}>
      {isMobileOpen && <div className="sidebar-overlay" onClick={closeMobile} />}

      <Sidebar
        isMini={isMini}
        isMobileOpen={isMobileOpen}
        onCloseMobile={closeMobile}
      />

      <div className="main-content-wrapper">
        <Header onToggleDesktop={toggleDesktop} onToggleMobile={toggleMobile} />

        <main className="main-content">
          <ToastProvider>
            <CompraProvider>
              <Outlet />
            </CompraProvider>
          </ToastProvider>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Home />} />

          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/novo" element={<NovoCliente />} />
          <Route path="/clientes/editar/:id" element={<NovoCliente />} />

          <Route path="/compras" element={<Compras />} />
          <Route path="/compras/novo/:clienteId" element={<NovaCompra />} />
          <Route path="/compras/editar/:id" element={<EditarCompra />} />
          <Route path="/compras/detalhe/:id" element={<DetalherCompra />} />

          <Route path="/frete" element={<FretePage />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/produtos/novo" element={<NovoProduto />} />
          <Route path="/produtos/editar/:id" element={<NovoProduto />} />
          <Route path="/configuracoes" element={<Configuracoes />} />

          <Route path="*" element={
            <div className="empty-state" style={{ minHeight: '60vh' }}>
              <i className="fas fa-map-signs empty-state-icon" />
              <p className="empty-state-title">404 — Página não encontrada</p>
              <p className="empty-state-desc">A rota acessada não existe no sistema.</p>
            </div>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
