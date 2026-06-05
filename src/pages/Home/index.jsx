// src/pages/Home/index.jsx
import React, { useState, useEffect, useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { CompraContext } from "../Compras/CompraContext";

// --- Gráficos com Highcharts ---
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import mapInit from "highcharts/modules/map";
import proj4 from "proj4";
import brazilMapData from "../../assets/brazil-topo.json";

// Inicializa o módulo de mapa
if (typeof mapInit === "function") {
  mapInit(Highcharts);
}
if (typeof window !== "undefined") {
  window.proj4 = window.proj4 || proj4;
}

function Home() {
  const { currentTheme } = useTheme();
  const { comprasT = [] } = useContext(CompraContext);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [filterPeriod, setFilterPeriod] = useState("year");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  // Atualiza o relógio
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Funções utilitárias
  const formatTime = (date) =>
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formatDate = (date) =>
    date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  // Compras filtradas
  const filteredCompras = useMemo(() => {
    const now = new Date();
    return comprasT.filter((c) => {
      const compraDate = new Date(c.data_compra);
      if (filterPeriod === "day") return compraDate.toDateString() === now.toDateString();
      if (filterPeriod === "week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        return compraDate >= startOfWeek && compraDate <= now;
      }
      if (filterPeriod === "month")
        return compraDate.getMonth() === now.getMonth() && compraDate.getFullYear() === now.getFullYear();
      if (filterPeriod === "year") return compraDate.getFullYear() === now.getFullYear();
      if (filterPeriod === "all") return true;
      if (filterPeriod === "range" && customRange.start && customRange.end) {
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        return compraDate >= start && compraDate <= end;
      }
      return true;
    });
  }, [comprasT, filterPeriod, customRange]);

  // Dados do gráfico principal
  const chartData = useMemo(
    () =>
      filteredCompras.map((p) => ({
        date: new Date(p.data_compra).toLocaleDateString("pt-BR"),
        faturamento: parseFloat(p.valor_total) || 0,
        vendas: 1,
      })),
    [filteredCompras]
  );

  const primaryColor = currentTheme?.['--primary-color'] || '#d81b60';
  const surfaceColor = currentTheme?.['--surface-color'] || '#1e2022';
  const textColor    = currentTheme?.['--text-color']    || '#f3f4f6';
  const textMuted    = currentTheme?.['--text-muted']    || '#9ca3af';

  // Highcharts — tema escuro integrado
  const chartThemeBase = {
    chart: {
      backgroundColor: "transparent",
      style: { fontFamily: "'Outfit', 'Inter', sans-serif" },
    },
    title: { style: { color: textColor, fontWeight: "700" } },
    xAxis: {
      labels: { style: { color: textMuted } },
      lineColor: "rgba(255,255,255,0.1)",
      gridLineColor: "rgba(255,255,255,0.04)",
    },
    yAxis: {
      labels: { style: { color: textMuted } },
      title: { style: { color: textMuted } },
      gridLineColor: "rgba(255,255,255,0.06)",
    },
    legend: { itemStyle: { color: textMuted } },
    tooltip: {
      backgroundColor: surfaceColor,
      borderColor: "rgba(255,255,255,0.1)",
      style: { color: textColor },
    },
    credits: { enabled: false },
  };

  const vendasOptions = useMemo(
    () => ({
      ...chartThemeBase,
      chart: { ...chartThemeBase.chart, type: "area" },
      title: { ...chartThemeBase.title, text: "Faturamento por Período" },
      xAxis: { ...chartThemeBase.xAxis, categories: chartData.map((c) => c.date) },
      yAxis: { ...chartThemeBase.yAxis, title: { text: "Valor (R$)" } },
      plotOptions: {
        area: {
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, `${primaryColor}50`],
              [1, `${primaryColor}05`],
            ],
          },
          marker: { radius: 4, fillColor: primaryColor },
          lineWidth: 2,
          lineColor: primaryColor,
        },
      },
      series: [{ name: "Faturamento (R$)", data: chartData.map((c) => c.faturamento), color: primaryColor }],
    }),
    [chartData, primaryColor] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const statusOptions = useMemo(
    () => ({
      ...chartThemeBase,
      chart: { ...chartThemeBase.chart, type: "pie" },
      title: { ...chartThemeBase.title, text: "Status das Compras" },
      plotOptions: {
        pie: {
          dataLabels: { enabled: true, style: { color: "#f3f4f6", fontWeight: "600" } },
          borderWidth: 0,
          slicedOffset: 6,
        },
      },
      series: [
        {
          name: "Quantidade",
          colorByPoint: true,
          data: [
            { name: "Pendente",  y: filteredCompras.filter((c) => c.status_compra === "Pendente").length,  color: "#f59e0b" },
            { name: "Pago",      y: filteredCompras.filter((c) => c.status_compra === "Pago").length,      color: "#10b981" },
            { name: "Postado",   y: filteredCompras.filter((c) => c.status_compra === "Postado").length,   color: "#3b82f6" },
            { name: "Entregue",  y: filteredCompras.filter((c) => c.status_compra === "Entregue").length,  color: "#6366f1" },
            { name: "Cancelado", y: filteredCompras.filter((c) => c.status_compra === "Cancelado").length, color: "#ef4444" },
          ].filter((d) => d.y > 0),
        },
      ],
    }),
    [filteredCompras] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const ESTADOS_NOMES = {
    AC:"Acre",AL:"Alagoas",AP:"Amapá",AM:"Amazonas",BA:"Bahia",CE:"Ceará",
    DF:"Distrito Federal",ES:"Espírito Santo",GO:"Goiás",MA:"Maranhão",
    MT:"Mato Grosso",MS:"Mato Grosso do Sul",MG:"Minas Gerais",PA:"Pará",
    PB:"Paraíba",PR:"Paraná",PE:"Pernambuco",PI:"Piauí",RJ:"Rio de Janeiro",
    RN:"Rio Grande do Norte",RS:"Rio Grande do Sul",RO:"Rondônia",RR:"Roraima",
    SC:"Santa Catarina",SP:"São Paulo",SE:"Sergipe",TO:"Tocantins",
  };

  const vendasPorEstado = useMemo(() => {
    const contagem = {};
    filteredCompras.forEach((c) => {
      const estado = c.endereco_entrega?.estado;
      if (estado) contagem[estado] = (contagem[estado] || 0) + 1;
    });
    return Object.entries(contagem).map(([id, value]) => ({ id, value }));
  }, [filteredCompras]);

  const tabelaEstados = useMemo(() =>
    [...vendasPorEstado]
      .sort((a, b) => b.value - a.value)
      .map(({ id, value }) => ({ sigla: id, nome: ESTADOS_NOMES[id] || id, value })),
  [vendasPorEstado]); // eslint-disable-line react-hooks/exhaustive-deps

  const mapOptions = useMemo(
    () => ({
      chart: { map: brazilMapData, backgroundColor: "transparent" },
      title: { text: "Vendas por Estado", style: { color: textColor, fontWeight: "700" } },
      credits: { enabled: false },
      colorAxis: {
        min: 0,
        stops: [
          [0, "#f8e4ef"],
          [0.5, `${primaryColor}80`],
          [1, primaryColor],
        ],
      },
      tooltip: {
        backgroundColor: surfaceColor,
        borderColor: "rgba(255,255,255,0.1)",
        style: { color: textColor },
        formatter: function () {
          return `<b>${this.point.properties?.nome || this.key}</b><br/>Vendas: ${this.point.value || 0}`;
        },
      },
      series: [
        {
          mapData: brazilMapData,
          joinBy: "id",
          name: "Vendas",
          data: vendasPorEstado,
          states: { hover: { color: primaryColor } },
          dataLabels: {
            enabled: true,
            format: "{point.value}",
            style: { color: "#fff", fontSize: "10px", fontWeight: "700", textOutline: "1px #00000080" },
          },
        },
      ],
    }),
    [vendasPorEstado, primaryColor, textColor, surfaceColor] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Indicadores
  const faturamentoTotal = filteredCompras.reduce((acc, compra) => acc + (parseFloat(compra.valor_total) || 0), 0);
  const totalVendas = filteredCompras.length;
  const novosClientes = [...new Set(filteredCompras.map((c) => c.cliente?.id))].length;
  const comprasPendentes = filteredCompras.filter((c) => c.status_compra === "Pendente").length;

  const analyticsData = [
    {
      icon: "fas fa-dollar-sign",
      title: "Faturamento",
      value: formatCurrency(faturamentoTotal),
      color: "var(--status-success)",
      borderColor: "rgba(16,185,129,0.4)",
      bgColor: "rgba(16,185,129,0.06)",
    },
    {
      icon: "fas fa-shopping-bag",
      title: "Vendas",
      value: totalVendas,
      color: "var(--primary-color)",
      borderColor: "rgba(216,27,96,0.4)",
      bgColor: "rgba(216,27,96,0.06)",
    },
    {
      icon: "fas fa-users",
      title: "Clientes Únicos",
      value: novosClientes,
      color: "var(--status-info)",
      borderColor: "rgba(59,130,246,0.4)",
      bgColor: "rgba(59,130,246,0.06)",
    },
    {
      icon: "fas fa-clock",
      title: "Pendentes",
      value: comprasPendentes,
      color: "var(--status-warning)",
      borderColor: "rgba(245,158,11,0.4)",
      bgColor: "rgba(245,158,11,0.06)",
    },
  ];

  const latestPurchases = comprasT.slice(0, 5);

  const statusToClass = {
    "Pendente":  "badge-status pendente",
    "Pago":      "badge-status pago",
    "Postado":   "badge-status postado",
    "Entregue":  "badge-status pago",
    "Cancelado": "badge-status cancelado",
    "Aguardando Etiqueta": "badge-status aguardando",
    "Etiqueta PDF Gerada": "badge-status envio",
    "Finalizado": "badge-status pago",
  };

  const formatPurchaseDate = (dateTimeString) => {
    const datePart = dateTimeString.split(" ")[0];
    const today = new Date().toISOString().split("T")[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split("T")[0];
    if (datePart === today) return "Hoje";
    if (datePart === yesterday) return "Ontem";
    return new Date(datePart + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const periodLabels = {
    day: "Hoje",
    week: "Esta Semana",
    month: "Este Mês",
    year: "Este Ano",
    all: "Todo Período",
    range: "Período personalizado",
  };

  return (
    <div className="container-fluid py-3">

      {/* Header com Filtros */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ color: "var(--text-color)", fontSize: "1.6rem" }}>
            <i className="fas fa-chart-line me-2" style={{ color: "var(--primary-color)" }} />
            Dashboard
          </h1>
          <p className="text-muted small mb-0">
            Visão geral —{" "}
            <span style={{ color: "var(--primary-color)", fontWeight: "600" }}>
              {periodLabels[filterPeriod] || "Período"}
            </span>
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2 align-items-center">
          {filterPeriod === "range" && (
            <>
              <input
                type="date"
                className="form-control"
                style={{ maxWidth: "150px" }}
                onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
              />
              <input
                type="date"
                className="form-control"
                style={{ maxWidth: "150px" }}
                onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
              />
            </>
          )}
          <select
            className="form-select"
            style={{ maxWidth: "155px" }}
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
          >
            <option value="day">Hoje</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
            <option value="year">Este Ano</option>
            <option value="all">Todo Período</option>
            <option value="range">Período personalizado</option>
          </select>
        </div>
      </div>

      {/* Cards de Indicadores */}
      <div className="row g-3 mb-4">
        {analyticsData.map((card, index) => (
          <div key={index} className="col-lg-3 col-md-6 col-sm-6">
            <div
              className="card-premium h-100"
              style={{
                borderLeft: `4px solid ${card.color}`,
                backgroundColor: card.bgColor,
              }}
            >
              <div className="card-body p-4 d-flex align-items-center justify-content-between">
                <div>
                  <p
                    className="text-uppercase fw-bold mb-1"
                    style={{ fontSize: "0.72rem", color: card.color, letterSpacing: "0.06em" }}
                  >
                    {card.title}
                  </p>
                  <h3 className="fw-bold mb-0" style={{ color: "var(--text-color)" }}>
                    {card.value}
                  </h3>
                </div>
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    backgroundColor: `${card.color}20`,
                    border: `1px solid ${card.borderColor}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i className={card.icon} style={{ color: card.color, fontSize: "1.3rem" }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Últimas Compras + Relógio e Ações */}
      <div className="row g-4 mb-4">

        {/* Tabela de Últimas Compras */}
        <div className="col-lg-8">
          <div className="card-premium h-100">
            <div
              className="px-4 py-3 d-flex align-items-center justify-content-between"
              style={{ borderBottom: "1px solid var(--border-color)" }}
            >
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="fas fa-list-alt" style={{ color: "var(--primary-color)" }} />
                Últimas Compras
              </h5>
              <Link
                to="/compras"
                className="fw-semibold text-decoration-none"
                style={{ color: "var(--primary-color)", fontSize: "0.85rem" }}
              >
                Ver todas <i className="fas fa-arrow-right ms-1" />
              </Link>
            </div>
            <div className="card-body p-0">
              {latestPurchases.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-shopping-bag fa-3x text-muted mb-3" style={{ opacity: 0.3 }} />
                  <p className="text-muted small">Nenhuma compra registrada ainda.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-premium table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Data</th>
                        <th className="text-end">Valor</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestPurchases.map((purchase) => (
                        <tr key={purchase.id}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="d-flex align-items-center justify-content-center text-white rounded-circle"
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  backgroundColor: "var(--primary-color)",
                                  fontSize: "0.8rem",
                                  fontWeight: "bold",
                                  flexShrink: 0,
                                }}
                              >
                                {purchase.cliente?.nome?.charAt(0).toUpperCase() || "?"}
                              </div>
                              <span className="fw-semibold">{purchase.cliente?.nome || "-"}</span>
                            </div>
                          </td>
                          <td className="text-muted">
                            <i className="far fa-calendar-alt me-1" />
                            {formatPurchaseDate(purchase.data_compra)}
                          </td>
                          <td className="fw-bold text-end" style={{ color: "var(--status-success)" }}>
                            {formatCurrency(purchase.valor_total)}
                          </td>
                          <td>
                            <span className={statusToClass[purchase.status_compra] || "badge-status"}>
                              {purchase.status_compra}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Relógio + Ações Rápidas */}
        <div className="col-lg-4">
          <div className="card-premium h-100">
            <div className="card-body p-4 d-flex flex-column">

              {/* Relógio */}
              <div
                className="text-center p-4 mb-4 rounded"
                style={{
                  backgroundColor: "var(--background-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <i
                  className="fas fa-clock mb-2"
                  style={{ color: "var(--primary-color)", fontSize: "1.5rem", display: "block" }}
                />
                <div
                  className="fw-bold"
                  style={{
                    fontSize: "2.2rem",
                    fontVariantNumeric: "tabular-nums",
                    color: "var(--text-color)",
                    letterSpacing: "2px",
                    lineHeight: 1.2,
                  }}
                >
                  {formatTime(currentTime)}
                </div>
                <p className="text-muted small mt-2 mb-0" style={{ textTransform: "capitalize" }}>
                  {formatDate(currentTime)}
                </p>
              </div>

              {/* Ações Rápidas */}
              <h6 className="fw-bold mb-3" style={{ color: "var(--text-color)" }}>
                Ações Rápidas
              </h6>
              <div className="d-grid gap-2">
                <Link to="/clientes" className="btn-primary-brand text-center text-decoration-none py-2">
                  <i className="fas fa-plus-circle me-2" />
                  Nova Venda
                </Link>
                <Link to="/clientes/novo" className="btn-secondary-brand text-center text-decoration-none py-2">
                  <i className="fas fa-user-plus me-2" />
                  Novo Cliente
                </Link>
                <Link
                  to="/frete"
                  className="text-center text-decoration-none py-2 fw-semibold"
                  style={{
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-color)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                    padding: "10px",
                  }}
                >
                  <i className="fas fa-truck me-2" style={{ color: "var(--primary-color)" }} />
                  Calcular Frete
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos Highcharts */}
      <div className="row g-4 mb-4">
        <div className="col-lg-7">
          <div className="card-premium">
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="fas fa-chart-area" style={{ color: "var(--primary-color)" }} />
                Faturamento por Período
              </h5>
            </div>
            <div className="p-3">
              <HighchartsReact highcharts={Highcharts} options={vendasOptions} />
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="card-premium">
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="fas fa-chart-pie" style={{ color: "var(--primary-color)" }} />
                Status das Compras
              </h5>
            </div>
            <div className="p-3">
              <HighchartsReact highcharts={Highcharts} options={statusOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Mapa + Tabela */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="card-premium h-100">
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="fas fa-map-marked-alt" style={{ color: "var(--primary-color)" }} />
                Vendas por Estado
              </h5>
            </div>
            <div className="p-3">
              <HighchartsReact
                highcharts={Highcharts}
                constructorType={"mapChart"}
                options={mapOptions}
              />
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card-premium h-100">
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-color)" }}>
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="fas fa-list-ol" style={{ color: "var(--primary-color)" }} />
                Ranking por Estado
              </h5>
            </div>
            <div className="card-body p-0" style={{ overflowY: "auto", maxHeight: "420px" }}>
              {tabelaEstados.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted small">Nenhuma venda no período.</p>
                </div>
              ) : (
                <table className="table table-premium mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Estado</th>
                      <th className="text-center">Sigla</th>
                      <th className="text-end">Vendas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabelaEstados.map(({ sigla, nome, value }, i) => (
                      <tr key={sigla}>
                        <td className="text-muted small">{i + 1}</td>
                        <td className="fw-semibold">{nome}</td>
                        <td className="text-center">
                          <span className="badge-status" style={{ fontSize: "0.7rem" }}>{sigla}</span>
                        </td>
                        <td className="text-end fw-bold" style={{ color: "var(--primary-color)" }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
