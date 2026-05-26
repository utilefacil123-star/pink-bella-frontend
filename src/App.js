// src/App.jsx

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { CompraProvider } from './pages/Compras/CompraContext.js';

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
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const sidebarWidth = isSidebarOpen ? '280px' : '80px';
    const headerHeight = '80px';

    return (
        <div
            style={{
                display: 'flex',
                minHeight: '100vh',
                backgroundColor: 'var(--background-color)',
                transition: 'background-color 0.3s ease',
            }}
        >
            <Sidebar isOpen={isSidebarOpen} />

            <div
                style={{
                    flexGrow: 1,
                    marginLeft: sidebarWidth,
                    width: `calc(100% - ${sidebarWidth})`,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                }}
            >
                <Header toggleSidebar={toggleSidebar} />

                <main
                    style={{
                        padding: '30px',
                        paddingTop: headerHeight,
                        minHeight: `calc(100vh - ${headerHeight})`,
                        color: 'var(--text-color)',
                    }}
                >
                    <CompraProvider>
                        <Outlet />
                    </CompraProvider>
                </main>
            </div>
        </div>
    );
};


function App() {
    return (
        <Router>
            <Routes>
                {/* Rota pública */}
                <Route path="/login" element={<Login />} />

                {/* Rotas protegidas */}
                <Route
                    path="/"
                    element={
                        <PrivateRoute>
                            <DashboardLayout />
                        </PrivateRoute>
                    }
                >
                    <Route index element={<Home />} />

                    {/* Clientes */}
                    <Route path="/clientes" element={<Clientes />} />
                    <Route path="/clientes/novo" element={<NovoCliente />} />
                    <Route path="/clientes/editar/:id" element={<NovoCliente />} />

                    {/* Compras */}
                    <Route path="/compras" element={<Compras />} />
                    <Route path="/compras/novo/:clienteId" element={<NovaCompra />} />
                    <Route path="/compras/editar/:id" element={<EditarCompra />} />
                    <Route path="/compras/detalhe/:id" element={<DetalherCompra />} />

                    {/* Outras */}
                    <Route path="/frete" element={<FretePage />} />
                    <Route path="/produtos" element={<Produtos />} />
                    <Route path="/produtos/novo" element={<NovoProduto />} />
                    <Route path="/produtos/editar/:id" element={<NovoProduto />} />
                    <Route path="/configuracoes" element={<Configuracoes />} />

                    <Route path="*" element={
                        <div className="container mt-5 text-center">
                            <h1 style={{ color: 'var(--primary-color)' }}>404 - Página não encontrada</h1>
                            <p>A URL que você tentou acessar não existe.</p>
                        </div>
                    } />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
