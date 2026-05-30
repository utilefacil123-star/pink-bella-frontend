import React, { useState, useEffect } from 'react';
import { calcularFrete } from '../../controllers/freteController';
import MostrarEndereco from '../../components/MostrarEndereco';
import { listarClientes } from "../../controllers/clienteController";
import { useToast } from '../../context/ToastContext';

function FretePage() {
  const { toast } = useToast();
  const [nomeCliente, setNomeCliente] = useState('');
  const [cepDestino, setCepDestino] = useState('');
  const [produtos, setProdutos] = useState([{ nome: '', valor: '', quantidade: 1 }]);
  const [fretes, setFretes] = useState([]);
  const [freteSelecionado, setFreteSelecionado] = useState(null);
  const [endereco, setEndereco] = useState('');
  const [descontoProduto, setDescontoProduto] = useState('');
  const [descontoFrete, setDescontoFrete] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enderecoFrete, setEnderecoFrete] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [calculando, setCalculando] = useState(false);
  const [mensagemCopiada, setMensagemCopiada] = useState(false);

  const carregarClientes = async () => {
    try {
      const dados = await listarClientes();
      setClientes(dados);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast.error("Não foi possível carregar a lista de clientes.");
    }
  };

  useEffect(() => {
    carregarClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProdutoChange = (index, field, value) => {
    const novosProdutos = [...produtos];
    novosProdutos[index][field] = value;
    setProdutos(novosProdutos);
  };

  const adicionarProduto = () => {
    setProdutos([...produtos, { nome: '', valor: '', quantidade: 1 }]);
  };

  const calFrete = async () => {
    if (!cepDestino) {
      toast.warning('Informe o CEP de destino.');
      return;
    }
    setCalculando(true);
    try {
      const quantidadeTotal = produtos.reduce((acc, p) => acc + (parseInt(p.quantidade) || 1), 0);
      const response = await calcularFrete(cepDestino, [{ produto_id: 1, quantidade: quantidadeTotal }]);

      if (response && response.opcoes_frete) {
        setFretes(response.opcoes_frete);
      } else {
        setFretes([]);
      }
      setEnderecoFrete(response.enderecoDestino);
      setEndereco(
        `${response.enderecoDestino.logradouro} – Bairro ${response.enderecoDestino.bairro}\nCEP: ${response.enderecoDestino.cep} – ${response.enderecoDestino.cidade}, ${response.enderecoDestino.estado}`
      );
    } catch {
      toast.error('Erro ao calcular o frete. Verifique o CEP e tente novamente.');
    } finally {
      setCalculando(false);
    }
  };

  const gerarTextoPedido = () => {
    if (!nomeCliente) { toast.warning("Preencha o nome do cliente."); return; }
    if (produtos.length === 0) { toast.warning("Adicione ao menos um produto."); return; }
    for (const p of produtos) {
      if (!p.nome || !p.valor) { toast.warning("Todos os produtos precisam ter nome e valor."); return; }
    }
    if (!freteSelecionado || !freteSelecionado.preco_frete) { toast.warning("Selecione uma opção de frete."); return; }
    if (!endereco) { toast.warning("Preencha o endereço de destino."); return; }

    const totalProdutos = produtos.reduce((acc, p) => acc + parseFloat(p.valor || 0), 0);
    const valorDescontoProduto = descontoProduto.includes('%')
      ? (parseFloat(descontoProduto.replace('%', '')) / 100) * totalProdutos
      : parseFloat(descontoProduto || 0);
    const valorFreteOriginal = parseFloat(freteSelecionado?.preco_frete || 0);
    const valorFrete = Math.round(valorFreteOriginal);
    const valorDescontoFrete = descontoFrete.includes('%')
      ? (parseFloat(descontoFrete.replace('%', '')) / 100) * valorFrete
      : parseFloat(descontoFrete || 0);
    const total = totalProdutos - valorDescontoProduto + freteSelecionado.preco_frete - valorDescontoFrete;

    const texto = `📦 Pedido – ${nomeCliente} (Atualizado)

Produto:
${produtos.map(p => `- ${p.nome} – R$${parseFloat(p.valor).toFixed(2)}`).join('\n')}
${valorDescontoProduto > 0 ? `🎁 Desconto nos produtos: -R$${valorDescontoProduto.toFixed(2)}` : ''}

Frete (${freteSelecionado?.nome_transportadora || 'Não selecionado'}): R$${Math.round(freteSelecionado.preco_frete).toFixed(2)}
${valorDescontoFrete > 0 ? `🎁 Desconto no frete: -R$${valorDescontoFrete.toFixed(2)}` : ''}
📍 Prazo de entrega: ${freteSelecionado?.prazo_dias_uteis + 1 || '-'} dias úteis
📫 Endereço de destino:
${endereco}

💰 Total a pagar: R$${Math.round(total.toFixed(2))}

📌 Chave Pix (Telefone): (11) 97844-5381
📌 Nome: Amanda Batista da Silva – Pink Bella`;

    setMensagem(texto);
    navigator.clipboard.writeText(texto);
    toast.success("Texto do pedido copiado para a área de transferência!");
    setMensagemCopiada(true);
    setTimeout(() => setMensagemCopiada(false), 3000);
  };

  return (
    <div className="container-fluid py-2">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fas fa-truck page-title-icon" />
            Frete & Pedido
          </h1>
          <p className="page-subtitle">Calcule o frete e gere o texto do pedido para o cliente.</p>
        </div>
      </div>

      <div className="row g-4">
        {/* Coluna Esquerda: CEP, Endereço e Fretes */}
        <div className="col-lg-4">

          {/* Card: CEP e Cliente */}
          <div className="card-premium mb-4">
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="fas fa-map-marker-alt" style={{ color: "var(--primary-color)" }} />
                Destino
              </h5>
            </div>
            <div className="p-4">
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  Selecionar Cliente
                </label>
                <select
                  className="form-select mb-3"
                  onChange={(e) => {
                    const clienteId = e.target.value;
                    const cliente = clientes.find(c => c.id === parseInt(clienteId));
                    if (cliente) {
                      setNomeCliente(cliente.nome);
                      setCepDestino(cliente.endereco?.cep || '');
                    } else {
                      setNomeCliente('');
                      setCepDestino('');
                    }
                  }}
                >
                  <option value="">Selecione um cliente</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>

                <label className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  CEP de Destino <span style={{ color: "var(--status-danger)" }}>*</span>
                </label>
                <div className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="00000-000"
                    value={cepDestino}
                    onChange={e => setCepDestino(e.target.value)}
                    maxLength={9}
                  />
                  <button
                    className="btn-primary-brand px-3 py-2"
                    onClick={calFrete}
                    disabled={calculando}
                    style={{ whiteSpace: "nowrap", minWidth: "110px" }}
                  >
                    {calculando ? (
                      <span className="spinner-border spinner-border-sm" />
                    ) : (
                      <>
                        <i className="fas fa-search me-1" />
                        Calcular
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Endereço de destino */}
              {enderecoFrete ? (
                <div
                  className="mt-3 p-3 rounded"
                  style={{
                    backgroundColor: "var(--background-color)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <p className="text-muted small fw-semibold mb-2">
                    <i className="fas fa-map-pin me-1" style={{ color: "var(--primary-color)" }} />
                    Endereço Encontrado:
                  </p>
                  <MostrarEndereco endereco={enderecoFrete} />
                </div>
              ) : (
                <div
                  className="mt-3 text-center py-3 rounded"
                  style={{
                    backgroundColor: "var(--background-color)",
                    border: "1px dashed var(--border-color)",
                    color: "var(--text-color)",
                    opacity: 0.5,
                  }}
                >
                  <i className="fas fa-map-marker-alt fa-lg mb-2 d-block" />
                  <small>Informe o CEP para ver o endereço</small>
                </div>
              )}
            </div>
          </div>

          {/* Card: Opções de Frete */}
          {fretes.length > 0 && (
            <div className="card-premium">
              <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <i className="fas fa-shipping-fast" style={{ color: "var(--primary-color)" }} />
                  Opções de Frete
                </h5>
              </div>
              <div className="p-3 d-flex flex-column gap-2">
                {fretes.map((f, i) => {
                  const selecionado = freteSelecionado === f;
                  return (
                    <div
                      key={i}
                      onClick={() => setFreteSelecionado(f)}
                      className="d-flex justify-content-between align-items-center p-3 rounded"
                      style={{
                        cursor: "pointer",
                        border: selecionado
                          ? "2px solid var(--primary-color)"
                          : "1px solid var(--border-color)",
                        backgroundColor: selecionado
                          ? "rgba(216,27,96,0.08)"
                          : "var(--background-color)",
                        transition: "all 0.2s ease",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <div>
                        {selecionado && (
                          <i className="fas fa-check-circle me-2" style={{ color: "var(--primary-color)" }} />
                        )}
                        <strong style={{ color: "var(--text-color)", fontSize: "0.9rem" }}>
                          {f.servico}
                        </strong>
                        <span className="text-muted small ms-1">({f.nome_transportadora || 'N/A'})</span>
                        <br />
                        <small className="text-muted">
                          <i className="fas fa-clock me-1" />
                          {f.prazo_dias_uteis + 1} dias úteis
                        </small>
                      </div>
                      <span
                        className="fw-bold ms-2"
                        style={{
                          color: selecionado ? "var(--primary-color)" : "var(--text-color)",
                          fontSize: "1rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        R$ {Math.round(f.preco_frete).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Coluna Direita: Dados do Pedido */}
        <div className="col-lg-8">

          {/* Card: Cliente e Produtos */}
          <div className="card-premium mb-4">
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="fas fa-clipboard-list" style={{ color: "var(--primary-color)" }} />
                Dados do Pedido
              </h5>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  Nome do Cliente <span style={{ color: "var(--status-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nome completo do cliente"
                  value={nomeCliente}
                  onChange={e => setNomeCliente(e.target.value)}
                />
              </div>

              <label className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                Produtos
              </label>
              <div className="d-flex flex-column gap-2 mb-3">
                {produtos.map((produto, index) => (
                  <div
                    key={index}
                    className="row g-2 align-items-center p-2 rounded"
                    style={{
                      backgroundColor: "var(--background-color)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div className="col-5">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nome do produto"
                        value={produto.nome}
                        onChange={e => handleProdutoChange(index, 'nome', e.target.value)}
                      />
                    </div>
                    <div className="col-3">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Valor R$"
                        value={produto.valor}
                        onChange={e => handleProdutoChange(index, 'valor', e.target.value)}
                      />
                    </div>
                    <div className="col-2">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Qtd"
                        min="1"
                        value={produto.quantidade}
                        onChange={e => handleProdutoChange(index, 'quantidade', e.target.value)}
                      />
                    </div>
                    <div className="col-2 text-end">
                      {produtos.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm py-2 px-3"
                          style={{
                            backgroundColor: "rgba(239,68,68,0.1)",
                            color: "var(--status-danger)",
                            border: "1px solid rgba(239,68,68,0.3)",
                            borderRadius: "var(--radius-sm)",
                          }}
                          onClick={() => setProdutos(produtos.filter((_, i) => i !== index))}
                        >
                          <i className="fas fa-trash" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn-secondary-brand px-4 py-2 mb-4" onClick={adicionarProduto}>
                <i className="fas fa-plus me-2" />
                Adicionar Produto
              </button>

              {/* Descontos */}
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                    Desconto nos Produtos (R$ ou %)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: 10 ou 10%"
                    value={descontoProduto}
                    onChange={e => setDescontoProduto(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                    Desconto no Frete (R$ ou %)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: 5 ou 50%"
                    value={descontoFrete}
                    onChange={e => setDescontoFrete(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botão Gerar */}
          <div className="d-flex gap-3 mb-4">
            <button className="btn-primary-brand px-5 py-2" onClick={gerarTextoPedido}>
              <i className="fas fa-file-alt me-2" />
              Gerar Texto do Pedido
            </button>
          </div>

          {/* Texto Gerado */}
          {mensagem && (
            <div className="card-premium">
              <div
                className="px-4 py-3 d-flex align-items-center justify-content-between"
                style={{ borderBottom: "1px solid var(--border-color)" }}
              >
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <i className="fas fa-copy" style={{ color: "var(--primary-color)" }} />
                  Texto do Pedido
                </h5>
                <button
                  className="btn-secondary-brand px-3 py-1"
                  style={{ fontSize: "0.85rem" }}
                  onClick={() => {
                    navigator.clipboard.writeText(mensagem);
                    setMensagemCopiada(true);
                    setTimeout(() => setMensagemCopiada(false), 3000);
                  }}
                >
                  {mensagemCopiada ? (
                    <>
                      <i className="fas fa-check me-1" /> Copiado!
                    </>
                  ) : (
                    <>
                      <i className="fas fa-copy me-1" /> Copiar
                    </>
                  )}
                </button>
              </div>
              <div className="p-4">
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    backgroundColor: "var(--background-color)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    padding: "16px",
                    color: "var(--text-color)",
                    fontFamily: "var(--font-family)",
                    fontSize: "0.9rem",
                    lineHeight: "1.7",
                    margin: 0,
                  }}
                >
                  {mensagem}
                </pre>
                {mensagemCopiada && (
                  <div
                    className="mt-3 p-2 text-center rounded"
                    style={{
                      backgroundColor: "rgba(16,185,129,0.1)",
                      border: "1px solid rgba(16,185,129,0.3)",
                      color: "var(--status-success)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.85rem",
                    }}
                  >
                    <i className="fas fa-check-circle me-2" />
                    Texto copiado para a área de transferência!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FretePage;
