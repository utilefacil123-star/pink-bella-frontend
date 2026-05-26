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
  const [filterPeriod, setFilterPeriod] = useState("month");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  // Atualiza o relógio e animação uma vez
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Funções utilitárias
  const formatTime = (date) =>
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const formatDate = (date) =>
    date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
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
        faturamento: p.valor_total,
        vendas: 1,
      })),
    [filteredCompras]
  );

  // Highcharts
  const vendasOptions = useMemo(
    () => ({
      chart: { type: "line", backgroundColor: "transparent" },
      title: { text: "Vendas por Período" },
      xAxis: { categories: chartData.map((c) => c.date) },
      yAxis: { title: { text: "Valor Total (R$)" } },
      series: [{ name: "Valor Total", data: chartData.map((c) => c.faturamento) }],
    }),
    [chartData]
  );

  const statusOptions = useMemo(
    () => ({
      chart: { type: "pie", backgroundColor: "transparent" },
      title: { text: "Status das Compras" },
      series: [
        {
          name: "Quantidade",
          colorByPoint: true,
          data: ["Pendente", "Entregue", "Em Envio", "Postado", "Cancelado"].map((status) => ({
            name: status,
            y: filteredCompras.filter((c) => c.status_compra === status).length,
          })),
        },
      ],
    }),
    [filteredCompras]
  );

  const mapOptions = useMemo(
    () => ({
      chart: { map: brazilMapData, backgroundColor: "transparent" },
      title: { text: "Vendas por Estado" },
      series: [
        {
          mapData: brazilMapData,
          joinBy: ["id", "sigla"],
          name: "Vendas",
          data: [],
          states: { hover: { color: "#BADA55" } },
          dataLabels: { enabled: true, format: "{point.name}" },
        },
      ],
    }),
    []
  );

  // Indicadores
  const faturamentoTotal = filteredCompras.reduce((acc, compra) => acc + compra.valor_total, 0);
  const totalVendas = filteredCompras.length;
  const novosClientes = [...new Set(filteredCompras.map((c) => c.cliente?.id))].length;
  const produtosEstoque = 956;

  const analyticsData = [
    {
      icon: "fas fa-money-bill-wave",
      title: "Faturamento Total",
      value: formatCurrency(faturamentoTotal),
      color: "#2ecc71",
    },
    {
      icon: "fas fa-shopping-bag",
      title: "Total de Vendas",
      value: totalVendas,
      color: currentTheme.primaryColor,
    },
    {
      icon: "fas fa-users",
      title: "Novos Clientes",
      value: novosClientes,
      color: "#3498db",
    },
    {
      icon: "fas fa-box-open",
      title: "Produtos em Estoque",
      value: produtosEstoque,
      color: "#f1c40f",
    },
  ];

  const latestPurchases = comprasT.slice(0, 5);

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "Pendente":
        return { backgroundColor: "#ff9800", color: "white" };
      case "Entregue":
        return { backgroundColor: "#2ecc71", color: "white" };
      case "Em Envio":
      case "Postado":
        return { backgroundColor: "#3498db", color: "white" };
      case "Cancelado":
        return { backgroundColor: "#e74c3c", color: "white" };
      default:
        return { backgroundColor: "gray", color: "white" };
    }
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

  const cardBaseStyle = {
    borderRadius: "15px",
    background: "var(--surface-color)",
    color: "var(--text-color)",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
    transition: "all 0.4s ease",
    cursor: "pointer",
  };

  return (
    <div className="container-fluid py-4">
      {/* FILTROS */}
      <div className="d-flex gap-2 justify-content-end mb-4">
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
        <select
          className="form-select"
          style={{ maxWidth: "150px" }}
          onChange={(e) => setFilterPeriod(e.target.value)}
        >
          <option value="day">Dia</option>
          <option value="week">Semana</option>
          <option value="month">Mês</option>
          <option value="year">Ano</option>
          <option value="range">Intervalo</option>
        </select>
      </div>


      {/* INDICADORES */}
      <div className="row g-4 mb-5">
        {analyticsData.map((card, index) => (
          <div key={index} className="col-lg-3 col-md-6">
            <div
              className="card h-100 border-0 shadow-lg"
              style={{
                ...cardBaseStyle,
                borderLeft: `5px solid ${card.color}`,
              }}
            >
              <div className="card-body p-4 d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-uppercase fw-semibold mb-1" style={{ fontSize: "0.9rem", color: card.color }}>
                    {card.title}
                  </p>
                  <h3 className="fw-bold mb-0">{card.value}</h3>
                </div>
                <i className={`${card.icon} fa-3x`} style={{ color: card.color, opacity: 0.8 }}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

       {/* Relatório de Ações e Hora Atual */}
            <div className="row g-4 mb-5">
                
                {/* 1. Tabela de Últimas Compras (Dinâmico) */}
                <div className="col-lg-8">
                    <div 
                        className="card h-100 border-0 shadow-lg"
                        style={cardBaseStyle}
                    >
                        <div 
                            className="card-header border-0" 
                            style={{ 
                                // Cor Primária no cabeçalho
                                background: 'var(--primary-color)', 
                                color: 'white', 
                                borderTopLeftRadius: '15px', 
                                borderTopRightRadius: '15px' 
                            }}>
                            <h5 className="mb-0 fw-bold">
                                <i className="fas fa-list-alt me-2"></i> Últimas Compras
                            </h5>
                        </div>
                        <div className="card-body p-4">
                            {/* A tabela agora é populada dinamicamente usando latestPurchases (que é um slice de comprasT) */}
                            <table className="table table-hover" style={{ '--bs-table-bg': 'var(--surface-color)', '--bs-table-color': 'var(--text-color)', border: `1px solid var(--border-color)` }}>
                                <thead>
                                    <tr>
                                        <th style={{ color: 'var(--primary-color)' }}>Cliente</th>
                                        <th style={{ color: 'var(--primary-color)' }}>Data</th>
                                        <th className="text-end" style={{ color: 'var(--primary-color)' }}>Valor Total</th>
                                        <th style={{ color: 'var(--primary-color)' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {latestPurchases.map((purchase) => (
                                        <tr key={purchase.id}>
                                            {/* Usando purchase.cliente.nome */}
                                            <td className="fw-semibold">{purchase.cliente.nome}</td>
                                            {/* Usando purchase.data_compra */}
                                            <td className="text-muted"><i className="far fa-calendar-alt me-1"></i> {formatPurchaseDate(purchase.data_compra)}</td>
                                            {/* Usando purchase.valor_total com formatação de moeda */}
                                            <td className="fw-bold text-end">{formatCurrency(purchase.valor_total)}</td>
                                            {/* Usando purchase.status_compra */}
                                            <td>
                                                <span 
                                                    className="badge rounded-pill fw-bold py-2 px-3" 
                                                    style={getStatusBadgeStyle(purchase.status_compra)}
                                                >
                                                    {purchase.status_compra}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <Link 
                                to="/compras" 
                                className="btn btn-sm mt-3 fw-bold" 
                                style={{ 
                                    // Cor Secundária para o botão
                                    backgroundColor: 'var(--secondary-color)', 
                                    color: 'var(--surface-color)',
                                    borderRadius: '10px'
                                }}>
                                Ver todas as Vendas <i className="fas fa-arrow-right ms-2"></i>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 2. Relógio e Ações Rápidas */}
                <div className="col-lg-4">
                    <div 
                        className="card h-100 border-0 shadow-lg"
                        style={cardBaseStyle}
                    >
                        <div className="card-body text-center p-4">
                            
                            {/* Relógio e Data */}
                            <div className="p-3 mb-4" style={{ backgroundColor: 'var(--background-color-subtle)', borderRadius: '10px' }}>
                                <i className="fas fa-clock fa-3x mb-3" style={{ color: 'var(--primary-color)' }}></i>
                                <h2 className="display-4 fw-bold" style={{ color: 'var(--text-color)' }}>{formatTime(currentTime)}</h2>
                                <p className="lead" style={{ color: 'var(--secondary-color)' }}>{formatDate(currentTime)}</p>
                            </div>
                            
                            {/* Ações Rápidas - Simplificado */}
                            <h5 className="fw-bold mb-3" style={{ color: 'var(--text-color)' }}>
                                Ações Rápidas
                            </h5>
                            <div className="d-grid gap-2">
                                {/* Botão Principal (Nova Venda) usando Cor Primária */}
                                <Link to="/compras" className="btn btn-lg fw-bold" style={{ backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '10px' }}>
                                    <i className="fas fa-plus-circle me-2"></i> Nova Venda
                                </Link>
                                
                                {/* Botão Secundário (Novo Cliente) usando Cor Secundária */}
                                <Link to="/clientes/novo" className="btn btn-lg fw-bold" style={{ backgroundColor: 'var(--secondary-color)', color: 'var(--surface-color)', borderRadius: '10px' }}>
                                    <i className="fas fa-user-plus me-2"></i> Novo Cliente
                                </Link>
                                
                                {/* Botão de Contorno */}
                                <Link 
                                    to="/frete" 
                                    className="btn btn-lg fw-bold btn-outline-light" 
                                    style={{ 
                                        borderColor: 'var(--primary-color)', 
                                        color: 'var(--primary-color)',
                                        borderRadius: '10px'
                                    }}>
                                    <i className="fas fa-truck me-2"></i> Calcular Frete
                                </Link>
                            </div>
                        </div>
                        </div>
                        </div>
                        </div>

      {/* GRÁFICOS HIGHCHARTS */}
      <div className="row g-4 mb-5">
        <div className="col-lg-6">
          <HighchartsReact highcharts={Highcharts} options={vendasOptions} />
        </div>
        <div className="col-lg-6">
          <HighchartsReact highcharts={Highcharts} options={statusOptions} />
        </div>
      </div>

      {/* MAPA */}
      <div className="row g-4 mb-5">
        <div className="col-12">
          <HighchartsReact highcharts={Highcharts} constructorType={"mapChart"} options={mapOptions} />
        </div>
      </div>
    </div>
  );
}

export default Home;
