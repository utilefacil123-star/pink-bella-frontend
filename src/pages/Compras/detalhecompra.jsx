import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { buscarCompraPorId } from '../../controllers/compraController';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { useToast } from '../../context/ToastContext';

// Funções utilitárias
const formatCurrency = (value) => {
  if (value === null || value === undefined) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatDate = (dateString) => {
  if (!dateString) return "Não informado";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR");
};

const formatCEP = (cep) => {
  if (!cep) return "Não informado";
  return cep.replace(/(\d{5})(\d{3})/, "$1-$2");
};

const formatPhoneNumber = (phone) => {
  if (!phone) return "Não informado";
  const cleaned = ("" + phone).replace(/\D/g, "");
  const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "postado":
      return "bg-warning text-dark";
    case "entregue":
      return "bg-success text-white";
    case "cancelado":
      return "bg-danger text-white";
    default:
      return "bg-secondary text-white";
  }
};

// Componente de Cards de Métricas
const MetricCards = ({ metrics }) => {
  return (
    <div className="row mb-4">
      <div className="col-md-3 mb-3">
        <div className="card shadow-sm h-100 border-primary">
          <div className="card-body text-center">
            <i className="fas fa-shopping-cart fa-2x text-primary mb-2"></i>
            <h6 className="card-subtitle mb-2 text-muted">Total de Compras</h6>
            <h4 className="card-title text-primary">{metrics.totalOrders}</h4>
          </div>
        </div>
      </div>
      <div className="col-md-3 mb-3">
        <div className="card shadow-sm h-100 border-success">
          <div className="card-body text-center">
            <i className="fas fa-dollar-sign fa-2x text-success mb-2"></i>
            <h6 className="card-subtitle mb-2 text-muted">Valor Total</h6>
            <h4 className="card-title text-success">{formatCurrency(metrics.totalValue)}</h4>
          </div>
        </div>
      </div>
      <div className="col-md-3 mb-3">
        <div className="card shadow-sm h-100 border-info">
          <div className="card-body text-center">
            <i className="fas fa-box fa-2x text-info mb-2"></i>
            <h6 className="card-subtitle mb-2 text-muted">Total de Itens</h6>
            <h4 className="card-title text-info">{metrics.totalItems}</h4>
          </div>
        </div>
      </div>
      <div className="col-md-3 mb-3">
        <div className="card shadow-sm h-100 border-warning">
          <div className="card-body text-center">
            <i className="fas fa-truck fa-2x text-warning mb-2"></i>
            <h6 className="card-subtitle mb-2 text-muted">Frete Médio</h6>
            <h4 className="card-title text-warning">{formatCurrency(metrics.avgShipping)}</h4>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Filtros
const FilterSection = ({ onFilterChange, onClearFilters, onExportData }) => {
  const [period, setPeriod] = useState('all');
  const [status, setStatus] = useState('all');
  const [carrier, setCarrier] = useState('all');

  const handleApplyFilters = () => {
    onFilterChange({ period, status, carrier });
  };

  const handleClearFilters = () => {
    setPeriod('all');
    setStatus('all');
    setCarrier('all');
    onClearFilters();
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light">
        <h5 className="card-title mb-0">
          <i className="fas fa-filter me-2"></i>
          Filtros de Análise
        </h5>
      </div>
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-3">
            <label htmlFor="filterPeriod" className="form-label">Período</label>
            <select
              id="filterPeriod"
              className="form-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="all">Todos os Períodos</option>
              <option value="last30">Últimos 30 dias</option>
              <option value="last90">Últimos 90 dias</option>
              <option value="lastYear">Último Ano</option>
            </select>
          </div>
          <div className="col-md-3">
            <label htmlFor="filterStatus" className="form-label">Status</label>
            <select
              id="filterStatus"
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">Todos os Status</option>
              <option value="Postado">Postado</option>
              <option value="Entregue">Entregue</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
          <div className="col-md-3">
            <label htmlFor="filterCarrier" className="form-label">Transportadora</label>
            <select
              id="filterCarrier"
              className="form-select"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
            >
              <option value="all">Todas</option>
              <option value="Loggi">Loggi</option>
              <option value="Correios">Correios</option>
              <option value="Jadlog">Jadlog</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Ações</label>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary" onClick={handleClearFilters}>
                <i className="fas fa-undo me-1"></i>
                Limpar
              </button>
              <button className="btn btn-primary" onClick={handleApplyFilters}>
                <i className="fas fa-filter me-1"></i>
                Filtrar
              </button>
              <button className="btn btn-success" onClick={onExportData}>
                <i className="fas fa-download me-1"></i>
                Exportar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Informações do Cliente
const ClientInfoCard = ({ client, address }) => {
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-primary text-white">
        <h5 className="card-title mb-0">
          <i className="fas fa-user me-2"></i>
          Informações do Cliente
        </h5>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <p><strong><i className="fas fa-user me-2"></i>Nome:</strong> {client?.nome || 'Não informado'}</p>
            <p><strong><i className="fas fa-phone me-2"></i>Telefone:</strong> {formatPhoneNumber(client?.telefone)}</p>
            <p><strong><i className="fas fa-envelope me-2"></i>Email:</strong> {client?.email || 'Não informado'}</p>
          </div>
          <div className="col-md-6">
            <h6 className="text-muted mb-2">
              <i className="fas fa-map-marker-alt me-2"></i>
              Endereço de Entrega
            </h6>
            <p><strong>CEP:</strong> {formatCEP(address?.cep)}</p>
            <p><strong>Endereço:</strong> {address?.logradouro}, {address?.numero}</p>
            <p><strong>Bairro:</strong> {address?.bairro}</p>
            {address?.complemento && (
              <p><strong>Complemento:</strong> {address?.complemento}</p>
            )}
            {address?.referencia && (
              <p><strong>Referência:</strong> {address?.referencia}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Detalhes da Compra Atual
const CurrentOrderDetails = ({ order, copiarRastreio }) => {
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-success text-white">
        <h5 className="card-title mb-0">
          <i className="fas fa-shopping-bag me-2"></i>
          Compra Atual #{order.id}
        </h5>
      </div>
      <div className="card-body">
        <div className="row mb-3">
          <div className="col-md-6">
            <p><strong><i className="fas fa-calendar me-2"></i>Data:</strong> {formatDate(order.data_compra)}</p>
            <p><strong><i className="fas fa-info-circle me-2"></i>Status:</strong> <span className={`badge ${getStatusColor(order.status_compra)}`}>{order.status_compra}</span></p>
            <p><strong><i className="fas fa-dollar-sign me-2"></i>Valor Total:</strong> {formatCurrency(order.valor_total)}</p>
          </div>
          <div className="col-md-6">
            {order.frete && (
              <>
                <h6 className="text-muted mb-2">
                  <i className="fas fa-truck me-2"></i>
                  Informações de Frete
                </h6>
                <p><strong>Transportadora:</strong> {order.frete.transportadora}</p>
                <p><strong>Serviço:</strong> {order.frete.servico}</p>
                <p><strong>Prazo:</strong> {order.frete.prazo_dias_uteis} dias úteis</p>
                <p><strong>Valor:</strong> {formatCurrency(order.frete.valor)}</p>
              </>
            )}
          </div>
        </div>

        {order.codigo_rastreio && (
          <div className="mb-3">
            <p>
              <strong><i className="fas fa-search me-2"></i>Rastreio:</strong>{' '}
              <a href={order.codigo_rastreio} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary me-2">
                <i className="fas fa-external-link-alt me-1"></i>
                Ver rastreio
              </a>
              <button className="btn btn-sm btn-outline-secondary" onClick={copiarRastreio}>
                <i className="fas fa-copy me-1"></i>
                Copiar
              </button>
            </p>
          </div>
        )}

        {order.url_melhor_envio && (
          <div className="mb-3">
            <p>
              <strong><i className="fas fa-print me-2"></i>Etiqueta:</strong>{' '}
              <a href={order.url_melhor_envio} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-info">
                <i className="fas fa-print me-1"></i>
                Imprimir etiqueta
              </a>
            </p>
          </div>
        )}

        <h6 className="mt-4 mb-3">
          <i className="fas fa-list me-2"></i>
          Itens da Compra
        </h6>
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Preço Unitário</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.itens.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.produto?.nome}</strong></td>
                  <td>{item.quantidade}</td>
                  <td>{formatCurrency(item.preco_unitario_na_compra)}</td>
                  <td><strong>{formatCurrency(item.subtotal_item)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Componente de Insights
const InsightsDisplay = ({ insights, behaviorData }) => {
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-info text-white">
        <h5 className="card-title mb-0">
          <i className="fas fa-lightbulb me-2"></i>
          Análise Comportamental e Insights
        </h5>
      </div>
      <div className="card-body">
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card bg-light h-100">
              <div className="card-body text-center">
                <i className="fas fa-chart-line fa-2x text-primary mb-2"></i>
                <h6 className="text-muted">Ticket Médio</h6>
                <h4 className="text-primary">{formatCurrency(behaviorData.averageOrderValue)}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-light h-100">
              <div className="card-body text-center">
                <i className="fas fa-boxes fa-2x text-success mb-2"></i>
                <h6 className="text-muted">Itens por Compra</h6>
                <h4 className="text-success">{Math.round(behaviorData.averageItemsPerOrder)}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-light h-100">
              <div className="card-body text-center">
                <i className="fas fa-clock fa-2x text-info mb-2"></i>
                <h6 className="text-muted">Dias entre Compras</h6>
                <h4 className="text-info">{Math.round(behaviorData.orderFrequency)}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card bg-light h-100">
              <div className="card-body text-center">
                <i className="fas fa-money-bill-wave fa-2x text-warning mb-2"></i>
                <h6 className="text-muted">Total Gasto</h6>
                <h4 className="text-warning">{formatCurrency(behaviorData.totalSpent)}</h4>
              </div>
            </div>
          </div>
        </div>

        <h6 className="mb-3">
          <i className="fas fa-brain me-2"></i>
          Insights Automáticos:
        </h6>
        {insights.length > 0 ? (
          <div className="row">
            {insights.map((insight, index) => (
              <div key={index} className="col-md-4 mb-3">
                <div className={`alert ${insight.type === 'success' ? 'alert-success' : 'alert-info'} mb-0`}>
                  <i className={`fas ${insight.type === 'success' ? 'fa-check-circle' : 'fa-info-circle'} me-2`}></i>
                  {insight.description}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-secondary mb-0">
            <i className="fas fa-exclamation-triangle me-2"></i>
            Nenhum insight disponível no momento.
          </div>
        )}
      </div>
    </div>
  );
};

// Componente de Gráficos
const ChartsDisplay = ({ comprasAnterioresChartData, itensCompradosChartData, statusComprasChartData, evolutionData }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6F61'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="mb-1"><strong>{label}</strong></p>
          <p className="mb-0 text-primary">Valor: {formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const ProductTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="mb-1"><strong>{label}</strong></p>
          <p className="mb-0 text-success">Quantidade: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="row mb-4">
      <div className="col-md-6 mb-4">
        <div className="card shadow-sm h-100">
          <div className="card-header bg-primary text-white">
            <h6 className="card-title mb-0">
              <i className="fas fa-chart-bar me-2"></i>
              Compras Anteriores (Valor Total)
            </h6>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comprasAnterioresChartData}>
                <XAxis dataKey="name" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#0d6efd" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="col-md-6 mb-4">
        <div className="card shadow-sm h-100">
          <div className="card-header bg-success text-white">
            <h6 className="card-title mb-0">
              <i className="fas fa-chart-bar me-2"></i>
              Itens Comprados (Total)
            </h6>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={itensCompradosChartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<ProductTooltip />} />
                <Bar dataKey="value" fill="#198754" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="col-md-6 mb-4">
        <div className="card shadow-sm h-100">
          <div className="card-header bg-warning text-dark">
            <h6 className="card-title mb-0">
              <i className="fas fa-chart-pie me-2"></i>
              Status das Compras
            </h6>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusComprasChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusComprasChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="col-md-6 mb-4">
        <div className="card shadow-sm h-100">
          <div className="card-header bg-info text-white">
            <h6 className="card-title mb-0">
              <i className="fas fa-chart-line me-2"></i>
              Evolução do Valor das Compras
            </h6>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="value" stroke="#0dcaf0" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de Histórico de Compras
const OrderHistoryTable = ({ orders, onSelectOrder }) => {
  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-secondary text-white">
        <h5 className="card-title mb-0">
          <i className="fas fa-history me-2"></i>
          Histórico de Compras
        </h5>
      </div>
      <div className="card-body">
        {orders.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th><i className="fas fa-hashtag me-1"></i>ID</th>
                  <th><i className="fas fa-calendar me-1"></i>Data</th>
                  <th><i className="fas fa-dollar-sign me-1"></i>Valor Total</th>
                  <th><i className="fas fa-info-circle me-1"></i>Status</th>
                  <th><i className="fas fa-box me-1"></i>Itens</th>
                  <th><i className="fas fa-cog me-1"></i>Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => onSelectOrder(order)}>
                    <td><strong>#{order.id}</strong></td>
                    <td>{formatDate(order.data_compra)}</td>
                    <td><strong>{formatCurrency(order.valor_total)}</strong></td>
                    <td><span className={`badge ${getStatusColor(order.status_compra)}`}>{order.status_compra}</span></td>
                    <td>{order.itens.length} item(s)</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary">
                        <i className="fas fa-eye me-1"></i>
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="alert alert-info mb-0">
            <i className="fas fa-info-circle me-2"></i>
            Nenhuma compra anterior encontrada.
          </div>
        )}
      </div>
    </div>
  );
};

// Componente Principal Refatorado
function DetalheCompra() {
  const { id } = useParams();
  const { toast } = useToast();
  const [compra, setCompra] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [filtroAtual, setFiltroAtual] = useState({
    period: 'all',
    status: 'all',
    carrier: 'all',
  });
  const [dadosFiltrados, setDadosFiltrados] = useState(null);

  const navigate = useNavigate();

  const copiarRastreio = () => {
    if (compra?.codigo_rastreio) {
      navigator.clipboard.writeText(compra.codigo_rastreio);
      toast.success('Link de rastreio copiado!');
    }
  };

  const exportarDados = () => {
    if (dadosFiltrados) {
      const dataToExport = {
        cliente: compra.cliente,
        endereco: compra.endereco,
        compraAtual: compra,
        metricas: dadosFiltrados.metrics,
        analiseComportamental: dadosFiltrados.behaviorData,
        insights: dadosFiltrados.insights,
        dataExportacao: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `analise_cliente_${compra.cliente.id}_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success('Dados exportados com sucesso!');
    }
  };

  const processarDados = useCallback((data) => {
    if (!data) return null;

    const allOrders = [data, ...(data.compras_anteriores || [])];

    // Aplicar filtros
    const filteredOrders = allOrders.filter(order => {
      const orderDate = new Date(order.data_compra);
      const now = new Date();

      if (filtroAtual.period === 'last30') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (orderDate < thirtyDaysAgo) return false;
      } else if (filtroAtual.period === 'last90') {
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        if (orderDate < ninetyDaysAgo) return false;
      } else if (filtroAtual.period === 'lastYear') {
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        if (orderDate < oneYearAgo) return false;
      }

      if (filtroAtual.status !== 'all' && order.status_compra !== filtroAtual.status) {
        return false;
      }

      if (filtroAtual.carrier !== 'all' && order.frete?.transportadora !== filtroAtual.carrier) {
        return false;
      }

      return true;
    });

    // Métricas
    const totalOrders = filteredOrders.length;
    const totalValue = filteredOrders.reduce((sum, order) => sum + order.valor_total, 0);
    const totalItems = filteredOrders.reduce((sum, order) => {
      return sum + order.itens.reduce((itemSum, item) => itemSum + item.quantidade, 0);
    }, 0);
    const ordersWithShipping = filteredOrders.filter(order => order.frete);
    const avgShipping = ordersWithShipping.length > 0 
      ? ordersWithShipping.reduce((sum, order) => sum + order.frete.valor, 0) / ordersWithShipping.length
      : 0;

    const metrics = {
      totalOrders,
      totalValue,
      totalItems,
      avgShipping
    };

    // Dados para gráficos
    const comprasAnterioresChartData = filteredOrders.map(comp => ({
      name: `Compra #${comp.id}`,
      value: comp.valor_total,
    }));

    const itensCompradosChartData = filteredOrders.reduce((acc, comp) => {
      comp.itens.forEach(item => {
        const produto = acc.find(p => p.name === item.produto.nome);
        if (produto) {
          produto.value += item.quantidade;
        } else {
          acc.push({ name: item.produto.nome, value: item.quantidade });
        }
      });
      return acc;
    }, []);

    const statusCount = {};
    filteredOrders.forEach(order => {
      statusCount[order.status_compra] = (statusCount[order.status_compra] || 0) + 1;
    });
    const statusComprasChartData = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

    const evolutionData = [...filteredOrders].sort((a, b) => 
      new Date(a.data_compra) - new Date(b.data_compra)
    ).map(order => ({
      name: formatDate(order.data_compra),
      value: order.valor_total
    }));

    // Análise Comportamental
    const behaviorData = {
      averageOrderValue: totalOrders > 0 ? totalValue / totalOrders : 0,
      averageItemsPerOrder: totalOrders > 0 ? totalItems / totalOrders : 0,
      totalSpent: totalValue,
      orderFrequency: 0
    };

    if (filteredOrders.length > 1) {
      const sortedOrders = [...filteredOrders].sort((a, b) => 
        new Date(a.data_compra) - new Date(b.data_compra)
      );
      let totalDays = 0;
      for (let i = 1; i < sortedOrders.length; i++) {
        const prevDate = new Date(sortedOrders[i-1].data_compra);
        const currDate = new Date(sortedOrders[i].data_compra);
        totalDays += (currDate - prevDate) / (1000 * 60 * 60 * 24);
      }
      behaviorData.orderFrequency = totalDays / (sortedOrders.length - 1);
    }

    // Insights
    const insights = [];
    if (behaviorData.averageOrderValue > 200) {
      insights.push({
        type: 'success',
        description: `Valor médio por compra de ${formatCurrency(behaviorData.averageOrderValue)} indica um cliente valioso.`
      });
    }
    if (behaviorData.orderFrequency > 0 && behaviorData.orderFrequency < 60) {
      insights.push({
        type: 'info',
        description: `Compra em média a cada ${Math.round(behaviorData.orderFrequency)} dias, demonstrando alta fidelidade.`
      });
    }
    if (itensCompradosChartData.length > 0) {
      const topProduct = itensCompradosChartData.reduce((prev, current) => (prev.value > current.value ? prev : current));
      insights.push({
        type: 'info',
        description: `"${topProduct.name}" é o produto mais comprado com ${topProduct.value} unidades.`
      });
    }

    return {
      metrics,
      comprasAnterioresChartData,
      itensCompradosChartData,
      statusComprasChartData,
      evolutionData,
      behaviorData,
      insights,
      filteredOrders
    };
  }, [filtroAtual]);

  const compraCarregar = async () => {
    setCarregando(true);
    try {
      const dados = await buscarCompraPorId(id);
      const compraCompleta = {
        ...dados?.compra_atual,
        compras_anteriores: dados?.compras_anteriores || []
      };
      setCompra(compraCompleta);
      setDadosFiltrados(processarDados(compraCompleta));
    } catch (err) {
      console.error('Erro ao carregar compra:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    compraCarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (compra) {
      setDadosFiltrados(processarDados(compra));
    }
  }, [filtroAtual, compra, processarDados]);

  const handleFilterChange = (newFilters) => {
    setFiltroAtual(newFilters);
  };

  const handleClearFilters = () => {
    setFiltroAtual({ period: 'all', status: 'all', carrier: 'all' });
  };

  if (carregando) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-2">Carregando dados da compra...</p>
        </div>
      </div>
    );
  }

  if (!compra || !compra.id) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Compra não encontrada
        </div>
      </div>
    );
  }

  if (!dadosFiltrados) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Processando dados...
        </div>
      </div>
    );
  }

  const { metrics, comprasAnterioresChartData, itensCompradosChartData, statusComprasChartData, evolutionData, behaviorData, insights, filteredOrders } = dadosFiltrados;

  return (
    <div className="container-fluid mt-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="card-body text-white">
              <h1 className="card-title mb-2">
                <i className="fas fa-chart-line me-3"></i>
                Dashboard de Análise - Compra #{compra.id}
              </h1>
              <p className="card-text mb-0">Análise completa do cliente e histórico de compras</p>
            </div>
          </div>
        </div>
      </div>

      <FilterSection 
        onFilterChange={handleFilterChange} 
        onClearFilters={handleClearFilters}
        onExportData={exportarDados}
      />

      <MetricCards metrics={metrics} />

      <div className="row">
        <div className="col-lg-8">
          <ClientInfoCard client={compra.cliente} address={compra.endereco} />
        </div>
        <div className="col-lg-4">
          <CurrentOrderDetails order={compra} copiarRastreio={copiarRastreio} />
        </div>
      </div>

      <InsightsDisplay insights={insights} behaviorData={behaviorData} />

      <ChartsDisplay 
        comprasAnterioresChartData={comprasAnterioresChartData}
        itensCompradosChartData={itensCompradosChartData}
        statusComprasChartData={statusComprasChartData}
        evolutionData={evolutionData}
      />

      <OrderHistoryTable 
        orders={filteredOrders.filter(o => o.id !== compra.id)} 
        onSelectOrder={(order) => navigate(`/compras/detalhe/${order.id}`)} 
      />

      {/* Iframe do Rastreio - Mantido conforme solicitado */}
      {compra.codigo_rastreio && (
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-dark text-white">
            <h5 className="card-title mb-0">
              <i className="fas fa-search me-2"></i>
              Rastreamento Detalhado
            </h5>
          </div>
          <div className="card-body">
            <iframe
              src={compra.codigo_rastreio}
              className="w-100"
              style={{ height: '500px', border: '1px solid #ccc', borderRadius: '8px' }}
              title="Rastreamento"
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-5 py-4 bg-light text-center">
        <p className="text-muted mb-0">
          <i className="fas fa-chart-bar me-2"></i>
          Dashboard de Análise de Cliente - Desenvolvido com React e Bootstrap
        </p>
      </footer>
    </div>
  );
}

export default DetalheCompra;

