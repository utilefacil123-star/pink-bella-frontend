import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
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
      }}
    >
      <div
        className="card border-0 shadow-lg"
        style={{
          width: "100%",
          maxWidth: "400px",
          borderRadius: "20px",
          backgroundColor: "var(--surface-color)",
        }}
      >
        <div className="card-body p-5">
          {/* Logo / Título */}
          <div className="text-center mb-4">
            <i
              className="fas fa-heart"
              style={{ color: "var(--primary-color)", fontSize: "2.5rem" }}
            />
            <h2
              className="fw-bold mt-2"
              style={{ color: "var(--text-color)" }}
            >
              Pink Bella
            </h2>
            <p className="text-muted small">Faça login para continuar</p>
          </div>

          {erro && (
            <div
              className="alert alert-danger"
              style={{ borderRadius: "10px", fontSize: "0.9rem" }}
            >
              <i className="fas fa-exclamation-triangle me-2" />
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label
                htmlFor="email"
                className="form-label fw-500"
                style={{ color: "var(--text-color)", fontWeight: "500" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="seu@email.com"
                style={{
                  backgroundColor: "var(--background-color)",
                  color: "var(--text-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  padding: "12px",
                }}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="senha"
                className="form-label"
                style={{ color: "var(--text-color)", fontWeight: "500" }}
              >
                Senha
              </label>
              <input
                id="senha"
                type="password"
                className="form-control"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  backgroundColor: "var(--background-color)",
                  color: "var(--text-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  padding: "12px",
                }}
              />
            </div>

            <button
              type="submit"
              className="btn w-100 fw-bold"
              disabled={carregando}
              style={{
                backgroundColor: "var(--primary-color)",
                color: "white",
                borderRadius: "10px",
                padding: "12px",
                fontSize: "1rem",
              }}
            >
              {carregando ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
