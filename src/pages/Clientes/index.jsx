import React, { useEffect, useState } from "react";
import { listarClientes, desativarCliente } from "../../controllers/clienteController";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState("ativo");
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast, confirm } = useToast();

  const carregarClientes = async () => {
    try {
      setLoading(true);
      const dados = await listarClientes();
      setClientes(dados);
    } catch {
      toast.error("Não foi possível carregar a lista de clientes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarClientes(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleStatus = async (clienteId, currentAtivo) => {
    const action = currentAtivo === 1 ? "desativar" : "ativar";
    const confirmado = await confirm(`Deseja ${action} este cliente?`);
    if (!confirmado) return;

    try {
      await desativarCliente(clienteId);
      toast.success(`Cliente ${action === 'desativar' ? 'desativado' : 'ativado'} com sucesso.`);
      carregarClientes();
    } catch {
      toast.error(`Erro ao ${action} o cliente.`);
    }
  };

  const clientesFiltrados = clientes.filter((cliente) => {
    const statusPass =
      (filtroStatus === "ativo" && cliente.ativo === 1) ||
      (filtroStatus === "inativo" && cliente.ativo === 0) ||
      filtroStatus === "todos";

    if (!statusPass) return false;
    if (!termoPesquisa.trim()) return true;

    const t = termoPesquisa.toLowerCase();
    return (
      (cliente.nome?.toLowerCase().includes(t)) ||
      (cliente.cpf?.toLowerCase().includes(t))
    );
  });

  const stats = {
    total:    clientes.length,
    ativos:   clientes.filter((c) => c.ativo === 1).length,
    inativos: clientes.filter((c) => c.ativo === 0).length,
    filtrados: clientesFiltrados.length,
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
        <span>Carregando clientes...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid py-2">

      {/* Cabeçalho da página */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fas fa-users page-title-icon" />
            Clientes
          </h1>
          <p className="page-subtitle">Gerencie o cadastro e status dos seus clientes.</p>
        </div>
        <Link to="/clientes/novo" className="btn-primary-brand">
          <i className="fas fa-plus" /> Novo Cliente
        </Link>
      </div>

      {/* Cards de estatísticas */}
      <div className="row g-3 mb-4">
        {[
          { label: "Total",    value: stats.total,    icon: "fas fa-users",      color: "var(--primary-color)",   bg: "rgba(216,27,96,0.08)" },
          { label: "Ativos",   value: stats.ativos,   icon: "fas fa-user-check", color: "var(--status-success)",  bg: "rgba(16,185,129,0.08)" },
          { label: "Inativos", value: stats.inativos, icon: "fas fa-user-times", color: "var(--status-danger)",   bg: "rgba(239,68,68,0.08)" },
          { label: "Filtrados",value: stats.filtrados,icon: "fas fa-filter",     color: "var(--status-warning)",  bg: "rgba(245,158,11,0.08)" },
        ].map((s) => (
          <div key={s.label} className="col-lg-3 col-sm-6">
            <div className="stat-card" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div className="stat-icon" style={{ backgroundColor: s.bg, color: s.color }}>
                <i className={s.icon} />
              </div>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <div className="row g-3 align-items-end">
          <div className="col-md-6">
            <label className="form-label">Pesquisar por nome ou CPF</label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-search" />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Digite nome ou CPF..."
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-3">
            <label className="form-label">Status</label>
            <select className="form-select" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
              <option value="ativo">Somente ativos</option>
              <option value="inativo">Somente inativos</option>
              <option value="todos">Todos</option>
            </select>
          </div>
          <div className="col-md-3">
            <button
              className="btn-secondary-brand w-100"
              onClick={() => { setTermoPesquisa(""); setFiltroStatus("ativo"); }}
            >
              <i className="fas fa-eraser" /> Limpar
            </button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="card-premium">
        <div className="card-section-header">
          <h5 className="card-section-title">
            <i className="fas fa-list" style={{ color: 'var(--primary-color)' }} />
            Lista de Clientes ({clientesFiltrados.length})
          </h5>
        </div>

        <div className="card-body p-0">
          {clientesFiltrados.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-users empty-state-icon" />
              <p className="empty-state-title">Nenhum cliente encontrado</p>
              <p className="empty-state-desc">Adicione um novo cliente ou altere os filtros.</p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="table-responsive d-none d-md-block">
                <table className="table table-premium table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nome</th>
                      <th>E-mail</th>
                      <th>Telefone</th>
                      <th>CPF</th>
                      <th>Status</th>
                      <th className="text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesFiltrados.map((cliente) => (
                      <tr key={cliente.id}>
                        <td style={{ color: 'var(--primary-color)', fontWeight: 700 }}>#{cliente.id}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 34, height: 34, borderRadius: '50%',
                                backgroundColor: 'var(--primary-color)',
                                color: '#fff', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem',
                                flexShrink: 0,
                              }}
                            >
                              {cliente.nome?.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600 }}>{cliente.nome}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{cliente.email || '—'}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{cliente.telefone}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{cliente.cpf}</td>
                        <td>
                          <span className={`badge-status ${cliente.ativo === 1 ? 'ativo' : 'inativo'}`}>
                            <i className={`fas ${cliente.ativo === 1 ? 'fa-check-circle' : 'fa-times-circle'}`} />
                            {cliente.ativo === 1 ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button
                              className="btn-ghost"
                              onClick={() => navigate(`/clientes/editar/${cliente.id}`)}
                              title="Editar"
                            >
                              <i className="fas fa-edit" />
                            </button>
                            <button
                              className={`btn-ghost ${cliente.ativo === 1 ? 'danger' : 'success'}`}
                              onClick={() => handleToggleStatus(cliente.id, cliente.ativo)}
                              title={cliente.ativo === 1 ? 'Desativar' : 'Ativar'}
                            >
                              <i className={`fas ${cliente.ativo === 1 ? 'fa-user-times' : 'fa-user-check'}`} />
                            </button>
                            <button
                              className="btn-ghost primary"
                              onClick={() => navigate(`/compras/novo/${cliente.id}`)}
                              title="Nova compra"
                            >
                              <i className="fas fa-shopping-bag" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="d-md-none p-3">
                {clientesFiltrados.map((cliente) => (
                  <div key={cliente.id} className="card-registro-mobile">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '0.8rem' }}>#{cliente.id}</span>
                      <span className={`badge-status ${cliente.ativo === 1 ? 'ativo' : 'inativo'}`}>
                        {cliente.ativo === 1 ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{cliente.nome}</div>
                    {cliente.email && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 2 }}>
                        <i className="fas fa-envelope me-1" />{cliente.email}
                      </div>
                    )}
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 2 }}>
                      <i className="fas fa-phone me-1" />{cliente.telefone}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.8rem', marginBottom: 12 }}>
                      <i className="fas fa-id-card me-1" />{cliente.cpf}
                    </div>
                    <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border-color)', paddingTop: 10, justifyContent: 'flex-end' }}>
                      <button className="btn-ghost" onClick={() => navigate(`/clientes/editar/${cliente.id}`)}>
                        <i className="fas fa-edit" /> Editar
                      </button>
                      <button
                        className={`btn-ghost ${cliente.ativo === 1 ? 'danger' : 'success'}`}
                        onClick={() => handleToggleStatus(cliente.id, cliente.ativo)}
                      >
                        <i className={`fas ${cliente.ativo === 1 ? 'fa-user-times' : 'fa-user-check'}`} />
                        {cliente.ativo === 1 ? 'Desativar' : 'Ativar'}
                      </button>
                      <button className="btn-ghost primary" onClick={() => navigate(`/compras/novo/${cliente.id}`)}>
                        <i className="fas fa-shopping-bag" /> Compra
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Clientes;
