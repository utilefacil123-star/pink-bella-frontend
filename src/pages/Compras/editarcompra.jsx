import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { buscarCompraPorId, calcularFrete, atualizarCompra } from "../../controllers/compraController";
import { listarClientes } from "../../controllers/clienteController";
import { listarProdutos } from "../../controllers/produtoController";
import { useToast } from "../../context/ToastContext";

function EditarCompra() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [endereco, setEndereco] = useState({});
  const [itensCompra, setItensCompra] = useState([]);
  const [opcoesFrete, setOpcoesFrete] = useState([]);
  const [freteSelecionado, setFreteSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      try {
        const compraData = await buscarCompraPorId(id);
        const compra = compraData.compra_atual;
        setClienteSelecionado(compra.cliente);
        setEndereco(compra.endereco);
        setItensCompra(compra.itens.map(item => ({
          produto_id: item.produto.id,
          nome: item.produto.nome,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario_na_compra,
        })));
        // Normaliza as propriedades do frete para o mesmo formato retornado pelo cálculo
        setFreteSelecionado(compra.frete ? {
          preco_frete: compra.frete.valor,
          nome_transportadora: compra.frete.transportadora,
          servico: compra.frete.servico,
          prazo_dias_uteis: compra.frete.prazo_dias_uteis,
        } : null);

        const clientesData = await listarClientes();
        setClientes(clientesData);

        const produtosData = await listarProdutos();
        setProdutos(produtosData);
      } catch (error) {
        toast.error("Erro ao carregar dados da compra.");
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [id]);

  const buscarCep = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setEndereco((prev) => ({
            ...prev,
            logradouro: data.logradouro || "",
            bairro: data.bairro || "",
            cidade: data.localidade || "",
            estado: data.uf || "",
          }));
        } else {
          toast.warning("CEP não encontrado. Preencha o endereço manualmente.");
        }
      } catch (err) {
        toast.error("Erro ao buscar CEP.");
      }
    }
  };

  useEffect(() => {
    const cepLimpo = endereco?.cep?.replace(/\D/g, "");
    if (cepLimpo?.length === 8) {
      buscarCep(endereco.cep);
    }
  }, [endereco.cep]);

  function handleEnderecoChange(e) {
    setEndereco((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function handleClienteChange(e) {
    const clienteId = parseInt(e.target.value);
    const cliente = clientes.find(c => c.id === clienteId);
    setClienteSelecionado(cliente);
    setEndereco(cliente?.endereco || {});
    calcularFreteParaCompra(itensCompra, cliente?.endereco?.cep);
  }

  function handleQuantidadeChange(produto_id, novaQtd) {
    setItensCompra(prev => prev.map(item =>
      item.produto_id === produto_id ? { ...item, quantidade: parseInt(novaQtd) || 0 } : item
    ));
  }

  function handleRemoveItem(produto_id) {
    setItensCompra(prev => prev.filter(item => item.produto_id !== produto_id));
  }

  function handleAddItem() {
    setItensCompra(prev => [...prev, { produto_id: "", nome: "", quantidade: 1, preco_unitario: 0 }]);
  }

  function handleProdutoChange(index, produtoId) {
    const produto = produtos.find(p => p.id === parseInt(produtoId));
    setItensCompra(prev => prev.map((item, i) => {
      if (i === index) {
        return {
          produto_id: produto.id,
          nome: produto.nome,
          quantidade: 1,
          preco_unitario: produto.preco,
        };
      }
      return item;
    }));
  }

  async function calcularFreteParaCompra(itens, cepDestino) {
    if (!cepDestino || itens.length === 0) {
      setOpcoesFrete([]);
      setFreteSelecionado(null);
      return;
    }
    const payload = {
      cepDestino,
      itens: itens.map(i => ({
        produto_id: i.produto_id,
        quantidade: i.quantidade,
      })),
    };
    try {
      const response = await calcularFrete(payload);
      setOpcoesFrete(response.opcoes_frete || []);
      if (response.opcoes_frete?.length) {
        setFreteSelecionado(response.opcoes_frete[0]);
      }
    } catch {
      toast.error("Erro ao calcular frete.");
    }
  }

  useEffect(() => {
    calcularFreteParaCompra(itensCompra, endereco.cep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itensCompra]);

  async function handleSalvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      const valorProdutos = itensCompra.reduce((total, item) => {
        return total + item.preco_unitario * item.quantidade;
      }, 0);
      const valorFrete = freteSelecionado?.preco_frete || 0;
      const valor_total = valorProdutos + valorFrete;

      const payload = {
        cliente_id: clienteSelecionado?.id,
        endereco_entrega_id: endereco.id,
        itens: itensCompra.map(item => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario_no_momento_da_compra: item.preco_unitario,
        })),
        valor_frete: freteSelecionado?.preco_frete,
        transportadora: freteSelecionado?.nome_transportadora,
        servico_frete: freteSelecionado?.servico,
        prazo_frete_dias: freteSelecionado?.prazo_dias_uteis,
        valor_total,
      };
      await atualizarCompra(id, payload);
      toast.success("Compra atualizada com sucesso!");
      navigate("/compras");
    } catch (error) {
      toast.error("Erro ao salvar compra.");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: "300px" }}>
        <div className="text-center">
          <span className="spinner-border" style={{ color: "var(--primary-color)", width: "3rem", height: "3rem" }} />
          <p className="text-muted mt-3">Carregando compra...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3">
      {/* Page Header */}
      <div className="d-flex align-items-center mb-4 gap-3">
        <button
          type="button"
          className="btn btn-sm border-0"
          style={{ color: "var(--text-color)", backgroundColor: "var(--surface-color)", borderRadius: "var(--radius-md)" }}
          onClick={() => navigate("/compras")}
        >
          <i className="fas fa-arrow-left" />
        </button>
        <div>
          <h1 className="fw-bold mb-0" style={{ color: "var(--text-color)", fontSize: "1.6rem" }}>
            <i className="fas fa-edit me-2" style={{ color: "var(--primary-color)" }} />
            Editar Compra <span style={{ color: "var(--primary-color)" }}>#{id}</span>
          </h1>
          <p className="text-muted small mb-0">Altere os dados da compra e salve as modificações.</p>
        </div>
      </div>

      <form onSubmit={handleSalvar}>
        {/* Seção: Cliente */}
        <div className="card-premium mb-4">
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <i className="fas fa-user" style={{ color: "var(--primary-color)" }} />
              Cliente
            </h5>
          </div>
          <div className="p-4">
            <label className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
              Selecionar Cliente <span style={{ color: "var(--status-danger)" }}>*</span>
            </label>
            <select
              className="form-select"
              value={clienteSelecionado?.id || ""}
              onChange={handleClienteChange}
              required
            >
              <option value="">Selecione um cliente</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nome} — ID #{c.id}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Seção: Endereço */}
        <div className="card-premium mb-4">
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <i className="fas fa-map-marker-alt" style={{ color: "var(--primary-color)" }} />
              Endereço de Entrega
            </h5>
          </div>
          <div className="p-4">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  CEP <span style={{ color: "var(--status-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="cep"
                  placeholder="00000-000"
                  value={endereco.cep || ""}
                  onChange={handleEnderecoChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  Logradouro <span style={{ color: "var(--status-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="logradouro"
                  placeholder="Rua, Avenida..."
                  value={endereco.logradouro || ""}
                  onChange={handleEnderecoChange}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  Número <span style={{ color: "var(--status-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="numero"
                  placeholder="123"
                  value={endereco.numero || ""}
                  onChange={handleEnderecoChange}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>Complemento</label>
                <input
                  type="text"
                  className="form-control"
                  name="complemento"
                  placeholder="Apto, Bloco..."
                  value={endereco.complemento || ""}
                  onChange={handleEnderecoChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  Bairro <span style={{ color: "var(--status-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="bairro"
                  placeholder="Bairro"
                  value={endereco.bairro || ""}
                  onChange={handleEnderecoChange}
                  required
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  Cidade <span style={{ color: "var(--status-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="cidade"
                  placeholder="Cidade"
                  value={endereco.cidade || ""}
                  onChange={handleEnderecoChange}
                  required
                />
              </div>
              <div className="col-md-1">
                <label className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  UF <span style={{ color: "var(--status-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="estado"
                  placeholder="SP"
                  value={endereco.estado || ""}
                  onChange={handleEnderecoChange}
                  required
                  maxLength="2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Seção: Produtos */}
        <div className="card-premium mb-4">
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <i className="fas fa-box" style={{ color: "var(--primary-color)" }} />
              Produtos da Compra
            </h5>
          </div>
          <div className="p-4">
            <div className="d-flex flex-column gap-3">
              {itensCompra.map((item, index) => (
                <div
                  key={index}
                  className="row align-items-end g-3 p-3 rounded"
                  style={{ border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }}
                >
                  <div className="col-md-6">
                    <label className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>Produto</label>
                    <select
                      className="form-select"
                      value={item.produto_id || ""}
                      onChange={(e) => handleProdutoChange(index, e.target.value)}
                      required
                    >
                      <option value="">Selecione um produto</option>
                      {produtos.map(produto => (
                        <option key={produto.id} value={produto.id}>
                          {produto.nome} (R$ {produto.preco.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>Quantidade</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={item.quantidade}
                      onChange={(e) => handleQuantidadeChange(item.produto_id, e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-2 text-end">
                    {itensCompra.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm fw-bold px-3 py-2"
                        style={{
                          backgroundColor: "rgba(239,68,68,0.1)",
                          color: "var(--status-danger)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          borderRadius: "var(--radius-sm)"
                        }}
                        onClick={() => handleRemoveItem(item.produto_id)}
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
          </div>
        </div>

        {/* Seção: Opções de Frete */}
        <div className="card-premium mb-4">
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <i className="fas fa-truck" style={{ color: "var(--primary-color)" }} />
              Opções de Frete
            </h5>
          </div>
          <div className="p-4">
            {opcoesFrete.length === 0 ? (
              <div
                className="text-center py-4 rounded"
                style={{ backgroundColor: "var(--background-color)", border: "1px dashed var(--border-color)" }}
              >
                <i className="fas fa-truck fa-2x text-muted mb-2" style={{ opacity: 0.4 }} />
                <p className="text-muted mb-0 small">Nenhuma opção de frete disponível para este endereço.</p>
              </div>
            ) : (
              <div className="row g-3">
                {opcoesFrete.map(opcao => {
                  const selecionado = freteSelecionado?.id_servico === opcao.id_servico;
                  return (
                    <div key={opcao.id_servico} className="col-md-4 col-sm-6">
                      <div
                        onClick={() => setFreteSelecionado(opcao)}
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
                          <i className="fas fa-check-circle mb-2 d-block" style={{ color: "var(--primary-color)", fontSize: "1.1rem" }} />
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
                          <span className="fw-bold" style={{ color: "var(--primary-color)", fontSize: "1.05rem" }}>
                            R$ {Number(opcao.preco_frete).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="d-flex gap-3 flex-wrap">
          <button type="submit" className="btn-primary-brand px-4 py-2" disabled={salvando}>
            {salvando ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Salvando...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2" />
                Salvar Alterações
              </>
            )}
          </button>
          <button
            type="button"
            className="btn-secondary-brand px-4 py-2"
            onClick={() => navigate("/compras")}
            disabled={salvando}
          >
            <i className="fas fa-times me-2" />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditarCompra;
