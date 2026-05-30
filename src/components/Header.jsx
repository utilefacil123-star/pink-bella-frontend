// src/components/Header.jsx

import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

function Header({ onToggleDesktop, onToggleMobile }) {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  const usuario = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('usuario')) || {};
    } catch {
      return {};
    }
  }, []);

  const nomeExibido = usuario.nome || usuario.email?.split('@')[0] || 'Administrador';
  const emailExibido = usuario.email || '';
  const iniciais = nomeExibido.split(' ').slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  return (
    <header className="header-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>

        {/* Esquerda: toggle sidebar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Botão desktop (esconde no mobile) */}
          <button
            className="btn-ghost d-none d-lg-flex"
            onClick={onToggleDesktop}
            title="Alternar sidebar"
            style={{ fontSize: '1rem', color: 'var(--text-muted)' }}
          >
            <i className="fas fa-bars" />
          </button>
          {/* Botão mobile */}
          <button
            className="btn-ghost d-lg-none"
            onClick={onToggleMobile}
            title="Abrir menu"
            style={{ fontSize: '1rem', color: 'var(--text-muted)' }}
          >
            <i className="fas fa-bars" />
          </button>
        </div>

        {/* Direita: perfil */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Saldo / notificação pode ser adicionado aqui */}

          <div
            style={{
              width: 1,
              height: 24,
              backgroundColor: 'var(--border-color)',
              display: 'inline-block',
            }}
          />

          {/* Avatar + nome */}
          <Link
            to="/configuracoes"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
            }}
          >
            <div style={{ textAlign: 'right', lineHeight: 1.3 }} className="d-none d-sm-block">
              <span style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-color)' }}>
                {nomeExibido}
              </span>
              {emailExibido && (
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {emailExibido}
                </span>
              )}
            </div>
            <div className="avatar-initials">{iniciais || 'A'}</div>
          </Link>

          {/* Botão sair */}
          <button
            className="btn-ghost danger"
            onClick={handleLogout}
            title="Sair"
            style={{ fontSize: '0.9rem' }}
          >
            <i className="fas fa-sign-out-alt" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
