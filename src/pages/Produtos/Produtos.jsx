import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listarProdutos, deletarProduto } from '../../controllers/produtoController';

const BASE_URL = 'http://localhost:3000';

function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const navigate = useNavigate();

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await listarProdutos();
      setProdutos(dados);
    } catch {
      alert('Erro ao carregar produtos.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const handleExcluir = async (produto) => {
    if (!window.confirm(`Excluir "${produto.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await deletarProduto(produto.id);
      setProdutos((prev) => prev.filter((p) => p.id !== produto.id));
    } catch {
      alert('Erro ao excluir produto.');
    }
  };

  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const formatarMoeda = (v) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const cardStyle = {
    backgroundColor: 'var(--surface-color)',
    borderRadius: '15px',
    color: 'var(--text-color)',
  };

  const badgeEstoque = (qtd) => {
    if (qtd === 0) return { bg: '#e74c3c', texto: 'Sem estoque' };
    if (qtd <= 5)  return { bg: '#f39c12', texto: `${qtd} un.` };
    return { bg: '#2ecc71', texto: `${qtd} un.` };
  };

  return (
    <div className="container-fluid p-0">
      {/* Cabeçalho */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1
          className="fw-bold mb-0"
          style={{ color: 'var(--text-color)', borderBottom: '2px solid var(--primary-color)', paddingBottom: '10px' }}
        >
          <i className="fas fa-box-open me-2" style={{ color: 'var(--primary-color)' }}></i>
          Produtos
        </h1>
        <button
          className="btn fw-bold"
          style={{ backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '10px' }}
          onClick={() => navigate('/produtos/novo')}
        >
          <i className="fas fa-plus me-2"></i> Novo Produto
        </button>
      </div>

      {/* Busca */}
      <div className="mb-3" style={{ maxWidth: '360px' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Buscar por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{
            backgroundColor: 'var(--background-color)',
            color: 'var(--text-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
          }}
        />
      </div>

      {/* Conteúdo */}
      <div className="card border-0 shadow-lg" style={cardStyle}>
        <div className="card-body p-0">
          {carregando ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: 'var(--primary-color)' }}></div>
              <p className="mt-3" style={{ color: 'var(--text-color)' }}>Carregando produtos...</p>
            </div>
          ) : produtosFiltrados.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-box-open fa-3x mb-3" style={{ color: 'var(--primary-color)', opacity: 0.5 }}></i>
              <p style={{ color: 'var(--text-color)' }}>
                {busca ? 'Nenhum produto encontrado para esta busca.' : 'Nenhum produto cadastrado ainda.'}
              </p>
              {!busca && (
                <button
                  className="btn fw-bold mt-2"
                  style={{ backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '10px' }}
                  onClick={() => navigate('/produtos/novo')}
                >
                  <i className="fas fa-plus me-2"></i> Cadastrar primeiro produto
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table
                className="table table-hover mb-0"
                style={{
                  '--bs-table-bg': 'var(--surface-color)',
                  '--bs-table-color': 'var(--text-color)',
                  '--bs-table-hover-bg': 'var(--background-color)',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--primary-color)' }}>
                    <th style={{ color: 'var(--primary-color)', padding: '16px 20px' }}>Produto</th>
                    <th style={{ color: 'var(--primary-color)', padding: '16px 20px' }}>Preço</th>
                    <th style={{ color: 'var(--primary-color)', padding: '16px 20px' }}>Estoque</th>
                    <th style={{ color: 'var(--primary-color)', padding: '16px 20px' }}>Dimensões (cm)</th>
                    <th style={{ color: 'var(--primary-color)', padding: '16px 20px', textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.map((p) => {
                    const badge = badgeEstoque(p.estoque);
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        {/* Produto */}
                        <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                          <div className="d-flex align-items-center gap-3">
                            {p.imagem ? (
                              <img
                                src={`${BASE_URL}${p.imagem}`}
                                alt={p.nome}
                                style={{
                                  width: '52px',
                                  height: '52px',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  border: '2px solid var(--border-color)',
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '52px',
                                  height: '52px',
                                  borderRadius: '8px',
                                  backgroundColor: 'var(--background-color)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <i className="fas fa-image" style={{ color: 'var(--border-color)', fontSize: '1.4rem' }}></i>
                              </div>
                            )}
                            <div>
                              <div className="fw-semibold">{p.nome}</div>
                              {p.descricao && (
                                <div
                                  className="text-muted"
                                  style={{ fontSize: '0.8rem', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                >
                                  {p.descricao}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Preço */}
                        <td style={{ padding: '14px 20px', verticalAlign: 'middle', fontWeight: '600' }}>
                          {formatarMoeda(p.preco)}
                        </td>

                        {/* Estoque */}
                        <td style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                          <span
                            className="badge rounded-pill fw-bold"
                            style={{ backgroundColor: badge.bg, color: 'white', padding: '6px 12px' }}
                          >
                            {badge.texto}
                          </span>
                        </td>

                        {/* Dimensões */}
                        <td style={{ padding: '14px 20px', verticalAlign: 'middle', fontSize: '0.85rem', color: 'var(--text-color)', opacity: 0.8 }}>
                          {p.altura || p.largura || p.comprimento
                            ? `${p.altura ?? '—'} × ${p.largura ?? '—'} × ${p.comprimento ?? '—'}`
                            : '—'
                          }
                          {p.peso ? <div style={{ fontSize: '0.78rem' }}>{p.peso} g</div> : null}
                        </td>

                        {/* Ações */}
                        <td style={{ padding: '14px 20px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <button
                            className="btn btn-sm fw-bold me-2"
                            style={{
                              backgroundColor: 'var(--secondary-color)',
                              color: 'var(--surface-color)',
                              borderRadius: '8px',
                              minWidth: '80px',
                            }}
                            onClick={() => navigate(`/produtos/editar/${p.id}`)}
                          >
                            <i className="fas fa-edit me-1"></i> Editar
                          </button>
                          <button
                            className="btn btn-sm fw-bold"
                            style={{ backgroundColor: '#e74c3c', color: 'white', borderRadius: '8px', minWidth: '80px' }}
                            onClick={() => handleExcluir(p)}
                          >
                            <i className="fas fa-trash me-1"></i> Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {!carregando && produtosFiltrados.length > 0 && (
          <div
            className="card-footer text-muted"
            style={{ backgroundColor: 'var(--surface-color)', borderTop: '1px solid var(--border-color)', borderRadius: '0 0 15px 15px', padding: '10px 20px', fontSize: '0.85rem' }}
          >
            {produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? 's' : ''} encontrado{produtosFiltrados.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

export default Produtos;
