// src/pages/Compras/novo.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { criarCompra } from "../../controllers/compraController";
import { buscarClientePorId } from "../../controllers/clienteController";
import { listarProdutos } from "../../controllers/produtoController";
import { calcularFrete } from "../../controllers/freteController";
import { useToast } from "../../context/ToastContext";

const ITEM_VAZIO = { produto_id: "", quantidade: 1 };

function NovaCompra() {
  const navigate = useNavigate();
  const { clienteId } = useParams();
  const { toast } = useToast();

  const [cliente, setCliente] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [itens, setItens] = useState([{ ...ITEM_VAZIO }]);

  const [etapa, setEtapa] = useState("itens"); // "itens" | "frete"
  const [opcoesFrete, setOpcoesFrete] = useState([]);
  const [freteEscolhido, setFreteEscolhido] = useState(null);
  const [calculandoFrete, setCalculandoFrete] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [erroFrete, setErroFrete] = useState("");

  useEffect(() => {
    async function fetchData() {
      if (clienteId) {
        try {
          const dados = await buscarClientePorId(clienteId);
          setCliente(dados);
        } catch {
          setCliente({ nome: "Cliente Desconhecido" });
        }
      }
      try {
        const lista = await listarProdutos();
        setProdutos(lista);
      } catch {
        toast.error("Não foi possível carregar a lista de produtos.");
      }
    }
    fetchData();
  }, [clienteId]);

  const resetarFrete = () => {
    if (etapa === "frete") {
      setEtapa("itens");
      setOpcoesFrete([]);
      setFreteEscolhido(null);
      setErroFrete("");
    }
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const novosItens = [...itens];
    novosItens[index] = {
      ...novosItens[index],
      [name]: name === "quantidade" || name === "produto_id" ? parseInt(value) || "" : value,
    };
    setItens(novosItens);
    resetarFrete();
  };

  const handleAddItem = () => {
    setItens([...itens, { ...ITEM_VAZIO }]);
    resetarFrete();
  };

  const handleRemoveItem = (index) => {
    setItens(itens.filter((_, i) => i !== index));
    resetarFrete();
  };

  const handleCalcularFrete = async () => {
    const itensValidos = itens.every(
      (item) => item.produto_id && item.quantidade > 0
    );
    if (!itensValidos) {
      toast.warning("Selecione um produto e informe quantidade válida para todos os itens.");
      return;
    }
    if (!cliente?.endereco?.cep) {
      toast.warning("Cliente sem CEP cadastrado. Cadastre um endereço antes de criar uma compra.");
      return;
    }

    setCalculandoFrete(true);
    setErroFrete("");
    try {
      const resultado = await calcularFrete(cliente.endereco.cep, itens);
      setOpcoesFrete(resultado.opcoes_frete || []);
      setFreteEscolhido(null);
      setEtapa("frete");
    } catch (err) {
      setErroFrete(
        err.response?.data?.error || "Erro ao calcular frete. Tente novamente."
      );
    } finally {
      setCalculandoFrete(false);
    }
  };

  const handleConfirmar = async () => {
    if (!freteEscolhido) return;
    setConfirmando(true);
    try {
      await criarCompra({
        cliente_id: parseInt(clienteId),
        itens,
        frete_selecionado: freteEscolhido,
      });
      toast.success("Compra registrada com sucesso!");
      navigate("/clientes");
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao registrar compra.";
      toast.error(`Erro: ${msg}`);
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <div className="container-fluid py-3">
      {/* Page Header */}
      <div className="d-flex align-items-center mb-4 gap-3">
        <button
          type="button"
          className="btn btn-sm border-0"
          style={{
            color: "var(--text-color)",
            backgroundColor: "var(--surface-color)",
            borderRadius: "var(--radius-md)",
          }}
          onClick={() => navigate("/clientes")}
        >
          <i className="fas fa-arrow-left" />
        </button>
        <div>
          <h1 className="fw-bold mb-0" style={{ color: "var(--text-color)", fontSize: "1.6rem" }}>
            <i className="fas fa-shopping-cart me-2" style={{ color: "var(--primary-color)" }} />
            Nova Compra
          </h1>
          <p className="text-muted small mb-0">
            Cliente:{" "}
            <span className="fw-semibold" style={{ color: "var(--primary-color)" }}>
              {cliente?.nome || "Carregando..."}
            </span>
          </p>
        </div>
      </div>

      {/* Stepper Visual */}
      <div className="d-flex align-items-center mb-4 gap-2">
        <div
          className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill fw-semibold"
          style={{
            backgroundColor: etapa === "itens" ? "var(--primary-color)" : "rgba(16,185,129,0.15)",
            color: etapa === "itens" ? "#fff" : "var(--status-success)",
            fontSize: "0.85rem",
          }}
        >
          {etapa === "frete" ? (
            <i className="fas fa-check-circle" />
          ) : (
            <span className="fw-bold">1</span>
          )}
          Produtos
        </div>
        <i className="fas fa-chevron-right text-muted" style={{ fontSize: "0.7rem" }} />
        <div
          className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill fw-semibold"
          style={{
            backgroundColor: etapa === "frete" ? "var(--primary-color)" : "var(--surface-color)",
            color: etapa === "frete" ? "#fff" : "var(--text-color)",
            border: "1px solid var(--border-color)",
            fontSize: "0.85rem",
            opacity: etapa === "frete" ? 1 : 0.6,
          }}
        >
          <span className="fw-bold">2</span>
          Frete
        </div>
      </div>

      {/* Seção: Etapa 1 — Produtos */}
      <div className="card-premium mb-4">
        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
          <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
            <i className="fas fa-box" style={{ color: "var(--primary-color)" }} />
            Produtos da Compra
          </h5>
        </div>
        <div className="p-4">
          <div className="d-flex flex-column gap-3">
            {itens.map((item, index) => (
              <div
                key={index}
                className="row align-items-end g-3 p-3 rounded"
                style={{
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--background-color)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div className="col-md-6">
                  <label
                    htmlFor={`produto_id_${index}`}
                    className="form-label fw-semibold"
                    style={{ color: "var(--text-color)" }}
                  >
                    Produto <span style={{ color: "var(--status-danger)" }}>*</span>
                  </label>
                  <select
                    className="form-select"
                    id={`produto_id_${index}`}
                    name="produto_id"
                    value={item.produto_id}
                    onChange={(e) => handleItemChange(index, e)}
                    required
                  >
                    <option value="">Selecione um produto</option>
                    {produtos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} — R$ {Number(p.preco).toFixed(2)}
                        {p.estoque <= 0 ? " (sem estoque)" : ` (estoque: ${p.estoque})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label
                    htmlFor={`quantidade_${index}`}
                    className="form-label fw-semibold"
                    style={{ color: "var(--text-color)" }}
                  >
                    Quantidade <span style={{ color: "var(--status-danger)" }}>*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id={`quantidade_${index}`}
                    name="quantidade"
                    value={item.quantidade}
                    onChange={(e) => handleItemChange(index, e)}
                    required
                    min="1"
                  />
                </div>

                <div className="col-md-2 text-end">
                  {itens.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-sm py-2 px-3"
                      style={{
                        backgroundColor: "rgba(239,68,68,0.1)",
                        color: "var(--status-danger)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        borderRadius: "var(--radius-sm)",
                      }}
                      onClick={() => handleRemoveItem(index)}
                    >
                      <i className="fas fa-trash" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn-secondary-brand mt-3 px-4 py-2"
            onClick={handleAddItem}
          >
            <i className="fas fa-plus me-2" />
            Adicionar Item
          </button>

          {erroFrete && (
            <div
              className="mt-3 p-3 rounded d-flex align-items-center gap-2"
              style={{
                backgroundColor: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "var(--status-danger)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <i className="fas fa-exclamation-triangle" />
              {erroFrete}
            </div>
          )}

          {etapa === "itens" && (
            <div className="d-flex gap-3 mt-4 pt-3" style={{ borderTop: "1px solid var(--border-color)" }}>
              <button
                type="button"
                className="btn-primary-brand px-4 py-2"
                disabled={calculandoFrete}
                onClick={handleCalcularFrete}
              >
                {calculandoFrete ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Calculando frete...
                  </>
                ) : (
                  <>
                    <i className="fas fa-truck me-2" />
                    Calcular Frete
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn-secondary-brand px-4 py-2"
                onClick={() => navigate("/clientes")}
              >
                <i className="fas fa-times me-2" />
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Seção: Etapa 2 — Escolha de Frete */}
      {etapa === "frete" && (
        <div className="card-premium mb-4">
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <i className="fas fa-truck" style={{ color: "var(--primary-color)" }} />
              Escolha a Opção de Frete
            </h5>
          </div>
          <div className="p-4">
            {opcoesFrete.length === 0 ? (
              <div
                className="text-center py-4 rounded"
                style={{
                  backgroundColor: "var(--background-color)",
                  border: "1px dashed var(--border-color)",
                }}
              >
                <i className="fas fa-exclamation-circle fa-2x text-warning mb-2" style={{ opacity: 0.7 }} />
                <p className="text-muted mb-0">Nenhuma opção de frete disponível para este CEP.</p>
              </div>
            ) : (
              <div className="row g-3 mb-4">
                {opcoesFrete.map((opcao) => {
                  const selecionado = freteEscolhido?.id_servico === opcao.id_servico;
                  return (
                    <div key={opcao.id_servico} className="col-md-4 col-sm-6">
                      <div
                        onClick={() => setFreteEscolhido(opcao)}
                        style={{
                          cursor: "pointer",
                          borderRadius: "var(--radius-md)",
                          border: selecionado
                            ? "2px solid var(--primary-color)"
                            : "1px solid var(--border-color)",
                          backgroundColor: selecionado
                            ? "rgba(216,27,96,0.08)"
                            : "var(--background-color)",
                          padding: "16px",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {selecionado && (
                          <i
                            className="fas fa-check-circle mb-2 d-block"
                            style={{ color: "var(--primary-color)", fontSize: "1.1rem" }}
                          />
                        )}
                        <div className="fw-bold" style={{ color: "var(--text-color)", fontSize: "0.95rem" }}>
                          {opcao.nome_transportadora}
                        </div>
                        <div className="text-muted small mb-2">{opcao.servico}</div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="small text-muted">
                            <i className="fas fa-clock me-1" />
                            {opcao.prazo_dias_uteis} dias úteis
                          </span>
                          <span
                            className="fw-bold"
                            style={{ color: "var(--primary-color)", fontSize: "1.05rem" }}
                          >
                            R$ {Number(opcao.preco_frete).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="d-flex gap-3 pt-3 flex-wrap" style={{ borderTop: "1px solid var(--border-color)" }}>
              <button
                type="button"
                className="btn-secondary-brand px-4 py-2"
                onClick={() => {
                  setEtapa("itens");
                  setOpcoesFrete([]);
                  setFreteEscolhido(null);
                }}
              >
                <i className="fas fa-arrow-left me-2" />
                Alterar Itens
              </button>

              <button
                type="button"
                className="btn-primary-brand px-4 py-2"
                disabled={!freteEscolhido || confirmando}
                onClick={handleConfirmar}
                style={{ opacity: !freteEscolhido ? 0.5 : 1 }}
              >
                {confirmando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check me-2" />
                    Confirmar Compra
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-sm border-0 fw-semibold"
                style={{ color: "var(--text-color)", opacity: 0.7 }}
                onClick={() => navigate("/clientes")}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NovaCompra;
