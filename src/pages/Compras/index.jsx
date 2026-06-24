import React, { useEffect, useState, useContext } from "react";
import { CompraContext } from './CompraContext';
import { useNavigate } from 'react-router-dom';
import { format } from "date-fns";
import { useToast } from "../../context/ToastContext";
import {
  atualizarStatusCompra,
  atualizarRastreio,
} from "../../controllers/compraController";
import {
  obterSaldoMelhorEnvio,
  gerarPixParaCarrinho,
  comprarEtiqueta,
  gerarEtiqueta,
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
      await atualizarStatusCompra(compraId, "Pago");
      await carregarComprasT();
      toast.success(`Compra #${compraId} adicionada ao carrinho.`);
    } catch {
      toast.error("Erro ao adicionar compra ao carrinho Melhor Envio.");
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

  const abrirPagamentoPix = async () => {
    try {
      const saldosC = await obterSaldoMelhorEnvio();
      if (saldosC.saldo >= saldosC.Frete) {
        setVerificandoPagamento(true);
      } else {
        const pix = await gerarPixParaCarrinho();
        setPagamentoPix(pix);
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
              <h4 className="fw-bold mb-0 text-warning">R$ {frete.toFixed(2).replace(".", ",")}</h4>
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
                                <div className="fw-bold text-white">{compra.cliente?.nome || "-"}</div>
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
                                        <div className="card p-3 border-0" style={{ backgroundColor: 'var(--surface-color)', borderRadius: '12px' }}>
                                          <p className="mb-1 small">
                                            <strong>Transportadora:</strong> {compra.frete.transportadora} ({compra.frete.servico_frete})
                                          </p>
                                          <p className="mb-1 small">
                                            <strong>Valor do Frete:</strong> 
                                            <span className="fw-bold text-success ms-1">
                                              R$ {parseFloat(compra.frete.valor || 0).toFixed(2).replace(".", ",")}
                                            </span>
                                          </p>
                                          <p className="mb-0 small">
                                            <strong>Prazo Estimado:</strong> {compra.frete.prazo_frete_dias} dias úteis
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    {compra.codigo_rastreio && (
                                      <div className="mb-3">
                                        <h6 className="fw-bold text-info mb-2">
                                          <i className="fas fa-search me-2"></i> Rastreamento
                                        </h6>
                                        <div className="d-flex flex-wrap gap-2">
                                          <a 
                                            href={compra.codigo_rastreio} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="btn btn-outline-info btn-sm fw-bold px-3 py-2"
                                            style={{ borderRadius: "8px" }}
                                          >
                                            <i className="fas fa-external-link-alt me-1"></i> Rastreio
                                          </a>
                                          <button
                                            className="btn btn-outline-primary btn-sm fw-bold px-3 py-2"
                                            style={{ borderRadius: "8px" }}
                                            onClick={() => {
                                              const texto = `Seu pedido está a caminho! Acompanhe aqui: ${compra.codigo_rastreio}`;
                                              navigator.clipboard.writeText(texto);
                                              toast.success("Mensagem de rastreio copiada!");
                                            }}
                                          >
                                            <i className="fas fa-copy me-1"></i> Copiar Aviso
                                          </button>
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
                    <div className="fw-bold text-white mb-1" style={{ fontSize: '1.05rem' }}>
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
                        <div className="mb-2 text-white-50 small">
                          <strong>Itens:</strong>
                          <div className="mt-1">
                            {compra.itens?.map((item, idx) => (
                              <div key={idx} className="mb-1 text-white">
                                {item.quantidade}x {item.produto?.nome} (R$ {parseFloat(item.subtotal_item || 0).toFixed(2).replace(".", ",")})
                              </div>
                            ))}
                          </div>
                        </div>
                        {compra.frete && (
                          <div className="mb-2 text-white-50 small border-top pt-2" style={{ borderColor: 'var(--border-color)' }}>
                            <strong>Frete:</strong> {compra.frete.transportadora} - R$ {parseFloat(compra.frete.valor || 0).toFixed(2).replace(".", ",")} ({compra.frete.prazo_frete_dias}d)
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
