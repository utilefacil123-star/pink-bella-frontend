import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarProdutos, deletarProduto } from '../../controllers/produtoController';
import { useToast } from '../../context/ToastContext';

const BASE_URL = 'http://localhost:3000';

function estoqueBadge(qtd) {
  if (qtd === 0) return { cls: 'badge-status cancelado', texto: 'Sem estoque' };
  if (qtd <= 5)  return { cls: 'badge-status pendente',  texto: `${qtd} un.` };
  return               { cls: 'badge-status pago',       texto: `${qtd} un.` };
}

function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const navigate = useNavigate();
  const { toast, confirm } = useToast();

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await listarProdutos();
      setProdutos(dados);
    } catch {
      toast.error('Erro ao carregar produtos.');
    } finally {
      setCarregando(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { carregar(); }, [carregar]);

  const handleExcluir = async (produto) => {
    const ok = await confirm(`Excluir "${produto.nome}"? Esta ação não pode ser desfeita.`);
    if (!ok) return;
    try {
      await deletarProduto(produto.id);
      setProdutos((prev) => prev.filter((p) => p.id !== produto.id));
      toast.success(`"${produto.nome}" excluído com sucesso.`);
    } catch {
      toast.error('Erro ao excluir produto.');
    }
  };

  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const formatarMoeda = (v) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  if (carregando) {
    return (
      <div className="loading-state">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
        <span>Carregando produtos...</span>
      </div>
    );
  }

  return (
    <div className="container-fluid py-2">

      {/* Cabeçalho */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <i className="fas fa-box-open page-title-icon" />
            Produtos
          </h1>
          <p className="page-subtitle">Gerencie o catálogo e o estoque da loja.</p>
        </div>
        <button className="btn-primary-brand" onClick={() => navigate('/produtos/novo')}>
          <i className="fas fa-plus" /> Novo Produto
        </button>
      </div>

      {/* Busca */}
      <div className="filters-bar">
        <div style={{ maxWidth: 360 }}>
          <label className="form-label">Buscar por nome</label>
          <div className="input-group">
            <span className="input-group-text"><i className="fas fa-search" /></span>
            <input
              type="text"
              className="form-control"
              placeholder="Nome do produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="card-premium">
        <div className="card-section-header">
          <h5 className="card-section-title">
            <i className="fas fa-list" style={{ color: 'var(--primary-color)' }} />
            Lista de Produtos ({produtosFiltrados.length})
          </h5>
        </div>

        <div className="card-body p-0">
          {produtosFiltrados.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-box-open empty-state-icon" />
              <p className="empty-state-title">
                {busca ? 'Nenhum produto encontrado para esta busca.' : 'Nenhum produto cadastrado ainda.'}
              </p>
              {!busca && (
                <button className="btn-primary-brand mt-2" onClick={() => navigate('/produtos/novo')}>
                  <i className="fas fa-plus" /> Cadastrar produto
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-premium table-hover">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Preço</th>
                    <th>Estoque</th>
                    <th>Dimensões (cm)</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.map((p) => {
                    const badge = estoqueBadge(p.estoque);
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {p.imagem ? (
                              <img
                                src={`${BASE_URL}${p.imagem}`}
                                alt={p.nome}
                                style={{
                                  width: 48, height: 48, objectFit: 'cover',
                                  borderRadius: 8, border: '1px solid var(--border-color)', flexShrink: 0,
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 48, height: 48, borderRadius: 8,
                                  backgroundColor: 'var(--background-color)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}
                              >
                                <i className="fas fa-image" style={{ color: 'var(--border-color)', fontSize: '1.2rem' }} />
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 600 }}>{p.nome}</div>
                              {p.descricao && (
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {p.descricao}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--status-success)' }}>
                          {formatarMoeda(p.preco)}
                        </td>
                        <td>
                          <span className={badge.cls}>{badge.texto}</span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>
                          {p.altura || p.largura || p.comprimento
                            ? `${p.altura ?? '—'} × ${p.largura ?? '—'} × ${p.comprimento ?? '—'}`
                            : '—'}
                          {p.peso && <div style={{ fontSize: '0.75rem' }}>{p.peso} g</div>}
                        </td>
                        <td className="text-end">
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button className="btn-ghost" onClick={() => navigate(`/produtos/editar/${p.id}`)} title="Editar">
                              <i className="fas fa-edit" />
                            </button>
                            <button className="btn-ghost danger" onClick={() => handleExcluir(p)} title="Excluir">
                              <i className="fas fa-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {produtosFiltrados.length > 0 && (
          <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-color)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? 's' : ''} encontrado{produtosFiltrados.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

export default Produtos;
