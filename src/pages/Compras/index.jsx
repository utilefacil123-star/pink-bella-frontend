import React, { useEffect, useState, useContext } from "react";
import { CompraContext } from './CompraContext';
import { useNavigate } from 'react-router-dom';
import { format } from "date-fns";
import { useToast } from "../../context/ToastContext";
import {
  atualizarStatusCompra,
  atualizarRastreio,
  cotarFreteParaCompra,
  atualizarFreteCompra,
} from "../../controllers/compraController";
import {
  obterSaldoMelhorEnvio,
  gerarPixParaCarrinho,
  comprarEtiqueta,
  gerarEtiqueta,
  limparCarrinhoObsoleto,
  rastrearEnvioIndividual,
} from "../../controllers/freteController";

function Compras() {
  const { comprasT, carregarComprasT, paginacao, mudarPagina, filtros, mudarFiltros } = useContext(CompraContext);
  const navigate = useNavigate();
  const { toast, confirm } = useToast();

  const [compras, setCompras] = useState([]);
  const [saldo, setSaldo] = useState(0);
  const [frete, setFrete] = useState(0);
  const [pagamentoPix, setPagamentoPix] = useState(null);
  const [verificandoPagamento, setVerificandoPagamento] = useState(false);
  const [selecionadas, setSelecionadas] = useState([]);
  const [filtroTextoLocal, setFiltroTextoLocal] = useState("");
  const [expanded, setExpanded] = useState({});
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printUrl, setPrintUrl] = useState("");
  const [rastreiosStatus, setRastreiosStatus] = useState({});
  const [rastreandoId, setRastreandoId] = useState(null);
  const [cotacoesAberta, setCotacoesAberta] = useState(null);
  const [cotacoes, setCotacoes] = useState([]);
  const [cotandoId, setCotandoId] = useState(null);
  const [selecionandoFreteId, setSelecionandoFreteId] = useState(null);

  const carregarSaldo = async () => {
    try {
      const dados = await obterSaldoMelhorEnvio();
      setSaldo(dados.saldo || 0);
      setFrete(dados.Frete || 0);
    } catch (err) {
      console.error("Erro ao carregar saldo:", err);
    }
  };

  useEffect(() => {
    carregarComprasT(1);
    carregarSaldo();
    atualizarRastreio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCompras(comprasT);
  }, [comprasT]);

  // Debounce para busca por texto
  useEffect(() => {
    const timer = setTimeout(() => {
      mudarFiltros({ ...filtros, search: filtroTextoLocal });
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroTextoLocal]);

  const handleMarcarComoPago = async (compraId) => {
    // Atualização otimista imediata — remove o botão antes da resposta chegar
    setCompras((prev) => prev.map((c) =>
      c.id === compraId ? { ...c, status_compra: "Pagar Etiqueta" } : c
    ));
    try {
      const atualizada = await atualizarStatusCompra(compraId, "Pago");
      await carregarSaldo();
      await carregarComprasT();
      if (atualizada?.aviso) {
        toast.warning(`Compra #${compraId} marcada como Pago. Problema no carrinho ME: ${atualizada.aviso}`);
      } else {
        toast.success(`Compra #${compraId} no carrinho! Use "Pagar Carrinho" acima para pagar a etiqueta.`);
      }
    } catch (err) {
      // Reverte a atualização otimista em caso de erro
      await carregarComprasT();
      const msg = err?.response?.data?.error || "Erro ao marcar compra como paga.";
      toast.error(msg);
    }
  };

  const handleCancelarCompra = async (compraId) => {
    const ok = await confirm("Tem certeza que deseja cancelar esta compra?");
    if (!ok) return;
    try {
      const atualizada = await atualizarStatusCompra(compraId, "Cancelado");
      setCompras((prev) => prev.map((c) => (c.id === compraId ? atualizada : c)));
      await carregarComprasT();
      toast.success(`Compra #${compraId} cancelada.`);
    } catch {
      toast.error("Erro ao cancelar compra.");
    }
  };

  const handleAdicionarAoCarrinho = async (compraId) => {
    try {
      const resultado = await atualizarStatusCompra(compraId, "Pago");
      await carregarComprasT();
      await carregarSaldo();
      if (resultado?.aviso) {
        toast.warning(`Compra #${compraId}: ${resultado.aviso}`);
      } else if (resultado?.status_compra === "Pagar Etiqueta") {
        toast.success(`Compra #${compraId} no carrinho! Clique em "Pagar Etiqueta" para pagar.`);
      } else {
        toast.success(`Compra #${compraId} adicionada ao carrinho.`);
      }
    } catch (err) {
      const msg = err?.response?.data?.error || "Erro ao adicionar compra ao carrinho Melhor Envio.";
      toast.error(msg);
    }
  };

  const handleGerarEtiquetaIndividual = async (compra) => {
    try {
      if (compra.status_compra !== "Aguardando Etiqueta") {
        await atualizarStatusCompra(compra.id, "Aguardando Etiqueta");
      }
      if (compra.codigo_etiqueta) {
        await gerarEtiqueta([compra.codigo_etiqueta]);
        toast.success("Etiqueta gerada com sucesso!");
        carregarComprasT();
      } else {
        toast.warning("Código de etiqueta não disponível para esta compra.");
      }
    } catch (err) {
      console.error("Erro ao gerar etiqueta individual:", err);
      toast.error("Erro ao gerar etiqueta.");
    }
  };

  const handleGerarEtiquetasEmLote = async () => {
    const etiquetasParaGerar = compras
      .filter((c) => selecionadas.includes(c.id) && c.status_compra === "Aguardando Etiqueta" && c.codigo_etiqueta)
      .map((c) => c.codigo_etiqueta);

    if (etiquetasParaGerar.length === 0) {
      toast.warning("Nenhuma compra selecionada com 'Aguardando Etiqueta' e código válido.");
      return;
    }

    try {
      await gerarEtiqueta(etiquetasParaGerar);
      toast.success("Etiquetas em lote geradas com sucesso!");
      carregarComprasT();
    } catch (err) {
      console.error("Erro ao gerar etiquetas em lote:", err);
      toast.error("Erro ao gerar etiquetas em lote.");
    }
  };

  const handleNovaCotacao = async (compra) => {
    if (cotacoesAberta === compra.id) {
      setCotacoesAberta(null);
      return;
    }
    setCotandoId(compra.id);
    setCotacoes([]);
    setCotacoesAberta(compra.id);
    try {
      const resultado = await cotarFreteParaCompra(compra.id);
      setCotacoes(resultado.opcoes_frete || []);
    } catch (err) {
      const msg = err?.response?.data?.error || "Erro ao buscar cotações de frete.";
      toast.error(msg);
      setCotacoesAberta(null);
    } finally {
      setCotandoId(null);
    }
  };

  const handleSelecionarFrete = async (compraId, opcao) => {
    setSelecionandoFreteId(opcao.id_servico);
    try {
      await atualizarFreteCompra(compraId, opcao);
      toast.success(`Frete alterado para ${opcao.nome_transportadora} — ${opcao.servico} (R$ ${opcao.preco_frete.toFixed(2).replace(".", ",")})`);
      setCotacoesAberta(null);
      await carregarComprasT();
    } catch (err) {
      const msg = err?.response?.data?.error || "Erro ao atualizar frete.";
      toast.error(msg);
    } finally {
      setSelecionandoFreteId(null);
    }
  };

  const handleVerificarRastreio = async (compra) => {
    if (!compra.codigo_etiqueta) {
      toast.warning("Compra sem código de etiqueta — aguardando geração.");
      return;
    }
    setRastreandoId(compra.id);
    try {
      const resultado = await rastrearEnvioIndividual(compra.codigo_etiqueta);
      const dados = resultado[compra.codigo_etiqueta] || Object.values(resultado)[0];
      if (dados) {
        setRastreiosStatus(prev => ({ ...prev, [compra.id]: dados }));
      } else {
        toast.info("Nenhuma informação de rastreio disponível ainda.");
      }
    } catch {
      toast.error("Erro ao consultar rastreio. Tente novamente.");
    } finally {
      setRastreandoId(null);
    }
  };

  const handleLimparCarrinhoObsoleto = async () => {
    try {
      const resultado = await limparCarrinhoObsoleto();
      await carregarSaldo();
      if (resultado.removidos.length === 0) {
        toast.info("Carrinho já está limpo — nenhum item obsoleto encontrado.");
      } else {
        const totalRemovido = resultado.removidos.reduce((s, i) => s + i.price, 0);
        toast.success(
          `${resultado.removidos.length} item(s) obsoleto(s) removido(s) — R$ ${totalRemovido.toFixed(2).replace(".", ",")} a menos no carrinho.`
        );
      }
    } catch (err) {
      toast.error("Erro ao limpar carrinho obsoleto.");
    }
  };

  const abrirPagamentoPix = async () => {
    try {
      const saldosC = await obterSaldoMelhorEnvio();

      if (!saldosC.Frete || saldosC.Frete <= 0) {
        toast.warning("Carrinho Melhor Envio está vazio. Adicione a compra ao carrinho primeiro.");
        return;
      }

      if (saldosC.saldo >= saldosC.Frete) {
        toast.info(`Saldo suficiente (R$ ${saldosC.saldo.toFixed(2).replace(".",",")}). Processando pagamento das etiquetas...`);
        setVerificandoPagamento(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const pix = await gerarPixParaCarrinho();
        setPagamentoPix(pix);
        window.scrollTo({ top: 0, behavior: "smooth" });
        toast.info(`Saldo insuficiente. QR Code PIX gerado — role para o topo para visualizar.`);
      }

      await carregarComprasT();
      await carregarSaldo();
    } catch {
      toast.error("Erro ao iniciar pagamento PIX.");
    }
  };

  useEffect(() => {
    if (verificandoPagamento) {
      const intervalo = setInterval(async () => {
        const dados = await obterSaldoMelhorEnvio();
        setSaldo(dados.saldo);
        if (dados.saldo >= dados.Frete) {
          clearInterval(intervalo);
          setVerificandoPagamento(false);
          try {
            await comprarEtiqueta();
            await carregarComprasT(); 
            toast.success("Etiquetas compradas com sucesso! Agora você pode gerá-las.");
            setPagamentoPix(null);
          } catch (error) {
            console.error("Erro ao finalizar compra de etiquetas:", error);
            toast.error("Erro ao finalizar compra de etiquetas.");
          }
        }
      }, 5000);
      return () => clearInterval(intervalo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificandoPagamento, frete]);

  const comprasFiltradas = compras;

  const statusCounts = compras.reduce((acc, compra) => {
    if (!acc[compra.status_compra]) acc[compra.status_compra] = 0;
    acc[compra.status_compra]++;
    return acc;
  }, {});

  const handleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGerarLinkImpressao = async (compraId) => {
    try {
      const compra = compras.find((c) => c.id === compraId);
      if (!compra || !compra.codigo_etiqueta) {
        toast.warning("Código de etiqueta não disponível para esta compra.");
        return;
      }
      const response = await fetch("http://localhost:3000/melhor-envio/imprimir-etiquetas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders: [compra.codigo_etiqueta], mode: "public" }),
      });
      const data = await response.json();
      if (data.url) {
        setPrintUrl(data.url);
        setShowPrintModal(true);
      } else {
        toast.error("Não foi possível gerar o link de impressão.");
      }
    } catch (error) {
      console.error("Erro ao gerar link de impressão:", error);
      toast.error("Erro ao gerar link de impressão.");
    }
  };

  const handleGerarLinkImpressaoEmLote = async () => {
    const etiquetasParaImprimir = compras
      .filter((c) => selecionadas.includes(c.id) && c.status_compra === "Etiqueta PDF Gerada" && c.codigo_etiqueta)
      .map((c) => c.codigo_etiqueta);

    if (etiquetasParaImprimir.length === 0) {
      toast.warning("Nenhuma compra selecionada com 'Etiqueta PDF Gerada' para impressão.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/melhor-envio/imprimir-etiquetas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders: etiquetasParaImprimir, mode: "public" }),
      });
      const data = await response.json();
      if (data.url) {
        setPrintUrl(data.url);
        setShowPrintModal(true);
      } else {
        toast.error("Não foi possível gerar o link de impressão em lote.");
      }
    } catch (error) {
      console.error("Erro ao gerar link de impressão em lote:", error);
      toast.error("Erro ao gerar link de impressão em lote.");
    }
  };

  const statusToClass = {
    "Pendente": "badge-status pendente",
    "Pago": "badge-status pago",
    "Pagar Etiqueta": "badge-status aguardando",
    "Aguardando Etiqueta": "badge-status aguardando",
    "Etiqueta PDF Gerada": "badge-status postado",
    "Postado": "badge-status envio",
    "Entregue": "badge-status pago",
    "Finalizado": "badge-status pago",
    "Cancelado": "badge-status cancelado"
  };

  const statusToCardStyle = {
    "Pendente": { borderLeft: "4px solid var(--status-warning)" },
    "Pago": { borderLeft: "4px solid var(--status-success)" },
    "Pagar Etiqueta": { borderLeft: "4px solid var(--status-warning)" },
    "Aguardando Etiqueta": { borderLeft: "4px solid var(--status-info)" },
    "Etiqueta PDF Gerada": { borderLeft: "4px solid var(--primary-color)" },
    "Postado": { borderLeft: "4px solid var(--status-info)" },
    "Entregue": { borderLeft: "4px solid var(--status-success)" },
    "Finalizado": { borderLeft: "4px solid var(--status-success)" },
    "Cancelado": { borderLeft: "4px solid var(--status-danger)" }
  };

  return (
    <div className="container-fluid py-2">

      {/* Cabeçalho da página */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fas fa-shopping-bag page-title-icon" />
            Compras
          </h1>
          <p className="page-subtitle">Gerencie pedidos, etiquetas e rastreamento.</p>
        </div>
      </div>

      {/* Dashboard de Status */}
      <div className="row g-3 mb-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          status !== "Cancelado" && (
            <div key={status} className="col-lg-2 col-md-3 col-sm-4 col-6">
              <div className="card-premium h-100" style={statusToCardStyle[status] || {}}>
                <div className="card-body text-center p-3">
                  <div className="fw-bold text-muted small text-uppercase mb-2">
                    {status}
                  </div>
                  <h3 className="fw-bold mb-0">{count}</h3>
                </div>
              </div>
            </div>
          )
        ))}
        {filtroTextoLocal && statusCounts["Cancelado"] && (
          <div className="col-lg-2 col-md-3 col-sm-4 col-6">
            <div className="card-premium h-100" style={{ borderLeft: "4px solid var(--status-danger)" }}>
              <div className="card-body text-center p-3">
                <div className="fw-bold text-muted small text-uppercase mb-2">
                  Cancelado
                </div>
                <h3 className="fw-bold mb-0 text-danger">{statusCounts["Cancelado"]}</h3>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Painel de Saldo e Carrinho */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card-premium h-100" style={{ 
            borderLeft: "4px solid var(--status-success)", 
            backgroundColor: "rgba(16, 185, 129, 0.05)" 
          }}>
            <div className="card-body text-center py-3">
              <i className="fas fa-wallet fa-2x text-success mb-2"></i>
              <h6 className="text-muted fw-bold small text-uppercase">Saldo Melhor Envio</h6>
              <h4 className="fw-bold mb-0 text-success">R$ {saldo.toFixed(2).replace(".", ",")}</h4>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card-premium h-100" style={{
            borderLeft: "4px solid var(--status-warning)",
            backgroundColor: "rgba(245, 158, 11, 0.05)"
          }}>
            <div className="card-body text-center py-3">
              <i className="fas fa-shopping-cart fa-2x text-warning mb-2"></i>
              <h6 className="text-muted fw-bold small text-uppercase">Carrinho Melhor Envio</h6>
              <h4 className="fw-bold mb-2 text-warning">R$ {frete.toFixed(2).replace(".", ",")}</h4>
              {frete > 0 && (
                <button
                  className="btn btn-sm btn-outline-secondary"
                  style={{ fontSize: '0.7rem' }}
                  onClick={handleLimparCarrinhoObsoleto}
                  title="Remove do carrinho itens de pedidos antigos/cancelados"
                >
                  <i className="fas fa-broom me-1"></i>Limpar obsoletos
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-4 d-flex align-items-stretch">
          {frete > 0 && (
            <button
              className="btn-primary-brand w-100"
              onClick={abrirPagamentoPix}
              disabled={verificandoPagamento}
            >
              <i className="fas fa-credit-card me-2"></i>
              {verificandoPagamento ? "Verificando..." : "Pagar Carrinho"}
            </button>
          )}
        </div>
      </div>
      
      {/* Modal de Pagamento PIX */}
      {pagamentoPix && (
        <div className="card-premium mb-4">
          <div className="card-header py-3" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
            <h5 className="mb-0 fw-bold d-flex align-items-center">
              <i className="fas fa-qrcode me-2 text-primary"></i> Pagamento PIX
            </h5>
          </div>
          <div className="card-body text-center p-4">
            <h4 className="fw-bold text-success mb-3">
              Valor: R$ {pagamentoPix.valor}
            </h4>
            <div className="mb-3">
              <img
                src={pagamentoPix.urlQrCodeImagem}
                alt="QR Code PIX"
                className="img-fluid shadow-sm p-2 bg-white"
                style={{ maxWidth: "220px", borderRadius: "12px" }}
              />
            </div>
            <button
              className="btn-primary-brand"
              onClick={() => {
                navigator.clipboard.writeText(pagamentoPix.codigoParaCopiar);
                toast.success("Código PIX copiado!");
              }}
            >
              <i className="fas fa-copy me-2"></i> Copiar Código PIX
            </button>
          </div>
        </div>
      )}

      {/* Seção de Filtros */}
      <div className="card-premium mb-4">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3 d-flex align-items-center">
            <i className="fas fa-search me-2 text-primary"></i> Filtros de Busca
          </h5>
          <div className="row g-3">
            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Filtrar por Nome do Cliente, CPF ou ID da compra..."
                value={filtroTextoLocal}
                onChange={(e) => setFiltroTextoLocal(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <select
                value={filtros.status}
                onChange={(e) => mudarFiltros({ ...filtros, status: e.target.value })}
                className="form-select"
              >
                <option>Todos</option>
                <option>Pendente</option>
                <option>Pago</option>
                <option>Aguardando Etiqueta</option>
                <option>Etiqueta PDF Gerada</option>
                <option>Postado</option>
                <option>Entregue</option>
                <option>Cancelado</option>
              </select>
            </div>
          </div>
        </div>
      </div>


      {/* Ações em Lote */}
      {selecionadas.length > 0 && (
        <div className="card-premium mb-4">
          <div className="card-body p-3">
            <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
              <span className="fw-bold" style={{ color: 'var(--primary-color)' }}>
                <i className="fas fa-check-square me-2"></i>
                {selecionadas.length} compra(s) selecionada(s)
              </span>
              <div className="d-flex gap-2">
                <button
                  className="btn-primary-brand py-2 px-3"
                  onClick={handleGerarEtiquetasEmLote}
                >
                  <i className="fas fa-tags me-2"></i> Gerar Etiquetas
                </button>
                <button
                  className="btn-secondary-brand py-2 px-3"
                  onClick={handleGerarLinkImpressaoEmLote}
                >
                  <i className="fas fa-print me-2"></i> Imprimir em Lote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Compras */}
      <div className="card-premium">
        <div className="card-header py-3" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
          <h5 className="mb-0 fw-bold">
            <i className="fas fa-list me-2" style={{ color: 'var(--primary-color)' }}></i>
            Lista de Compras ({paginacao.total})
          </h5>
        </div>
        <div className="card-body p-0">
          {comprasFiltradas.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-shopping-bag fa-3x text-muted mb-3" style={{ opacity: 0.5 }}></i>
              <h5 className="text-muted">Nenhuma compra encontrada</h5>
              <p className="text-muted small">Crie uma nova compra a partir da listagem de Clientes.</p>
            </div>
          ) : (
            <>
              {/* Desktop e Tablet View */}
              <div className="table-responsive d-none d-md-block">
                <table className="table table-premium table-hover">
                  <thead>
                    <tr>
                      <th className="text-center" style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelecionadas(comprasFiltradas.map(c => c.id));
                            } else {
                              setSelecionadas([]);
                            }
                          }}
                          checked={selecionadas.length === comprasFiltradas.length && comprasFiltradas.length > 0}
                        />
                      </th>
                      <th>ID</th>
                      <th>Data</th>
                      <th>Cliente</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th className="text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comprasFiltradas.map((compra) => (
                      <React.Fragment key={compra.id}>
                        <tr className="align-middle">
                          <td className="text-center">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selecionadas.includes(compra.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelecionadas((prev) => [...prev, compra.id]);
                                } else {
                                  setSelecionadas((prev) =>
                                    prev.filter((id) => id !== compra.id)
                                  );
                                }
                              }}
                            />
                          </td>
                          <td className="fw-bold" style={{ color: 'var(--primary-color)' }}>#{compra.id}</td>
                          <td>
                            {compra.data_compra
                              ? format(new Date(compra.data_compra), "dd/MM/yyyy HH:mm")
                              : "-"}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="text-white rounded-circle d-flex align-items-center justify-content-center me-2" 
                                  style={{ backgroundColor: 'var(--primary-color)', width: '32px', height: '32px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                {compra.cliente?.nome?.charAt(0).toUpperCase() || "C"}
                              </div>
                              <div>
                                <div className="fw-bold" style={{ color: 'var(--text-color)' }}>{compra.cliente?.nome || "-"}</div>
                                <small className="text-muted text-xs">{compra.cliente?.email || ""}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="fw-bold" style={{ color: 'var(--status-success)' }}>
                              R$ {parseFloat(compra.valor_total || 0).toFixed(2).replace(".", ",")}
                            </div>
                            {compra.frete?.valor && compra.status_compra === "Pago" && (
                              <span className="badge-status pago mt-1" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                Frete: R$ {parseFloat(compra.frete.valor || 0).toFixed(2).replace(".", ",")}
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={statusToClass[compra.status_compra] || "badge-status"}>
                              {compra.status_compra}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="d-flex gap-2 justify-content-center flex-wrap">
                              {compra.status_compra === "Pendente" && (
                                <button
                                  className="btn btn-sm btn-success fw-bold"
                                  style={{ borderRadius: '8px', fontSize: '0.75rem' }}
                                  onClick={() => handleMarcarComoPago(compra.id)}
                                >
                                  <i className="fas fa-check me-1"></i>Marcar Pago
                                </button>
                              )}
                              {compra.status_compra === "Pago" && (
                                <button
                                  className="btn btn-sm btn-warning fw-bold"
                                  style={{ borderRadius: '8px', fontSize: '0.75rem' }}
                                  onClick={() => handleAdicionarAoCarrinho(compra.id)}
                                >
                                  <i className="fas fa-shopping-cart me-1"></i>Carrinho
                                </button>
                              )}
                              {compra.status_compra === "Pagar Etiqueta" && (
                                <button
                                  className="btn btn-sm btn-warning fw-bold"
                                  style={{ borderRadius: '8px', fontSize: '0.75rem' }}
                                  onClick={abrirPagamentoPix}
                                  disabled={verificandoPagamento}
                                  title="Pagar a etiqueta de frete no Melhor Envio"
                                >
                                  <i className="fas fa-credit-card me-1"></i>Pagar Etiqueta
                                </button>
                              )}
                              {compra.status_compra === "Aguardando Etiqueta" && (
                                <button
                                  className="btn btn-sm btn-primary fw-bold"
                                  style={{ borderRadius: '8px', fontSize: '0.75rem' }}
                                  onClick={() => handleGerarEtiquetaIndividual(compra)}
                                >
                                  <i className="fas fa-tag me-1"></i>Etiqueta
                                </button>
                              )}
                              {compra.status_compra === "Etiqueta PDF Gerada" && (
                                <button
                                  className="btn btn-sm btn-info fw-bold"
                                  style={{ borderRadius: '8px', fontSize: '0.75rem' }}
                                  onClick={() => handleGerarLinkImpressao(compra.id)}
                                >
                                  <i className="fas fa-print me-1"></i>Imprimir
                                </button>
                              )}
                              {!compra.codigo_etiqueta && !["Entregue","Postado","Cancelado"].includes(compra.status_compra) && (
                                <button
                                  className="btn btn-sm btn-outline-secondary border-0"
                                  onClick={() => navigate(`/compras/editar/${compra.id}`)}
                                  title="Editar compra"
                                  style={{ color: 'var(--text-color)' }}
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                              )}
                              <button
                                className="btn btn-sm btn-outline-secondary border-0"
                                onClick={() => handleExpand(compra.id)}
                                title={expanded[compra.id] ? "Recolher" : "Mais detalhes"}
                                style={{ color: 'var(--text-color)' }}
                              >
                                <i className={`fas ${expanded[compra.id] ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-secondary border-0"
                                onClick={() => navigate(`/compras/detalhe/${compra.id}`)}
                                title="Ver detalhes completos"
                                style={{ color: 'var(--primary-color)' }}
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expanded[compra.id] && (
                          <tr>
                            <td colSpan={7} style={{ backgroundColor: 'rgba(0,0,0,0.08) !important' }}>
                              <div className="card-premium p-4 m-2" style={{ background: "var(--background-color)" }}>
                                <div className="row g-4">
                                  <div className="col-md-6">
                                    <h6 className="fw-bold mb-3" style={{ color: 'var(--primary-color)' }}>
                                      <i className="fas fa-shopping-bag me-2"></i>
                                      Detalhes da Compra #{compra.id}
                                    </h6>
                                    
                                    <div className="mb-2">
                                      <strong>Cliente:</strong> {compra.cliente?.nome} ({compra.cliente?.email})
                                    </div>

                                    <div className="mb-3">
                                      <strong>Endereço de Entrega:</strong>
                                      <br />
                                      <span className="text-muted small">
                                        {compra.endereco_entrega?.logradouro}, {compra.endereco_entrega?.numero}
                                        {compra.endereco_entrega?.complemento && `, ${compra.endereco_entrega.complemento}`}
                                        <br />
                                        {compra.endereco_entrega?.bairro}, {compra.endereco_entrega?.cidade} - {compra.endereco_entrega?.estado}
                                        <br />
                                        CEP: {compra.endereco_entrega?.cep}
                                      </span>
                                    </div>

                                    <div>
                                      <strong>Itens Comprados:</strong>
                                      <div className="d-flex flex-wrap gap-2 mt-2">
                                        {compra.itens?.map((item, idx) => (
                                          <div key={idx} className="badge-status p-2" style={{ backgroundColor: 'var(--surface-color)', textTransform: 'none' }}>
                                            {item.quantidade}x {item.produto?.nome}
                                            <span className="fw-bold ms-2" style={{ color: 'var(--primary-color)' }}>
                                              (R$ {parseFloat(item.subtotal_item || 0).toFixed(2).replace(".", ",")})
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="col-md-6">
                                    {compra.frete && (
                                      <div className="mb-3">
                                        <h6 className="fw-bold text-success mb-2">
                                          <i className="fas fa-truck me-2"></i> Informações do Frete
                                        </h6>
                                        <div className="p-3" style={{ backgroundColor: 'rgba(16,185,129,0.06)', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.15)' }}>
                                          <div className="row g-2">
                                            <div className="col-6">
                                              <div className="small" style={{ color: 'var(--text-muted)' }}>Transportadora</div>
                                              <div className="fw-bold small" style={{ color: 'var(--text-color)' }}>{compra.frete.transportadora || "—"}</div>
                                            </div>
                                            <div className="col-6">
                                              <div className="small" style={{ color: 'var(--text-muted)' }}>Serviço</div>
                                              <div className="fw-bold small" style={{ color: 'var(--text-color)' }}>{compra.frete.servico || compra.frete.servico_frete || "—"}</div>
                                            </div>
                                            <div className="col-6">
                                              <div className="small" style={{ color: 'var(--text-muted)' }}>Valor Pago</div>
                                              <div className="fw-bold" style={{ color: 'var(--status-success)' }}>
                                                R$ {parseFloat(compra.frete.valor || 0).toFixed(2).replace(".", ",")}
                                              </div>
                                            </div>
                                            <div className="col-6">
                                              <div className="small" style={{ color: 'var(--text-muted)' }}>Prazo</div>
                                              <div className="fw-bold small" style={{ color: 'var(--text-color)' }}>
                                                {compra.frete.prazo_dias_uteis || compra.frete.prazo_frete_dias || "—"} dias úteis
                                              </div>
                                            </div>
                                          </div>

                                          {compra.pacote && (compra.pacote.peso || compra.pacote.altura) && (
                                            <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(16,185,129,0.2)' }}>
                                              <div className="small mb-1" style={{ color: 'var(--text-muted)' }}>Pacote</div>
                                              <div className="d-flex flex-wrap gap-3">
                                                {compra.pacote.peso && (
                                                  <span className="small" style={{ color: 'var(--text-color)' }}>
                                                    <i className="fas fa-weight-hanging me-1" style={{ color: 'var(--text-muted)' }}></i>
                                                    {parseFloat(compra.pacote.peso).toFixed(2)} kg
                                                  </span>
                                                )}
                                                {compra.pacote.altura && (
                                                  <span className="small" style={{ color: 'var(--text-color)' }}>
                                                    <i className="fas fa-cube me-1" style={{ color: 'var(--text-muted)' }}></i>
                                                    {compra.pacote.altura}×{compra.pacote.largura}×{compra.pacote.comprimento} cm
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Nova Cotação de Frete */}
                                    {['Pendente', 'Pago'].includes(compra.status_compra) && (
                                      <div className="mb-3">
                                        <button
                                          className="btn btn-sm fw-bold w-100"
                                          style={{ borderRadius: '10px', backgroundColor: 'rgba(216,27,96,0.1)', color: 'var(--primary-color)', border: '1px solid rgba(216,27,96,0.3)' }}
                                          onClick={() => handleNovaCotacao(compra)}
                                          disabled={cotandoId === compra.id}
                                        >
                                          <i className={`fas ${cotandoId === compra.id ? "fa-spinner fa-spin" : cotacoesAberta === compra.id ? "fa-times" : "fa-search-dollar"} me-2`}></i>
                                          {cotandoId === compra.id ? "Cotando..." : cotacoesAberta === compra.id ? "Fechar Cotações" : "Nova Cotação de Frete"}
                                        </button>

                                        {cotacoesAberta === compra.id && (
                                          <div className="mt-2 p-3" style={{ backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                            {cotacoes.length === 0 && cotandoId !== compra.id && (
                                              <p className="mb-0 small text-center" style={{ color: 'var(--text-muted)' }}>Nenhuma opção disponível.</p>
                                            )}
                                            {cotacoes.map((opcao) => {
                                              const isAtual = opcao.id_servico === compra.melhor_envio_service_id;
                                              const isSelecionando = selecionandoFreteId === opcao.id_servico;
                                              return (
                                                <div
                                                  key={opcao.id_servico}
                                                  className="d-flex align-items-center justify-content-between p-2 mb-2 rounded"
                                                  style={{
                                                    backgroundColor: isAtual ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)',
                                                    border: isAtual ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border-color)',
                                                    borderRadius: '8px',
                                                  }}
                                                >
                                                  <div style={{ flex: 1 }}>
                                                    <div className="fw-bold small" style={{ color: 'var(--text-color)' }}>
                                                      {opcao.nome_transportadora}
                                                      {isAtual && (
                                                        <span className="ms-2 badge" style={{ fontSize: '0.6rem', backgroundColor: 'rgba(16,185,129,0.2)', color: 'var(--status-success)', borderRadius: '4px', padding: '2px 6px' }}>
                                                          atual
                                                        </span>
                                                      )}
                                                    </div>
                                                    <div className="small" style={{ color: 'var(--text-muted)' }}>
                                                      {opcao.servico} · {opcao.prazo_dias_uteis}d úteis
                                                    </div>
                                                  </div>
                                                  <div className="d-flex align-items-center gap-2">
                                                    <span className="fw-bold" style={{ color: 'var(--status-success)', fontSize: '0.95rem', minWidth: '72px', textAlign: 'right' }}>
                                                      R$ {opcao.preco_frete.toFixed(2).replace(".", ",")}
                                                    </span>
                                                    {!isAtual && (
                                                      <button
                                                        className="btn btn-sm fw-bold"
                                                        style={{ borderRadius: '8px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', minWidth: '76px', fontSize: '0.75rem' }}
                                                        onClick={() => handleSelecionarFrete(compra.id, opcao)}
                                                        disabled={isSelecionando || !!selecionandoFreteId}
                                                      >
                                                        {isSelecionando ? <i className="fas fa-spinner fa-spin"></i> : "Selecionar"}
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {(compra.codigo_rastreio || compra.codigo_etiqueta) && (
                                      <div className="mb-3">
                                        <h6 className="fw-bold mb-2" style={{ color: 'var(--status-info)' }}>
                                          <i className="fas fa-map-marker-alt me-2"></i> Rastreamento
                                        </h6>
                                        <div className="p-3" style={{ backgroundColor: 'rgba(59,130,246,0.06)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.15)' }}>
                                          {compra.codigo_etiqueta && (
                                            <div className="small mb-2" style={{ color: 'var(--text-muted)' }}>
                                              Etiqueta ME: <code style={{ color: 'var(--primary-color)' }}>{compra.codigo_etiqueta}</code>
                                            </div>
                                          )}

                                          <div className="d-flex flex-wrap gap-2 mb-2">
                                            <button
                                              className="btn btn-sm fw-bold"
                                              style={{ borderRadius: '8px', backgroundColor: 'rgba(59,130,246,0.15)', color: 'var(--status-info)', border: '1px solid rgba(59,130,246,0.3)' }}
                                              onClick={() => handleVerificarRastreio(compra)}
                                              disabled={rastreandoId === compra.id}
                                            >
                                              <i className={`fas ${rastreandoId === compra.id ? "fa-spinner fa-spin" : "fa-satellite-dish"} me-1`}></i>
                                              {rastreandoId === compra.id ? "Verificando..." : "Verificar Status"}
                                            </button>
                                            {compra.codigo_rastreio && (
                                              <>
                                                <a
                                                  href={compra.codigo_rastreio}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="btn btn-sm fw-bold"
                                                  style={{ borderRadius: '8px', backgroundColor: 'rgba(59,130,246,0.1)', color: 'var(--status-info)', border: '1px solid rgba(59,130,246,0.25)' }}
                                                >
                                                  <i className="fas fa-external-link-alt me-1"></i> Rastrear
                                                </a>
                                                <button
                                                  className="btn btn-sm"
                                                  style={{ borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(`Seu pedido está a caminho! Acompanhe aqui: ${compra.codigo_rastreio}`);
                                                    toast.success("Mensagem de rastreio copiada!");
                                                  }}
                                                >
                                                  <i className="fas fa-copy me-1"></i> Copiar
                                                </button>
                                              </>
                                            )}
                                          </div>

                                          {rastreiosStatus[compra.id] && (() => {
                                            const r = rastreiosStatus[compra.id];
                                            const eventos = r.events || r.tracking?.events || [];
                                            const ultimo = eventos[0];
                                            return (
                                              <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(59,130,246,0.2)' }}>
                                                {r.tracking && (
                                                  <div className="small mb-1" style={{ color: 'var(--text-muted)' }}>
                                                    Código: <strong style={{ color: 'var(--text-color)' }}>{r.tracking}</strong>
                                                  </div>
                                                )}
                                                {ultimo && (
                                                  <div className="small p-2 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
                                                    <div className="fw-bold mb-1" style={{ color: 'var(--status-info)' }}>{ultimo.description || ultimo.status}</div>
                                                    {ultimo.location && <div style={{ color: 'var(--text-muted)' }}><i className="fas fa-map-pin me-1"></i>{ultimo.location}</div>}
                                                    {ultimo.date && <div style={{ color: 'var(--text-muted)' }}><i className="far fa-clock me-1"></i>{new Date(ultimo.date).toLocaleString('pt-BR')}</div>}
                                                  </div>
                                                )}
                                                {eventos.length === 0 && (
                                                  <div className="small" style={{ color: 'var(--text-muted)' }}>Nenhum evento de rastreio disponível ainda.</div>
                                                )}
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    )}

                                    {/* Ações por Status */}
                                    <div className="d-flex flex-wrap gap-2 mt-3 pt-3 border-top" style={{ borderColor: 'var(--border-color)' }}>
                                      {compra.status_compra === "Pendente" && (
                                        <button
                                          className="btn btn-success btn-sm fw-bold px-3 py-2"
                                          style={{ borderRadius: "8px" }}
                                          onClick={() => handleMarcarComoPago(compra.id)}
                                        >
                                          <i className="fas fa-check me-1"></i> Marcar Pago
                                        </button>
                                      )}

                                      {compra.status_compra === "Pago" && (
                                        <button
                                          className="btn btn-warning btn-sm fw-bold px-3 py-2"
                                          style={{ borderRadius: "8px" }}
                                          onClick={() => handleAdicionarAoCarrinho(compra.id)}
                                        >
                                          <i className="fas fa-shopping-cart me-1"></i> Adicionar ao Carrinho
                                        </button>
                                      )}

                                      {!compra.codigo_etiqueta && (
                                        <button
                                          className="btn btn-outline-secondary btn-sm fw-bold px-3 py-2"
                                          style={{ borderRadius: "8px", color: 'var(--text-color)' }}
                                          onClick={() => navigate(`/compras/editar/${compra.id}`)}
                                        >
                                          <i className="fas fa-edit me-1"></i> Editar
                                        </button>
                                      )}
                                      
                                      {compra.status_compra === "Aguardando Etiqueta" && (
                                        <button
                                          className="btn btn-primary btn-sm fw-bold px-3 py-2"
                                          style={{ borderRadius: "8px" }}
                                          onClick={() => handleGerarEtiquetaIndividual(compra)}
                                        >
                                          <i className="fas fa-tag me-1"></i> Gerar Etiqueta
                                        </button>
                                      )}
                                      
                                      {compra.status_compra === "Etiqueta PDF Gerada" && (
                                        <button
                                          className="btn btn-info btn-sm fw-bold px-3 py-2"
                                          style={{ borderRadius: "8px" }}
                                          onClick={() => handleGerarLinkImpressao(compra.id)}
                                        >
                                          <i className="fas fa-print me-1"></i> Imprimir Etiqueta
                                        </button>
                                      )}
                                      
                                      {["Pendente", "Pago", "Aguardando Etiqueta"].includes(compra.status_compra) && (
                                        <button
                                          className="btn btn-outline-danger btn-sm fw-bold px-3 py-2"
                                          style={{ borderRadius: "8px" }}
                                          onClick={() => handleCancelarCompra(compra.id)}
                                        >
                                          <i className="fas fa-times me-1"></i> Cancelar
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View (Cards) */}
              <div className="d-md-none p-3">
                {comprasFiltradas.map((compra) => (
                  <div key={compra.id} className="card-registro-mobile">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="fw-bold" style={{ color: 'var(--primary-color)' }}>#{compra.id}</span>
                      <span className={statusToClass[compra.status_compra] || "badge-status"}>
                        {compra.status_compra}
                      </span>
                    </div>
                    <div className="fw-bold mb-1" style={{ fontSize: '1.05rem', color: 'var(--text-color)' }}>
                      {compra.cliente?.nome || "Cliente não informado"}
                    </div>
                    <div className="text-muted small mb-1">
                      <i className="far fa-calendar-alt me-1"></i> 
                      {compra.data_compra ? format(new Date(compra.data_compra), "dd/MM/yyyy HH:mm") : "-"}
                    </div>
                    <div className="fw-bold mb-3" style={{ color: 'var(--status-success)', fontSize: '1.1rem' }}>
                      R$ {parseFloat(compra.valor_total || 0).toFixed(2).replace(".", ",")}
                    </div>
                    
                    <div className="d-flex justify-content-end gap-2 border-top pt-2" style={{ borderColor: 'var(--border-color)' }}>
                      <button
                        className="btn btn-sm btn-outline-secondary border-0 py-2 px-3"
                        onClick={() => handleExpand(compra.id)}
                        style={{ color: 'var(--text-color)' }}
                      >
                        <i className={`fas ${expanded[compra.id] ? "fa-chevron-up" : "fa-chevron-down"} me-1`}></i> 
                        Detalhes
                      </button>
                      <button
                        className="btn btn-sm border-0 py-2 px-3"
                        onClick={() => navigate(`/compras/detalhe/${compra.id}`)}
                        style={{ color: 'var(--primary-color)' }}
                      >
                        <i className="fas fa-eye me-1"></i> Ver
                      </button>
                    </div>

                    {expanded[compra.id] && (
                      <div className="mt-3 p-3 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)' }}>
                        <div className="mb-2 small" style={{ color: 'var(--text-muted)' }}>
                          <strong style={{ color: 'var(--text-color)' }}>Itens:</strong>
                          <div className="mt-1">
                            {compra.itens?.map((item, idx) => (
                              <div key={idx} className="mb-1" style={{ color: 'var(--text-color)' }}>
                                {item.quantidade}x {item.produto?.nome} (R$ {parseFloat(item.subtotal_item || 0).toFixed(2).replace(".", ",")})
                              </div>
                            ))}
                          </div>
                        </div>
                        {compra.frete && (
                          <div className="mb-2 small border-top pt-2" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
                            <strong style={{ color: 'var(--text-color)' }}>Frete:</strong>{' '}
                            {compra.frete.transportadora} — R$ {parseFloat(compra.frete.valor || 0).toFixed(2).replace(".", ",")}
                            {' '}({compra.frete.prazo_dias_uteis || compra.frete.prazo_frete_dias || "—"}d)
                            {compra.pacote?.peso && (
                              <span className="ms-2" style={{ color: 'var(--text-muted)' }}>
                                · {parseFloat(compra.pacote.peso).toFixed(2)} kg
                              </span>
                            )}
                          </div>
                        )}
                        <div className="d-flex flex-wrap gap-2 mt-3 pt-2 border-top" style={{ borderColor: 'var(--border-color)' }}>
                          {compra.status_compra === "Pendente" && (
                            <button className="btn btn-success btn-sm w-100" onClick={() => handleMarcarComoPago(compra.id)}>
                              Marcar Pago
                            </button>
                          )}
                          {compra.status_compra === "Pago" && (
                            <button className="btn btn-warning btn-sm w-100" onClick={() => handleAdicionarAoCarrinho(compra.id)}>
                              <i className="fas fa-shopping-cart me-1"></i> Adicionar ao Carrinho
                            </button>
                          )}
                          {compra.status_compra === "Pagar Etiqueta" && (
                            <button className="btn btn-warning btn-sm w-100 fw-bold" onClick={abrirPagamentoPix} disabled={verificandoPagamento}>
                              <i className="fas fa-credit-card me-1"></i> Pagar Etiqueta
                            </button>
                          )}
                          {compra.status_compra === "Aguardando Etiqueta" && (
                            <button className="btn btn-primary btn-sm w-100" onClick={() => handleGerarEtiquetaIndividual(compra)}>
                              Gerar Etiqueta
                            </button>
                          )}
                          {compra.status_compra === "Etiqueta PDF Gerada" && (
                            <button className="btn btn-info btn-sm w-100" onClick={() => handleGerarLinkImpressao(compra.id)}>
                              Imprimir Etiqueta
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Paginação */}
      {paginacao.totalPages > 1 && (
        <div className="d-flex align-items-center justify-content-between px-2 py-3">
          <span className="text-muted small">
            Página <strong>{paginacao.page}</strong> de <strong>{paginacao.totalPages}</strong>
            {' '}— {paginacao.total} compras no total
          </span>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={paginacao.page <= 1}
              onClick={() => mudarPagina(paginacao.page - 1)}
            >
              <i className="fas fa-chevron-left me-1"></i> Anterior
            </button>
            {Array.from({ length: paginacao.totalPages }, (_, i) => i + 1)
              .filter(p => Math.abs(p - paginacao.page) <= 2)
              .map(p => (
                <button
                  key={p}
                  className={`btn btn-sm ${p === paginacao.page ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => mudarPagina(p)}
                >
                  {p}
                </button>
              ))}
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={paginacao.page >= paginacao.totalPages}
              onClick={() => mudarPagina(paginacao.page + 1)}
            >
              Próxima <i className="fas fa-chevron-right ms-1"></i>
            </button>
          </div>
        </div>
      )}

      {/* Modal de Impressão */}
      {showPrintModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content card-premium border-0 p-2">
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold">
                  <i className="fas fa-print me-2 text-primary"></i> Impressão de Etiquetas
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowPrintModal(false)}
                ></button>
              </div>
              <div className="modal-body text-center p-4">
                <i className="fas fa-file-pdf fa-3x text-danger mb-3"></i>
                <p className="lead mb-4">Suas etiquetas foram geradas e estão prontas para o download!</p>
                <a 
                  href={printUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary-brand text-decoration-none px-4 py-3"
                >
                  <i className="fas fa-download me-2"></i> Baixar PDF das Etiquetas
                </a>
              </div>
              <div className="modal-footer border-0">
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm fw-bold px-3 py-2" 
                  style={{ borderRadius: "8px" }}
                  onClick={() => setShowPrintModal(false)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Compras;
