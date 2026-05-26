// src/components/Sidebar.jsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// Importa o hook para acessar o tema, se necessário, mas focaremos no CSS nativo
// import { useTheme } from '../context/ThemeContext'; 

function Sidebar({ isOpen }) {
    const location = useLocation();
    
    // Lista de itens da navegação
    const navItems = [
        { path: '/dashboard', icon: 'fas fa-tachometer-alt', name: 'Dashboard' },
        { path: '/clientes', icon: 'fas fa-users', name: 'Clientes' },
        { path: '/compras', icon: 'fas fa-shopping-cart', name: 'Compras' },
        { path: '/produtos', icon: 'fas fa-box-open', name: 'Produtos' },
        { path: '/frete', icon: 'fas fa-truck', name: 'Frete' },
        { path: '/configuracoes', icon: 'fas fa-cog', name: 'Configurações' },
    ];

    // Estilos que dependem das variáveis CSS globais
    const sidebarStyle = {
        width: isOpen ? '280px' : '80px',
        backgroundColor: 'var(--sidebar-bg)', // Usa a variável do tema
        color: 'var(--text-color)',
        transition: 'all 0.3s ease',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
        padding: '15px',
        overflowY: 'auto',
    };

    const linkBaseStyle = {
        color: 'var(--text-color)',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        padding: isOpen ? '12px 15px' : '15px',
        marginBottom: '8px',
        borderRadius: '10px',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
    };

    const logoTextStyle = {
        color: 'var(--primary-color)', // Título com a cor primária
        fontWeight: '900',
        fontSize: '1.5rem',
        textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
    };
    
    const navLinkActiveStyle = {
        background: 'var(--sidebar-active-bg)', // Gradiente do tema
        color: 'white',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
    };


    return (
        <div style={sidebarStyle} className="shadow-lg">
            
            {/* Logo/Título */}
            <div className="d-flex align-items-center mb-4 p-2" style={{ borderBottom: '1px solid #333' }}>
                <i className="fas fa-heart me-3" style={{ color: 'var(--primary-color)', fontSize: '1.5rem' }}></i>
                {isOpen && <span style={logoTextStyle}>Pink Bella CRM</span>}
            </div>

            {/* Itens de Navegação */}
            <nav className="mt-4">
                {navItems.map((item) => {
                    const isActive = (location.pathname.startsWith(item.path) && item.path !== '/') || (location.pathname === '/' && item.path === '/dashboard');
                    
                    const itemStyle = isActive
                        ? { ...linkBaseStyle, ...navLinkActiveStyle }
                        : linkBaseStyle;
                        
                    // Efeito de hover (melhor ser feito com um arquivo CSS, mas para o JSX faremos assim)
                    const hoverStyle = {
                        backgroundColor: isActive ? 'none' : 'rgba(255, 255, 255, 0.1)',
                    };

                    return (
                        <Link
                            key={item.path}
                            to={item.path === '/dashboard' ? '/' : item.path}
                            style={itemStyle}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = hoverStyle.backgroundColor;
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
                            }}
                        >
                            <i className={`${item.icon} me-3`} style={{ minWidth: '20px' }}></i>
                            {isOpen && 
                                <span className="fw-semibold" style={{ marginLeft: isOpen ? '0' : '10px' }}>
                                    {item.name}
                                </span>
                            }
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}

export default Sidebar;