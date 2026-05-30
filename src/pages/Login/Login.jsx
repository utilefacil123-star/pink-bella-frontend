import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const { data } = await api.post("/auth/login", { email, senha });
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      navigate("/");
    } catch (err) {
      setErro(err.response?.data?.error || "Erro ao fazer login. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--background-color)",
        backgroundImage: "radial-gradient(ellipse at 60% 20%, rgba(216,27,96,0.08) 0%, transparent 60%)",
        padding: "16px",
      }}
    >
      {/* Card de Login */}
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "var(--surface-color)",
          borderRadius: "24px",
          border: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-premium)",
          overflow: "hidden",
        }}
      >
        {/* Faixa topo colorida */}
        <div
          style={{
            height: "4px",
            background: "linear-gradient(90deg, var(--primary-color), var(--secondary-color))",
          }}
        />

        <div style={{ padding: "40px 36px 36px" }}>
          {/* Logo / Título */}
          <div className="text-center mb-4">
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "rgba(216,27,96,0.12)",
                border: "2px solid rgba(216,27,96,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <i className="fas fa-heart" style={{ color: "var(--primary-color)", fontSize: "1.8rem" }} />
            </div>
            <h2 className="fw-bold mb-1" style={{ color: "var(--text-color)", fontSize: "1.6rem" }}>
              Pink Bella
            </h2>
            <p className="text-muted small mb-0">Faça login para acessar o painel</p>
          </div>

          {/* Erro */}
          {erro && (
            <div
              className="d-flex align-items-center gap-2 mb-4 p-3 rounded"
              style={{
                backgroundColor: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "var(--status-danger)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.9rem",
              }}
            >
              <i className="fas fa-exclamation-triangle flex-shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Campo Email */}
            <div className="mb-3">
              <label
                htmlFor="email"
                className="form-label fw-semibold"
                style={{ color: "var(--text-color)", fontSize: "0.9rem" }}
              >
                E-mail
              </label>
              <div style={{ position: "relative" }}>
                <i
                  className="fas fa-envelope"
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--primary-color)",
                    fontSize: "0.9rem",
                    opacity: 0.7,
                  }}
                />
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  placeholder="seu@email.com"
                  style={{ paddingLeft: "40px" }}
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="mb-4">
              <label
                htmlFor="senha"
                className="form-label fw-semibold"
                style={{ color: "var(--text-color)", fontSize: "0.9rem" }}
              >
                Senha
              </label>
              <div style={{ position: "relative" }}>
                <i
                  className="fas fa-lock"
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--primary-color)",
                    fontSize: "0.9rem",
                    opacity: 0.7,
                  }}
                />
                <input
                  id="senha"
                  type={showSenha ? "text" : "password"}
                  className="form-control"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{ paddingLeft: "40px", paddingRight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-color)",
                    opacity: 0.5,
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  <i className={`fas ${showSenha ? "fa-eye-slash" : "fa-eye"}`} />
                </button>
              </div>
            </div>

            {/* Botão */}
            <button
              type="submit"
              className="btn-primary-brand w-100 py-3"
              disabled={carregando}
              style={{ fontSize: "1rem", borderRadius: "var(--radius-md)" }}
            >
              {carregando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Entrando...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt me-2" />
                  Entrar
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
