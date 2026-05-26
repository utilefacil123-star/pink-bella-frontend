// src/pages/Compras/novo.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { criarCompra } from "../../controllers/compraController";
import { buscarClientePorId } from "../../controllers/clienteController";
import { listarProdutos } from "../../controllers/produtoController";
import { calcularFrete } from "../../controllers/freteController";

const ITEM_VAZIO = { produto_id: "", quantidade: 1 };

function NovaCompra() {
  const navigate = useNavigate();
  const { clienteId } = useParams();

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
        alert("Não foi possível carregar a lista de produtos.");
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
      alert("Selecione um produto e informe quantidade válida para todos os itens.");
      return;
    }
    if (!cliente?.endereco?.cep) {
      alert("Cliente sem CEP cadastrado. Cadastre um endereço antes de criar uma compra.");
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
      alert("Compra registrada com sucesso!");
      navigate("/clientes");
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao registrar compra.";
      alert(`Erro: ${msg}`);
    } finally {
      setConfirmando(false);
    }
  };

  const cardStyle = (selecionado) => ({
    cursor: "pointer",
    borderRadius: "12px",
    border: selecionado
      ? "2px solid var(--primary-color)"
      : "1px solid var(--border-color)",
    backgroundColor: selecionado ? "var(--primary-color)20" : "var(--surface-color)",
    padding: "16px",
    transition: "all 0.2s ease",
    color: "var(--text-color)",
  });

  const inputStyle = {
    backgroundColor: "var(--background-color)",
    color: "var(--text-color)",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
  };

  const labelStyle = { color: "var(--text-color)", fontWeight: "500" };

  return (
    <div className="container-fluid p-0">
      <h1
        className="fw-bold mb-4"
        style={{
          color: "var(--text-color)",
          borderBottom: "2px solid var(--primary-color)",
          paddingBottom: "10px",
        }}
      >
        <i className="fas fa-shopping-cart me-2" style={{ color: "var(--primary-color)" }} />
        Nova Compra — {cliente?.nome || "..."}
      </h1>

      <div
        className="card border-0 shadow-lg"
        style={{ backgroundColor: "var(--surface-color)", borderRadius: "15px" }}
      >
        <div className="card-body p-4">

          {/* ── Etapa 1: Itens ── */}
          <h5 className="fw-bold mb-3" style={{ color: "var(--text-color)" }}>
            <span
              className="badge me-2"
              style={{ backgroundColor: "var(--primary-color)" }}
            >
              1
            </span>
            Produtos da compra
          </h5>

          {itens.map((item, index) => (
            <div
              key={index}
              className="row mb-3 align-items-end p-3 rounded"
              style={{
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--background-color)",
                borderRadius: "10px",
              }}
            >
              <div className="col-md-6">
                <label
                  htmlFor={`produto_id_${index}`}
                  className="form-label"
                  style={labelStyle}
                >
                  Produto
                </label>
                <select
                  className="form-select"
                  id={`produto_id_${index}`}
                  name="produto_id"
                  value={item.produto_id}
                  onChange={(e) => handleItemChange(index, e)}
                  required
                  style={inputStyle}
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
                  className="form-label"
                  style={labelStyle}
                >
                  Quantidade
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
                  style={inputStyle}
                />
              </div>

              <div className="col-md-2 text-end">
                {itens.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleRemoveItem(index)}
                  >
                    <i className="fas fa-trash" />
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="d-flex gap-2 mb-4">
            <button
              type="button"
              className="btn btn-outline-secondary"
              style={{ borderRadius: "8px" }}
              onClick={handleAddItem}
            >
              <i className="fas fa-plus me-1" /> Adicionar item
            </button>
          </div>

          {/* ── Botão calcular frete ── */}
          {etapa === "itens" && (
            <button
              type="button"
              className="btn fw-bold px-4"
              style={{
                backgroundColor: "var(--primary-color)",
                color: "white",
                borderRadius: "10px",
              }}
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
          )}

          {erroFrete && (
            <div className="alert alert-danger mt-3" style={{ borderRadius: "10px" }}>
              <i className="fas fa-exclamation-triangle me-2" />
              {erroFrete}
            </div>
          )}

          {/* ── Etapa 2: Opções de Frete ── */}
          {etapa === "frete" && (
            <>
              <hr style={{ borderColor: "var(--border-color)" }} />

              <h5 className="fw-bold mb-3" style={{ color: "var(--text-color)" }}>
                <span
                  className="badge me-2"
                  style={{ backgroundColor: "var(--primary-color)" }}
                >
                  2
                </span>
                Escolha a opção de frete
              </h5>

              {opcoesFrete.length === 0 ? (
                <div className="alert alert-warning" style={{ borderRadius: "10px" }}>
                  Nenhuma opção de frete disponível para este CEP.
                </div>
              ) : (
                <div className="row g-3 mb-4">
                  {opcoesFrete.map((opcao) => {
                    const selecionado =
                      freteEscolhido?.id_servico === opcao.id_servico;
                    return (
                      <div key={opcao.id_servico} className="col-md-4 col-sm-6">
                        <div
                          style={cardStyle(selecionado)}
                          onClick={() => setFreteEscolhido(opcao)}
                        >
                          {selecionado && (
                            <i
                              className="fas fa-check-circle mb-2 d-block"
                              style={{ color: "var(--primary-color)", fontSize: "1.2rem" }}
                            />
                          )}
                          <div className="fw-bold" style={{ fontSize: "0.95rem" }}>
                            {opcao.nome_transportadora}
                          </div>
                          <div
                            className="text-muted small mb-2"
                            style={{ color: "var(--text-color) !important" }}
                          >
                            {opcao.servico}
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="small">
                              <i className="fas fa-clock me-1" />
                              {opcao.prazo_dias_uteis} dias úteis
                            </span>
                            <span
                              className="fw-bold"
                              style={{ color: "var(--primary-color)", fontSize: "1.1rem" }}
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

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary fw-bold px-4"
                  style={{ borderRadius: "10px" }}
                  onClick={() => {
                    setEtapa("itens");
                    setOpcoesFrete([]);
                    setFreteEscolhido(null);
                  }}
                >
                  <i className="fas fa-arrow-left me-2" />
                  Alterar itens
                </button>

                <button
                  type="button"
                  className="btn fw-bold px-4"
                  style={{
                    backgroundColor: freteEscolhido
                      ? "var(--primary-color)"
                      : "var(--border-color)",
                    color: "white",
                    borderRadius: "10px",
                    cursor: freteEscolhido ? "pointer" : "not-allowed",
                  }}
                  disabled={!freteEscolhido || confirmando}
                  onClick={handleConfirmar}
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
                  className="btn btn-outline-secondary fw-bold px-4"
                  style={{ borderRadius: "10px" }}
                  onClick={() => navigate("/clientes")}
                >
                  Cancelar
                </button>
              </div>
            </>
          )}

          {/* Botão cancelar da etapa 1 */}
          {etapa === "itens" && (
            <button
              type="button"
              className="btn btn-outline-secondary fw-bold px-4 ms-2"
              style={{ borderRadius: "10px" }}
              onClick={() => navigate("/clientes")}
            >
              Cancelar
            </button>
          )}

        </div>
      </div>
    </div>
  );
}

export default NovaCompra;
