  import React, { useEffect, useState, useContext } from "react";
  import { CompraContext } from './CompraContext';
  import { useNavigate } from 'react-router-dom';
  import { format } from "date-fns";
  import '../../styles/color.css';
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
    const { comprasT, carregarComprasT } = useContext(CompraContext);
    const navigate = useNavigate();

    const [compras, setCompras] = useState([]);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [saldo, setSaldo] = useState(0);
    const [frete, setFrete] = useState(0);
    const [pagamentoPix, setPagamentoPix] = useState(null);
    const [verificandoPagamento, setVerificandoPagamento] = useState(false);
    const [selecionadas, setSelecionadas] = useState([]);
    const [filtroStatus, setFiltroStatus] = useState("Todos");
    const [filtroTexto, setFiltroTexto] = useState("");
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
      carregarComprasT();
      carregarSaldo();
      atualizarRastreio();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      setCompras(comprasT);
    }, [comprasT]);

    const handleMarcarComoPago = async (compraId) => {
      try {
        const atualizada = await atualizarStatusCompra(compraId, "Pago");
        setCompras((prev) =>
          prev.map((c) => (c.id === compraId ? atualizada : c))
        );
        setMessage(`Compra ${compraId} marcada como 'Pago'.`);
        await carregarSaldo(); 
        await carregarComprasT();
      } catch (err) {
        setError(`Erro ao marcar compra como paga.`);
      }
    };

    const handleCancelarCompra = async (compraId) => {
      if (window.confirm("Tem certeza que deseja cancelar esta compra?")) {
        try {
          const atualizada = await atualizarStatusCompra(compraId, "Cancelado");
          setCompras((prev) =>
            prev.map((c) => (c.id === compraId ? atualizada : c))
          );
          await carregarComprasT();
          setMessage(`Compra ${compraId} cancelado com sucesso.`);
        } catch (err) {
          setError(`Erro ao cancelar compra.`);
        }
      }
    };

    const handleGerarEtiquetaIndividual = async (compra) => {
      try {
        if (compra.status_compra !== "Aguardando Etiqueta") {
          await atualizarStatusCompra(compra.id, "Aguardando Etiqueta");
        }
        if (compra.codigo_etiqueta) {
          await gerarEtiqueta([compra.codigo_etiqueta]);
          setMessage("Etiqueta gerada com sucesso!");
          carregarComprasT(); 
        } else {
          alert("Código de etiqueta não disponível para esta compra.");
        }
      } catch (err) {
        console.error("Erro ao gerar etiqueta individual:", err);
        alert("Erro ao gerar etiqueta. Verifique o console.");
      }
    };

    const handleGerarEtiquetasEmLote = async () => {
      const etiquetasParaGerar = compras
        .filter(
          (c) =>
            selecionadas.includes(c.id) &&
            c.status_compra === "Aguardando Etiqueta" &&
            c.codigo_etiqueta
        )
        .map((c) => c.codigo_etiqueta);

      if (etiquetasParaGerar.length === 0) {
        alert("Nenhuma compra selecionada com status 'Aguardando Etiqueta' e código de etiqueta válido.");
        return;
      }

      try {
        await gerarEtiqueta(etiquetasParaGerar);
        setMessage("Etiquetas em lote geradas com sucesso!");
        carregarComprasT();
      } catch (err) {
        console.error("Erro ao gerar etiquetas em lote:", err);
        alert("Erro ao gerar etiquetas em lote.");
      }
    };

    const abrirPagamentoPix = async () => {
      const saldosC = await obterSaldoMelhorEnvio()
      
      if(saldosC.saldo >= saldosC.Frete){
        setVerificandoPagamento(true);
      } else {
        const pix = await gerarPixParaCarrinho();
        setPagamentoPix(pix);
      }
      await carregarComprasT();
      await carregarSaldo();
    }

    useEffect(() => {
      if (verificandoPagamento) {
        const intervalo = setInterval(async () => {
          const dados = await obterSaldoMelhorEnvio();
          setSaldo(dados.saldo);
          if (dados.saldo >= frete) {
            clearInterval(intervalo);
            setVerificandoPagamento(false);
            try {
              await comprarEtiqueta();
              await carregarComprasT(); 
              setMessage("Etiquetas compradas com sucesso! Agora você pode gerá-las.");
              setPagamentoPix(null);
            } catch (error) {
              console.error("Erro ao finalizar compra de etiquetas:", error);
              setError("Erro ao finalizar compra de etiquetas.");
            }
          }
        }, 5000);
        return () => clearInterval(intervalo);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [verificandoPagamento, frete]);

    const comprasFiltradas = compras.filter((c) => {
      const statusMatch = filtroStatus === "Todos" || c.status_compra === filtroStatus;
      const textoMatch = filtroTexto === "" || (
        (c.cliente && c.cliente.nome && c.cliente.nome.toLowerCase().includes(filtroTexto.toLowerCase())) ||
        (c.cliente && c.cliente.cpf && c.cliente.cpf.includes(filtroTexto)) ||
        (c.id && c.id.toString().includes(filtroTexto))
      );
      return statusMatch && textoMatch;
    });

    const statusCounts = compras.reduce((acc, compra) => {
      if (!acc[compra.status_compra]) {
        acc[compra.status_compra] = 0;
      }
      acc[compra.status_compra]++;
      return acc;
    }, {});

    const handleExpand = (id) => {
      setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleGerarLinkImpressao = async (compraId) => {
      try {
        const compra = compras.find(c => c.id === compraId);
        if (!compra || !compra.codigo_etiqueta) {
          alert("Compra ou código de etiqueta não encontrado.");
          return;
        }
        const response = await fetch("http://localhost:3000/melhor-envio/imprimir-etiquetas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orders: [compra.codigo_etiqueta],
            mode: "public",
          }),
        });
        const data = await response.json();
        if (data.url) {
          setPrintUrl(data.url);
          setShowPrintModal(true);
        } else {
          alert("Não foi possível gerar o link de impressão.");
        }
      } catch (error) {
        console.error("Erro ao gerar link de impressão:", error);
        alert("Erro ao gerar link de impressão.");
      }
    };

    const handleGerarLinkImpressaoEmLote = async () => {
      const etiquetasParaImprimir = compras
        .filter(
          (c) =>
            selecionadas.includes(c.id) &&
            c.status_compra === "Etiqueta PDF Gerada" &&
            c.codigo_etiqueta
        )
        .map((c) => c.codigo_etiqueta);

      if (etiquetasParaImprimir.length === 0) {
        alert("Nenhuma compra selecionada com status 'Etiqueta PDF Gerada' e código de etiqueta válido para impressão.");
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/melhor-envio/imprimir-etiquetas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orders: etiquetasParaImprimir,
            mode: "public",
          }),
        });
        const data = await response.json();
        if (data.url) {
          setPrintUrl(data.url);
          setShowPrintModal(true);
        } else {
          alert("Não foi possível gerar o link de impressão em lote.");
        }
      } catch (error) {
        console.error("Erro ao gerar link de impressão em lote:", error);
        alert("Erro ao gerar link de impressão em lote.");
      }
    };

    const statusToClass = {
      "Pendente": "badge bg-warning text-dark",
      "Pago": "badge bg-success",
      "Aguardando Etiqueta": "badge bg-info",
      "Etiqueta PDF Gerada": "badge bg-primary",
      "Postado": "badge bg-secondary",
      "Entregue": "badge bg-success",
      "Finalizado": "badge bg-dark",
      "Cancelado": "badge bg-danger"
    };

    const statusToCardClass = {
      "Pendente": "border-warning",
      "Pago": "border-success",
      "Aguardando Etiqueta": "border-info",
      "Etiqueta PDF Gerada": "border-primary",
      "Postado": "border-secondary",
      "Entregue": "border-success",
      "Finalizado": "border-dark",
      "Cancelado": "border-danger"
    };

    return (
      <div style={{ 
        background: "linear-gradient(135deg, #FFE5E5 0%, #FFC5C5 50%, #FFB3BA 100%)",
        minHeight: "100vh"
      }} className="p-4">
        
        {/* Header Pinkbella */}
        <div className="container-fluid mb-4">
          <div className="card shadow-lg border-0" style={{ 
            background: "linear-gradient(135deg, #FF69B4 0%, #FFB6C1 50%, #FFC0CB 100%)",
            borderRadius: "20px"
          }}>
            <div className="card-body text-white text-center py-4">
              <h1 className="display-4 fw-bold mb-2" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}>
                💖 Pink Bella - Gestão de Compras
              </h1>
              <p className="lead mb-0">Painel administrativo elegante e profissional</p>
            </div>
          </div>
        </div>

        {/* Dashboard de Status */}
        <div className="container-fluid mb-4">
          <div className="row g-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              status !== "Cancelado" && (
                <div key={status} className="col-md-2 col-sm-4 col-6">
                  <div className={`card shadow-sm h-100 ${statusToCardClass[status] || 'border-secondary'}`} 
                      style={{ borderWidth: "2px", borderRadius: "15px" }}>
                    <div className="card-body text-center p-3">
                      <div className={`${statusToClass[status]} mb-2 px-3 py-1`} 
                          style={{ borderRadius: "20px", fontSize: "0.8rem" }}>
                        {status}
                      </div>
                      <h3 className="fw-bold text-dark">{count}</h3>
                    </div>
                  </div>
                </div>
              )
            ))}
            {filtroTexto && statusCounts["Cancelado"] && (
              <div className="col-md-2 col-sm-4 col-6">
                <div className="card shadow-sm h-100 border-danger" style={{ borderWidth: "2px", borderRadius: "15px" }}>
                  <div className="card-body text-center p-3">
                    <div className="badge bg-danger mb-2 px-3 py-1" style={{ borderRadius: "20px", fontSize: "0.8rem" }}>
                      Cancelado
                    </div>
                    <h3 className="fw-bold text-dark">{statusCounts["Cancelado"]}</h3>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Painel de Saldo e Carrinho */}
        <div className="container-fluid mb-4">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="card shadow-sm border-0" style={{ 
                background: "linear-gradient(135deg, #98FB98 0%, #90EE90 100%)",
                borderRadius: "15px"
              }}>
                <div className="card-body text-center">
                  <i className="fas fa-wallet fa-2x text-success mb-2"></i>
                  <h6 className="text-dark fw-bold">Saldo Melhor Envio</h6>
                  <h4 className="fw-bold text-success">R$ {saldo.toFixed(2).replace(".", ",")}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card shadow-sm border-0" style={{ 
                background: "linear-gradient(135deg, #FFE4B5 0%, #FFDAB9 100%)",
                borderRadius: "15px"
              }}>
                <div className="card-body text-center">
                  <i className="fas fa-shopping-cart fa-2x text-warning mb-2"></i>
                  <h6 className="text-dark fw-bold">Carrinho Melhor Envio</h6>
                  <h4 className="fw-bold text-warning">R$ {frete.toFixed(2).replace(".", ",")}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              {frete > 0 && (
                <div className="d-grid h-100">
                  <button
                    className="btn btn-lg fw-bold text-white shadow-lg"
                    style={{ 
                      background: "linear-gradient(135deg, #FF1493 0%, #FF69B4 100%)",
                      borderRadius: "15px",
                      border: "none"
                    }}
                    onClick={abrirPagamentoPix}
                    disabled={verificandoPagamento}
                  >
                    <i className="fas fa-credit-card me-2"></i>
                    {verificandoPagamento ? "Verificando..." : "Pagar Carrinho"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Modal de Pagamento PIX */}
        {pagamentoPix && (
          <div className="container-fluid mb-4">
            <div className="card shadow-lg border-0" style={{ borderRadius: "20px" }}>
              <div className="card-header text-white text-center" style={{ 
                background: "linear-gradient(135deg, #FF1493 0%, #FF69B4 100%)",
                borderRadius: "20px 20px 0 0"
              }}>
                <h5 className="mb-0 fw-bold">
                  <i className="fas fa-qrcode me-2"></i>
                  Pagamento PIX
                </h5>
              </div>
              <div className="card-body text-center p-4">
                <h4 className="text-primary fw-bold mb-3">
                  Valor: R$ {pagamentoPix.valor}
                </h4>
                <div className="mb-3">
                  <img
                    src={pagamentoPix.urlQrCodeImagem}
                    alt="QR Code PIX"
                    className="img-fluid shadow-sm"
                    style={{ maxWidth: "250px", borderRadius: "15px" }}
                  />
                </div>
                <button
                  className="btn btn-outline-primary btn-lg fw-bold"
                  style={{ borderRadius: "25px" }}
                  onClick={() => navigator.clipboard.writeText(pagamentoPix.codigoParaCopiar)}
                >
                  <i className="fas fa-copy me-2"></i>
                  Copiar Código PIX
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Seção de Filtros */}
        <div className="container-fluid mb-4">
          <div className="card shadow-sm border-0" style={{ borderRadius: "15px" }}>
            <div className="card-header bg-light" style={{ borderRadius: "15px 15px 0 0" }}>
              <h5 className="mb-0 text-dark fw-bold">
                <i className="fas fa-filter me-2 text-primary"></i>
                Filtros de Busca
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-8">
                  <div className="input-group">
                    <span className="input-group-text bg-primary text-white">
                      <i className="fas fa-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Filtrar por Nome do Cliente, CPF ou ID do Cliente"
                      value={filtroTexto}
                      onChange={(e) => setFiltroTexto(e.target.value)}
                      style={{ borderRadius: "0 10px 10px 0" }}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="input-group">
                    <span className="input-group-text bg-secondary text-white">
                      <i className="fas fa-list"></i>
                    </span>
                    <select
                      value={filtroStatus}
                      onChange={(e) => setFiltroStatus(e.target.value)}
                      className="form-select"
                      style={{ borderRadius: "0 10px 10px 0" }}
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
          </div>
        </div>

        {/* Mensagens de Feedback */}
        {message && (
          <div className="container-fluid mb-4">
            <div className="alert alert-success shadow-sm" style={{ borderRadius: "15px" }}>
              <i className="fas fa-check-circle me-2"></i>
              {message}
            </div>
          </div>
        )}
        {error && (
          <div className="container-fluid mb-4">
            <div className="alert alert-danger shadow-sm" style={{ borderRadius: "15px" }}>
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          </div>
        )}

        {/* Ações em Lote */}
        {selecionadas.length > 0 && (
          <div className="container-fluid mb-4">
            <div className="card shadow-sm border-0" style={{ borderRadius: "15px" }}>
              <div className="card-body">
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <span className="fw-bold text-primary">
                    <i className="fas fa-check-square me-2"></i>
                    {selecionadas.length} compra(s) selecionada(s):
                  </span>
                  <button
                    className="btn btn-primary fw-bold"
                    style={{ borderRadius: "20px" }}
                    onClick={handleGerarEtiquetasEmLote}
                  >
                    <i className="fas fa-tags me-2"></i>
                    Gerar Etiquetas em Lote
                  </button>
                  <button
                    className="btn btn-info fw-bold"
                    style={{ borderRadius: "20px" }}
                    onClick={handleGerarLinkImpressaoEmLote}
                  >
                    <i className="fas fa-print me-2"></i>
                    Imprimir em Lote
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabela de Compras */}
        <div className="container-fluid">
          <div className="card shadow-lg border-0" style={{ borderRadius: "20px" }}>
            <div className="card-header text-white" style={{ 
              background: "linear-gradient(135deg, #FF1493 0%, #FF69B4 100%)",
              borderRadius: "20px 20px 0 0"
            }}>
              <h5 className="mb-0 fw-bold">
                <i className="fas fa-list me-2"></i>
                Lista de Compras ({comprasFiltradas.length})
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="text-center">
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
                      <th className="fw-bold">
                        <i className="fas fa-hashtag me-1 text-primary"></i>
                        ID
                      </th>
                      <th className="fw-bold">
                        <i className="fas fa-calendar me-1 text-primary"></i>
                        Data
                      </th>
                      <th className="fw-bold">
                        <i className="fas fa-user me-1 text-primary"></i>
                        Cliente
                      </th>
                      <th className="fw-bold">
                        <i className="fas fa-dollar-sign me-1 text-primary"></i>
                        Total
                      </th>
                      <th className="fw-bold">
                        <i className="fas fa-info-circle me-1 text-primary"></i>
                        Status
                      </th>
                      <th className="fw-bold text-center">
                        <i className="fas fa-cogs me-1 text-primary"></i>
                        Ações
                      </th>
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
                          <td className="fw-bold text-primary">#{compra.id}</td>
                          <td>
                            {compra.data_compra
                              ? format(new Date(compra.data_compra), "dd/MM/yyyy HH:mm")
                              : "-"}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" 
                                  style={{ width: "35px", height: "35px" }}>
                                <i className="fas fa-user"></i>
                              </div>
                              <div>
                                <div className="fw-bold">{compra.cliente?.nome || "-"}</div>
                                <small className="text-muted">{compra.cliente?.email || ""}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="fw-bold text-success">
                              R$ {compra.valor_total?.toFixed(2).replace(".", ",")}
                            </div>
                            {compra.frete?.valor && compra.status_compra === "Pago" && (
                              <small className="badge bg-info text-dark mt-1">
                                Frete: R$ {compra.frete.valor.toFixed(2).replace(".", ",")}
                              </small>
                            )}
                          </td>
                          <td>
                            <span className={statusToClass[compra.status_compra] || "badge bg-secondary"}>
                              {compra.status_compra}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleExpand(compra.id)}
                                title={expanded[compra.id] ? "Recolher detalhes" : "Expandir detalhes"}
                                style={{ borderRadius: "10px 0 0 10px" }}
                              >
                                <i className={`fas ${expanded[compra.id] ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                              </button>
                              <button
                                className="btn btn-outline-info btn-sm"
                                onClick={() => navigate(`/compras/detalhe/${compra.id}`)}
                                title="Ver detalhes completos"
                                style={{ borderRadius: "0 10px 10px 0" }}
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expanded[compra.id] && (
                          <tr>
                            <td colSpan={7}>
                              <div className="p-4 m-3 border rounded-3 shadow-sm" style={{ 
                                background: "linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)",
                                borderRadius: "20px"
                              }}>
                                <div className="row">
                                  <div className="col-md-6">
                                    <h6 className="fw-bold text-primary mb-3">
                                      <i className="fas fa-shopping-bag me-2"></i>
                                      Detalhes da Compra #{compra.id}
                                    </h6>
                                    
                                    <div className="mb-3">
                                      <strong className="text-dark">
                                        <i className="fas fa-user me-2 text-primary"></i>
                                        Cliente:
                                      </strong> {compra.cliente?.nome} ({compra.cliente?.email})
                                    </div>

                                    <div className="mb-3">
                                      <strong className="text-dark">
                                        <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                                        Endereço de Entrega:
                                      </strong>
                                      <br />
                                      <span className="text-muted">
                                        {compra.endereco_entrega?.logradouro}, {compra.endereco_entrega?.numero}
                                        {compra.endereco_entrega?.complemento && `, ${compra.endereco_entrega.complemento}`}
                                        <br />
                                        {compra.endereco_entrega?.bairro}, {compra.endereco_entrega?.cidade} - {compra.endereco_entrega?.estado}
                                        <br />
                                        CEP: {compra.endereco_entrega?.cep}
                                      </span>
                                    </div>

                                    <div className="mb-3">
                                      <strong className="text-dark">
                                        <i className="fas fa-box me-2 text-primary"></i>
                                        Itens:
                                      </strong>
                                      <div className="mt-2">
                                        {compra.itens?.map((item, idx) => (
                                          <div key={idx} className="badge bg-light text-dark me-2 mb-2 p-2" style={{ borderRadius: "15px" }}>
                                            {item.quantidade}x {item.produto?.nome} 
                                            <span className="text-success fw-bold ms-2">
                                              (R$ {item.subtotal_item?.toFixed(2).replace(".", ",")})
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="col-md-6">
                                    {compra.frete && (
                                      <div className="mb-3">
                                        <h6 className="fw-bold text-success mb-3">
                                          <i className="fas fa-truck me-2"></i>
                                          Informações do Frete
                                        </h6>
                                        <div className="card border-success" style={{ borderRadius: "15px" }}>
                                          <div className="card-body">
                                            <p className="mb-2">
                                              <strong>Transportadora:</strong> {compra.frete.transportadora} ({compra.frete.servico_frete})
                                            </p>
                                            <p className="mb-2">
                                              <strong>Valor:</strong> 
                                              <span className="fw-bold text-success ms-2">
                                                R$ {compra.frete.valor.toFixed(2).replace(".", ",")}
                                              </span>
                                            </p>
                                            <p className="mb-0">
                                              <strong>Prazo:</strong> {compra.frete.prazo_frete_dias} dias úteis
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {compra.codigo_rastreio && (
                                      <div className="mb-3">
                                        <h6 className="fw-bold text-info mb-3">
                                          <i className="fas fa-search me-2"></i>
                                          Rastreamento
                                        </h6>
                                        <div className="card border-info" style={{ borderRadius: "15px" }}>
                                          <div className="card-body">
                                            <div className="d-flex flex-wrap gap-2">
                                              <a 
                                                href={compra.codigo_rastreio} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="btn btn-outline-info btn-sm fw-bold"
                                                style={{ borderRadius: "20px" }}
                                              >
                                                <i className="fas fa-external-link-alt me-1"></i>
                                                Ver Rastreio
                                              </a>
                                              <button
                                                className="btn btn-outline-primary btn-sm fw-bold"
                                                style={{ borderRadius: "20px" }}
                                                onClick={() => {
                                                  const texto = `Passando para avisar que em breve, seu pedido estará chegando até você. 🚚✨

  📍 Você pode acompanhar a entrega aqui: ${compra.codigo_rastreio}

  Qualquer dúvida, estou à disposição! Obrigada por escolher a Pink Bella. 💕`;
                                                  navigator.clipboard.writeText(texto);
                                                  alert("Mensagem copiada para a área de transferência!");
                                                }}
                                              >
                                                <i className="fas fa-copy me-1"></i>
                                                Copiar Mensagem
                                              </button>
                                              <button
                                                className="btn btn-outline-success btn-sm fw-bold"
                                                style={{ borderRadius: "20px" }}
                                                onClick={() => {
      const numero = compra.cliente.telefone.replace(/\D/g, ''); // Remove tudo que não for número
      

      const texto = `Olá ${compra.cliente.nome}, tudo bem? 💖

  Passando para avisar que em breve, seu pedido estará chegando até você. 🚚✨

  📍 Você pode acompanhar a entrega aqui: ${compra.codigo_rastreio}

  Qualquer dúvida, estou à disposição! Obrigada por escolher a Pink Bella. 💕`;

      const url = `https://web.whatsapp.com/send?phone=55${numero}&text=${encodeURIComponent(texto)}`;
      window.open(url, "_blank");
    }}
                                              >
                                                <i className="fab fa-whatsapp me-1"></i>
                                                Enviar WhatsApp
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Ações por Status */}
                                    <div className="d-flex flex-wrap gap-2 mt-3">
                                      {compra.status_compra === "Pendente" && (
                                        <button
                                          className="btn btn-success fw-bold"
                                          style={{ borderRadius: "20px" }}
                                          onClick={() => handleMarcarComoPago(compra.id)}
                                        >
                                          <i className="fas fa-check me-2"></i>
                                          Marcar como Pago
                                        </button>
                                      )}

                                      {!compra.codigo_etiqueta && (
    <button
      className="px-3 py-1 text-sm btn btn-outline-secondary rounded"
        onClick={() => navigate(`/Compras/editar/${compra.id}`)}
    >
      Editar
    </button>
  )}
                                      
                                      {compra.status_compra === "Aguardando Etiqueta" && (
                                        <button
                                          className="btn btn-primary fw-bold"
                                          style={{ borderRadius: "20px" }}
                                          onClick={() => handleGerarEtiquetaIndividual(compra)}
                                        >
                                          <i className="fas fa-tag me-2"></i>
                                          Gerar Etiqueta
                                        </button>
                                      )}
                                      
                                      {compra.status_compra === "Etiqueta PDF Gerada" && (
                                        <button
                                          className="btn btn-info fw-bold"
                                          style={{ borderRadius: "20px" }}
                                          onClick={() => handleGerarLinkImpressao(compra.id)}
                                        >
                                          <i className="fas fa-print me-2"></i>
                                          Imprimir Etiqueta
                                        </button>
                                      )}
                                      
                                      {["Pendente", "Pago", "Aguardando Etiqueta"].includes(compra.status_compra) && (
                                        <button
                                          className="btn btn-outline-danger fw-bold"
                                          style={{ borderRadius: "20px" }}
                                          onClick={() => handleCancelarCompra(compra.id)}
                                        >
                                          <i className="fas fa-times me-2"></i>
                                          Cancelar
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
            </div>
          </div>
        </div>

        {/* Modal de Impressão */}
        {showPrintModal && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content" style={{ borderRadius: "20px" }}>
                <div className="modal-header text-white" style={{ 
                  background: "linear-gradient(135deg, #FF1493 0%, #FF69B4 100%)",
                  borderRadius: "20px 20px 0 0"
                }}>
                  <h5 className="modal-title fw-bold">
                    <i className="fas fa-print me-2"></i>
                    Impressão de Etiquetas
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => setShowPrintModal(false)}
                  ></button>
                </div>
                <div className="modal-body text-center p-4">
                  <div className="mb-3">
                    <i className="fas fa-file-pdf fa-3x text-danger mb-3"></i>
                    <p className="lead">Suas etiquetas estão prontas para impressão!</p>
                  </div>
                  <a 
                    href={printUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-lg fw-bold text-white shadow-lg"
                    style={{ 
                      background: "linear-gradient(135deg, #FF1493 0%, #FF69B4 100%)",
                      borderRadius: "25px",
                      border: "none"
                    }}
                  >
                    <i className="fas fa-download me-2"></i>
                    Baixar PDF das Etiquetas
                  </a>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary fw-bold" 
                    style={{ borderRadius: "20px" }}
                    onClick={() => setShowPrintModal(false)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Pinkbella */}
        <footer className="mt-5 py-4 text-center">
          <div className="card shadow-sm border-0" style={{ 
            background: "linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 100%)",
            borderRadius: "20px"
          }}>
            <div className="card-body">
              <p className="text-dark mb-0 fw-bold">
                <i className="fas fa-heart me-2 text-danger"></i>
                Pink Bella - Gestão de Compras com Amor e Profissionalismo
                <i className="fas fa-heart ms-2 text-danger"></i>
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  export default Compras;

