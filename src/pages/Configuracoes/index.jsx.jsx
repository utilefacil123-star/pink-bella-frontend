// src/pages/Configuracoes/index.jsx

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

function Configuracoes() {
  const { currentThemeKey, changeTheme, themes } = useTheme();
  const { toast } = useToast();

  const themeOptions = [
    {
      key: 'pink-dark',
      name: 'Pink Dark',
      desc: 'Elegante e sofisticado',
      icon: 'fas fa-moon',
      primary: themes['pink-dark']['--primary-color'],
      bg: themes['pink-dark']['--background-color'] || '#121212',
    },
    {
      key: 'pink-light',
      name: 'Pink Light',
      desc: 'Delicado e moderno',
      icon: 'fas fa-sun',
      primary: themes['pink-light']['--primary-color'],
      bg: themes['pink-light']['--background-color'] || '#f8f0f4',
    },
    {
      key: 'dark-blue',
      name: 'Dark Blue',
      desc: 'Profissional e confiável',
      icon: 'fas fa-star',
      primary: themes['dark-blue']['--primary-color'],
      bg: themes['dark-blue']['--background-color'] || '#0d1117',
    },
  ];

  return (
    <div className="container-fluid py-3">
      {/* Page Header */}
      <div className="mb-4">
        <h1 className="fw-bold mb-1" style={{ color: "var(--text-color)", fontSize: "1.6rem" }}>
          <i className="fas fa-cog me-2" style={{ color: "var(--primary-color)" }} />
          Configurações
        </h1>
        <p className="text-muted small mb-0">
          Personalize a aparência e os dados do sistema.
        </p>
      </div>

      <div className="row g-4">

        {/* Card: Tema e Aparência */}
        <div className="col-lg-8">
          <div className="card-premium">
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="fas fa-paint-brush" style={{ color: "var(--primary-color)" }} />
                Tema e Cores
              </h5>
            </div>
            <div className="p-4">
              <p className="text-muted small mb-4">
                Escolha o tema que melhor representa a identidade visual da sua loja.
                A mudança é aplicada imediatamente em todo o sistema.
              </p>

              <div className="row g-3">
                {themeOptions.map((theme) => {
                  const ativo = currentThemeKey === theme.key;
                  return (
                    <div className="col-md-4" key={theme.key}>
                      <button
                        onClick={() => changeTheme(theme.key)}
                        style={{
                          width: "100%",
                          padding: "20px 16px",
                          borderRadius: "var(--radius-md)",
                          border: ativo
                            ? `2px solid ${theme.primary}`
                            : "2px solid var(--border-color)",
                          backgroundColor: ativo
                            ? `${theme.primary}18`
                            : "var(--background-color)",
                          cursor: "pointer",
                          transition: "all 0.25s ease",
                          textAlign: "center",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        {/* Preview do tema */}
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            backgroundColor: theme.bg,
                            border: `3px solid ${theme.primary}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: ativo ? `0 0 0 3px ${theme.primary}40` : "none",
                            position: "relative",
                          }}
                        >
                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              backgroundColor: theme.primary,
                            }}
                          />
                          {ativo && (
                            <div
                              style={{
                                position: "absolute",
                                top: "-4px",
                                right: "-4px",
                                width: "18px",
                                height: "18px",
                                borderRadius: "50%",
                                backgroundColor: "var(--status-success)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.55rem",
                                color: "#fff",
                                fontWeight: "bold",
                              }}
                            >
                              <i className="fas fa-check" />
                            </div>
                          )}
                        </div>

                        <div>
                          <div
                            className="fw-bold"
                            style={{
                              color: ativo ? theme.primary : "var(--text-color)",
                              fontSize: "0.95rem",
                            }}
                          >
                            {theme.name}
                          </div>
                          <div
                            className="text-muted"
                            style={{ fontSize: "0.78rem" }}
                          >
                            {theme.desc}
                          </div>
                        </div>

                        {ativo && (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: "700",
                              color: theme.primary,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            Ativo
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Tema atual */}
              <div
                className="mt-4 p-3 rounded d-flex align-items-center gap-3"
                style={{
                  backgroundColor: "var(--background-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <i className="fas fa-info-circle" style={{ color: "var(--primary-color)" }} />
                <span className="text-muted small">
                  Tema atual:{" "}
                  <strong style={{ color: "var(--text-color)" }}>
                    {themeOptions.find(t => t.key === currentThemeKey)?.name || currentThemeKey}
                  </strong>.
                  {" "}Cada loja pode ter sua própria identidade visual.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card: Dados da Loja */}
        <div className="col-lg-4">
          <div className="card-premium h-100">
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="fas fa-store" style={{ color: "var(--primary-color)" }} />
                Dados da Loja
              </h5>
            </div>
            <div className="p-4 d-flex flex-column gap-3">
              <p className="text-muted small mb-0">
                Configure as informações da sua loja usadas para cálculo de frete e documentos fiscais.
              </p>

              <div
                className="p-3 rounded"
                style={{
                  backgroundColor: "var(--background-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div className="d-flex align-items-center gap-2 mb-2">
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(216,27,96,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <i className="fas fa-heart" style={{ color: "var(--primary-color)", fontSize: "0.8rem" }} />
                  </div>
                  <span className="fw-bold" style={{ color: "var(--text-color)" }}>Pink Bella</span>
                </div>
                <small className="text-muted d-block">Endereço de origem configurado na base de dados.</small>
              </div>

              <button
                className="btn-primary-brand w-100 py-2"
                onClick={() => toast.info("Funcionalidade de edição de dados da loja em desenvolvimento.")}
              >
                <i className="fas fa-edit me-2" />
                Editar Dados da Loja
              </button>
            </div>
          </div>
        </div>

        {/* Card: Informações do Sistema */}
        <div className="col-12">
          <div className="card-premium">
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="fas fa-shield-alt" style={{ color: "var(--primary-color)" }} />
                Informações do Sistema
              </h5>
            </div>
            <div className="p-4">
              <div className="row g-3">
                {[
                  { icon: "fas fa-code-branch", label: "Versão", value: "1.0.0 — Pink Bella CRM" },
                  { icon: "fas fa-server", label: "Ambiente", value: "Produção Local" },
                  { icon: "fas fa-database", label: "Banco de Dados", value: "PostgreSQL" },
                  { icon: "fas fa-shipping-fast", label: "Frete", value: "Melhor Envio API" },
                ].map((item, i) => (
                  <div key={i} className="col-md-3 col-sm-6">
                    <div
                      className="p-3 rounded text-center"
                      style={{
                        backgroundColor: "var(--background-color)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <i className={`${item.icon} mb-2`} style={{ color: "var(--primary-color)", fontSize: "1.2rem", display: "block" }} />
                      <div className="text-muted small">{item.label}</div>
                      <div className="fw-semibold" style={{ color: "var(--text-color)", fontSize: "0.85rem" }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Configuracoes;