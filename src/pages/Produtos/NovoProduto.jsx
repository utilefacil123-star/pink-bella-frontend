import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import {
  buscarProdutoPorId,
  criarProduto,
  atualizarProduto,
  listarVariacoesProduto,
  criarVariacao,
  atualizarVariacao,
  deletarVariacao,
  listarCategorias,
  criarCategoria,
  salvarCategoriasProduto,
} from '../../controllers/produtoController';

const FORM_VAZIO = {
  nome: '', preco: '', estoque: '', peso: '',
  altura: '', largura: '', comprimento: '', descricao: '', imagem: null,
};

const FORM_VAR_VAZIO = { tamanho: '', cor: '', estoque: 0, preco_variacao: '' };

const TAMANHOS_PADRAO = ['34', '36', '38', '40', '42', '44', '46', '48', '50', 'PP', 'P', 'M', 'G', 'GG', 'XG', 'Único'];

function NovoProduto() {
  const [form, setForm] = useState(FORM_VAZIO);
  const [previewImagem, setPreviewImagem] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  // Categorias
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState([]);
  const [novaCategoriaInput, setNovaCategoriaInput] = useState('');
  const [criandoCategoria, setCriandoCategoria] = useState(false);

  // Variações (apenas em modo edição)
  const [variacoes, setVariacoes] = useState([]);
  const [formVar, setFormVar] = useState(FORM_VAR_VAZIO);
  const [mostrarFormVar, setMostrarFormVar] = useState(false);
  const [salvandoVar, setSalvandoVar] = useState(false);
  const [editandoVar, setEditandoVar] = useState(null); // { id, tamanho, cor, estoque, preco_variacao }
  const [carregandoVars, setCarregandoVars] = useState(false);

  const carregarCategorias = useCallback(async () => {
    try {
      const lista = await listarCategorias();
      setCategoriasDisponiveis(lista);
    } catch {
      // silencioso
    }
  }, []);

  const carregarVariacoes = useCallback(async () => {
    if (!id) return;
    setCarregandoVars(true);
    try {
      const lista = await listarVariacoesProduto(id);
      setVariacoes(lista);
    } catch {
      toast.error('Erro ao carregar variações.');
    } finally {
      setCarregandoVars(false);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    carregarCategorias();
    if (!id) return;

    buscarProdutoPorId(id)
      .then((p) => {
        setForm({
          nome: p.nome || '', preco: p.preco ?? '', estoque: p.estoque ?? '',
          peso: p.peso ?? '', altura: p.altura ?? '', largura: p.largura ?? '',
          comprimento: p.comprimento ?? '', descricao: p.descricao || '', imagem: p.imagem || null,
        });
        if (p.imagem) setPreviewImagem(p.imagem);
        if (Array.isArray(p.categorias)) {
          setCategoriasSelecionadas(p.categorias.map((c) => c.id));
        }
      })
      .catch(() => {
        toast.error('Erro ao carregar produto.');
        navigate('/produtos');
      });

    carregarVariacoes();
  }, [id, navigate, carregarCategorias, carregarVariacoes]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImagem = (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    setForm((prev) => ({ ...prev, imagem: arquivo }));
    setPreviewImagem(URL.createObjectURL(arquivo));
  };

  const toggleCategoria = (catId) => {
    setCategoriasSelecionadas((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const handleCriarCategoria = async () => {
    if (!novaCategoriaInput.trim()) return;
    setCriandoCategoria(true);
    try {
      const nova = await criarCategoria(novaCategoriaInput.trim());
      setCategoriasDisponiveis((prev) => [...prev, nova].sort((a, b) => a.nome.localeCompare(b.nome)));
      setCategoriasSelecionadas((prev) => [...prev, nova.id]);
      setNovaCategoriaInput('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar categoria.');
    } finally {
      setCriandoCategoria(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      if (id) {
        await atualizarProduto(id, form);
        await salvarCategoriasProduto(id, categoriasSelecionadas);
        toast.success('Produto atualizado com sucesso!');
        navigate('/produtos');
      } else {
        const resultado = await criarProduto(form);
        const novoId = resultado.productId;
        if (categoriasSelecionadas.length > 0) {
          await salvarCategoriasProduto(novoId, categoriasSelecionadas);
        }
        toast.success('Produto cadastrado! Agora adicione as variações de tamanho.');
        navigate(`/produtos/editar/${novoId}`);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Erro ao salvar produto.';
      toast.error(`Erro: ${msg}`);
    } finally {
      setSalvando(false);
    }
  };

  // ---- Variações ----

  const handleSalvarVariacao = async () => {
    if (!formVar.tamanho) {
      toast.warning('Informe o tamanho da variação.');
      return;
    }
    setSalvandoVar(true);
    try {
      await criarVariacao(id, {
        tamanho: formVar.tamanho,
        cor: formVar.cor || null,
        estoque: parseInt(formVar.estoque) || 0,
        preco_variacao: formVar.preco_variacao ? parseFloat(formVar.preco_variacao) : null,
      });
      toast.success('Variação adicionada.');
      setFormVar(FORM_VAR_VAZIO);
      setMostrarFormVar(false);
      await carregarVariacoes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar variação.');
    } finally {
      setSalvandoVar(false);
    }
  };

  const handleSalvarEdicaoVar = async () => {
    if (!editandoVar.tamanho) {
      toast.warning('Informe o tamanho.');
      return;
    }
    setSalvandoVar(true);
    try {
      await atualizarVariacao(id, editandoVar.id, {
        tamanho: editandoVar.tamanho,
        cor: editandoVar.cor || null,
        estoque: parseInt(editandoVar.estoque) || 0,
        preco_variacao: editandoVar.preco_variacao ? parseFloat(editandoVar.preco_variacao) : null,
      });
      toast.success('Variação atualizada.');
      setEditandoVar(null);
      await carregarVariacoes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar variação.');
    } finally {
      setSalvandoVar(false);
    }
  };

  const handleToggleAtivoVar = async (v) => {
    try {
      await atualizarVariacao(id, v.id, { ativo: !v.ativo });
      toast.success(v.ativo ? 'Variação desativada.' : 'Variação reativada.');
      await carregarVariacoes();
    } catch {
      toast.error('Erro ao alterar variação.');
    }
  };

  const handleDeletarVar = async (v) => {
    try {
      await deletarVariacao(id, v.id);
      toast.success('Variação removida.');
      await carregarVariacoes();
    } catch {
      toast.error('Erro ao remover variação.');
    }
  };

  const estoqueBadge = (qtd) => {
    if (qtd === 0) return { cor: 'var(--status-danger)', texto: '0' };
    if (qtd <= 3)  return { cor: 'var(--status-warning)', texto: `${qtd}` };
    return               { cor: 'var(--status-success)', texto: `${qtd}` };
  };

  return (
    <div className="container-fluid py-2">

      {/* Cabeçalho */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button type="button" className="btn-ghost" onClick={() => navigate('/produtos')} title="Voltar">
            <i className="fas fa-arrow-left" />
          </button>
          <div>
            <h1 className="page-title">
              <i className="fas fa-box page-title-icon" />
              {id ? 'Editar Produto' : 'Novo Produto'}
            </h1>
            <p className="page-subtitle">
              {id ? 'Atualize informações, categorias e variações.' : 'Preencha os dados do produto. Após salvar, adicione os tamanhos disponíveis.'}
            </p>
          </div>
        </div>
      </div>

      {/* ---- Formulário principal ---- */}
      <div className="card-premium">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">

              <div className="col-md-8">
                <label className="form-label" htmlFor="f-nome">Nome *</label>
                <input type="text" id="f-nome" className="form-control" name="nome"
                  value={form.nome} onChange={handleChange} required />
              </div>

              <div className="col-md-4">
                <label className="form-label" htmlFor="f-preco">Preço (R$) *</label>
                <input type="number" id="f-preco" className="form-control" name="preco"
                  value={form.preco} onChange={handleChange} required min="0" step="0.01" />
              </div>

              <div className="col-md-4">
                <label className="form-label" htmlFor="f-estoque">
                  Estoque *
                  {id && variacoes.filter(v => v.ativo && v.tamanho !== 'Único').length > 0 && (
                    <span className="text-muted small ms-2">(calculado pelas variações)</span>
                  )}
                </label>
                <input type="number" id="f-estoque" className="form-control" name="estoque"
                  value={form.estoque} onChange={handleChange} required min="0"
                  readOnly={id && variacoes.filter(v => v.ativo && v.tamanho !== 'Único').length > 0}
                  style={id && variacoes.filter(v => v.ativo && v.tamanho !== 'Único').length > 0
                    ? { backgroundColor: 'var(--background-color)', cursor: 'not-allowed' }
                    : {}}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Peso (g)</label>
                <input type="number" className="form-control" name="peso"
                  value={form.peso} onChange={handleChange} min="0" step="0.1" />
              </div>

              <div className="col-md-4">
                <label className="form-label">Altura (cm)</label>
                <input type="number" className="form-control" name="altura"
                  value={form.altura} onChange={handleChange} min="0" step="0.1" />
              </div>

              <div className="col-md-4">
                <label className="form-label">Largura (cm)</label>
                <input type="number" className="form-control" name="largura"
                  value={form.largura} onChange={handleChange} min="0" step="0.1" />
              </div>

              <div className="col-md-4">
                <label className="form-label">Comprimento (cm)</label>
                <input type="number" className="form-control" name="comprimento"
                  value={form.comprimento} onChange={handleChange} min="0" step="0.1" />
              </div>

              <div className="col-12">
                <label className="form-label">Descrição</label>
                <textarea className="form-control" name="descricao"
                  value={form.descricao} onChange={handleChange} rows={3} />
              </div>

              <div className="col-md-6">
                <label className="form-label">Imagem do Produto</label>
                <input type="file" className="form-control" accept="image/*" onChange={handleImagem} />
              </div>

              {previewImagem && (
                <div className="col-md-6 d-flex align-items-end">
                  <img src={previewImagem} alt="Preview"
                    style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 10, border: '2px solid var(--primary-color)' }} />
                </div>
              )}

              {/* ---- Categorias ---- */}
              <div className="col-12">
                <label className="form-label fw-semibold">Categorias</label>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {categoriasDisponiveis.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategoria(cat.id)}
                      style={{
                        padding: '4px 14px',
                        borderRadius: 20,
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        border: categoriasSelecionadas.includes(cat.id)
                          ? '2px solid var(--primary-color)'
                          : '2px solid var(--border-color)',
                        backgroundColor: categoriasSelecionadas.includes(cat.id)
                          ? 'rgba(216,27,96,0.12)'
                          : 'var(--background-color)',
                        color: categoriasSelecionadas.includes(cat.id)
                          ? 'var(--primary-color)'
                          : 'var(--text-color)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {categoriasSelecionadas.includes(cat.id) && <i className="fas fa-check me-1" style={{ fontSize: '0.75rem' }} />}
                      {cat.nome}
                    </button>
                  ))}
                </div>
                {/* Nova categoria inline */}
                <div className="d-flex gap-2" style={{ maxWidth: 320 }}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Nova categoria..."
                    value={novaCategoriaInput}
                    onChange={(e) => setNovaCategoriaInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCriarCategoria())}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={handleCriarCategoria}
                    disabled={criandoCategoria || !novaCategoriaInput.trim()}
                  >
                    {criandoCategoria ? <span className="spinner-border spinner-border-sm" /> : <i className="fas fa-plus" />}
                  </button>
                </div>
              </div>

            </div>

            <div className="d-flex gap-3 mt-4">
              <button type="submit" className="btn-primary-brand px-4 py-2" disabled={salvando}>
                {salvando
                  ? <><span className="spinner-border spinner-border-sm me-2" />Salvando...</>
                  : <><i className="fas fa-save me-1" />{id ? 'Atualizar' : 'Salvar e adicionar tamanhos'}</>
                }
              </button>
              <button type="button" className="btn-secondary-brand px-4 py-2" onClick={() => navigate('/produtos')}>
                <i className="fas fa-times me-1" /> Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ---- Seção de Variações (somente em edição) ---- */}
      {id && (
        <div className="card-premium mt-4">
          <div className="px-4 py-3 d-flex justify-content-between align-items-center"
            style={{ borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h5 className="fw-bold mb-0">
                <i className="fas fa-tags me-2" style={{ color: 'var(--primary-color)' }} />
                Variações (tamanho / cor)
              </h5>
              <p className="text-muted small mb-0 mt-1">
                O estoque total do produto é calculado automaticamente pela soma das variações ativas.
              </p>
            </div>
            {!mostrarFormVar && !editandoVar && (
              <button type="button" className="btn-primary-brand px-3 py-2"
                style={{ fontSize: '0.85rem' }}
                onClick={() => { setMostrarFormVar(true); setFormVar(FORM_VAR_VAZIO); }}>
                <i className="fas fa-plus me-1" /> Adicionar
              </button>
            )}
          </div>

          <div className="p-4">

            {/* Form para nova variação */}
            {mostrarFormVar && (
              <div className="p-3 mb-3 rounded" style={{ backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)' }}>
                <div className="row g-2 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label small fw-semibold">Tamanho *</label>
                    <select className="form-select form-select-sm"
                      value={formVar.tamanho}
                      onChange={(e) => setFormVar(p => ({ ...p, tamanho: e.target.value }))}>
                      <option value="">Selecione</option>
                      {TAMANHOS_PADRAO.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small fw-semibold">Cor</label>
                    <input type="text" className="form-control form-control-sm" placeholder="Ex: Rosa"
                      value={formVar.cor}
                      onChange={(e) => setFormVar(p => ({ ...p, cor: e.target.value }))} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small fw-semibold">Estoque *</label>
                    <input type="number" className="form-control form-control-sm" min="0"
                      value={formVar.estoque}
                      onChange={(e) => setFormVar(p => ({ ...p, estoque: e.target.value }))} />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label small fw-semibold">Preço específico</label>
                    <input type="number" className="form-control form-control-sm" min="0" step="0.01" placeholder="Opcional"
                      value={formVar.preco_variacao}
                      onChange={(e) => setFormVar(p => ({ ...p, preco_variacao: e.target.value }))} />
                  </div>
                  <div className="col-md-3 d-flex gap-2">
                    <button type="button" className="btn-primary-brand px-3 py-2 flex-fill"
                      style={{ fontSize: '0.82rem' }}
                      onClick={handleSalvarVariacao} disabled={salvandoVar}>
                      {salvandoVar ? <span className="spinner-border spinner-border-sm" /> : <><i className="fas fa-save me-1" />Salvar</>}
                    </button>
                    <button type="button" className="btn-secondary-brand px-3 py-2"
                      style={{ fontSize: '0.82rem' }}
                      onClick={() => { setMostrarFormVar(false); setFormVar(FORM_VAR_VAZIO); }}>
                      <i className="fas fa-times" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tabela de variações existentes */}
            {carregandoVars ? (
              <div className="text-center py-3">
                <span className="spinner-border spinner-border-sm me-2" />Carregando...
              </div>
            ) : variacoes.length === 0 ? (
              <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                <i className="fas fa-ruler-combined fa-2x mb-2" style={{ opacity: 0.3 }} />
                <p className="mb-0 small">Nenhuma variação cadastrada.<br />Adicione tamanhos disponíveis para este produto.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table table-sm mb-0" style={{ fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th>Tamanho</th>
                      <th>Cor</th>
                      <th>SKU</th>
                      <th className="text-center">Estoque</th>
                      <th className="text-end">Preço esp.</th>
                      <th className="text-center">Status</th>
                      <th className="text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variacoes.map((v) => (
                      editandoVar?.id === v.id ? (
                        // Linha de edição inline
                        <tr key={v.id} style={{ backgroundColor: 'rgba(216,27,96,0.04)' }}>
                          <td>
                            <select className="form-select form-select-sm"
                              value={editandoVar.tamanho}
                              onChange={(e) => setEditandoVar(p => ({ ...p, tamanho: e.target.value }))}>
                              {TAMANHOS_PADRAO.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>
                          <td>
                            <input type="text" className="form-control form-control-sm" placeholder="Cor"
                              value={editandoVar.cor || ''}
                              onChange={(e) => setEditandoVar(p => ({ ...p, cor: e.target.value }))} />
                          </td>
                          <td><span className="text-muted small">{v.sku}</span></td>
                          <td>
                            <input type="number" className="form-control form-control-sm text-center" min="0"
                              style={{ width: 70 }}
                              value={editandoVar.estoque}
                              onChange={(e) => setEditandoVar(p => ({ ...p, estoque: e.target.value }))} />
                          </td>
                          <td>
                            <input type="number" className="form-control form-control-sm text-end" min="0" step="0.01" placeholder="—"
                              style={{ width: 90 }}
                              value={editandoVar.preco_variacao || ''}
                              onChange={(e) => setEditandoVar(p => ({ ...p, preco_variacao: e.target.value }))} />
                          </td>
                          <td />
                          <td className="text-center">
                            <div className="d-flex gap-1 justify-content-center">
                              <button type="button" className="btn btn-sm"
                                style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: 'var(--status-success)', padding: '2px 8px' }}
                                onClick={handleSalvarEdicaoVar} disabled={salvandoVar}>
                                {salvandoVar ? <span className="spinner-border spinner-border-sm" /> : <i className="fas fa-check" />}
                              </button>
                              <button type="button" className="btn btn-sm"
                                style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-muted)', padding: '2px 8px' }}
                                onClick={() => setEditandoVar(null)}>
                                <i className="fas fa-times" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        // Linha normal
                        <tr key={v.id} style={{ opacity: v.ativo ? 1 : 0.45 }}>
                          <td className="fw-semibold">{v.tamanho}</td>
                          <td>{v.cor || <span className="text-muted">—</span>}</td>
                          <td><code style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{v.sku}</code></td>
                          <td className="text-center">
                            <span className="fw-bold" style={{ color: estoqueBadge(v.estoque).cor }}>
                              {estoqueBadge(v.estoque).texto}
                            </span>
                          </td>
                          <td className="text-end">
                            {v.preco_variacao
                              ? `R$ ${Number(v.preco_variacao).toFixed(2)}`
                              : <span className="text-muted">—</span>}
                          </td>
                          <td className="text-center">
                            <span className="badge-status" style={{
                              backgroundColor: v.ativo ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.10)',
                              color: v.ativo ? 'var(--status-success)' : 'var(--status-danger)',
                              padding: '2px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
                            }}>
                              {v.ativo ? 'Ativa' : 'Inativa'}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="d-flex gap-1 justify-content-center">
                              <button type="button" title="Editar"
                                className="btn btn-sm"
                                style={{ backgroundColor: 'rgba(216,27,96,0.1)', color: 'var(--primary-color)', padding: '2px 8px' }}
                                onClick={() => setEditandoVar({ id: v.id, tamanho: v.tamanho, cor: v.cor || '', estoque: v.estoque, preco_variacao: v.preco_variacao || '' })}>
                                <i className="fas fa-pencil-alt" />
                              </button>
                              <button type="button" title={v.ativo ? 'Desativar' : 'Reativar'}
                                className="btn btn-sm"
                                style={{ backgroundColor: v.ativo ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)', color: v.ativo ? 'var(--status-warning)' : 'var(--status-success)', padding: '2px 8px' }}
                                onClick={() => handleToggleAtivoVar(v)}>
                                <i className={`fas fa-${v.ativo ? 'eye-slash' : 'eye'}`} />
                              </button>
                              {!v.ativo && (
                                <button type="button" title="Remover definitivamente"
                                  className="btn btn-sm"
                                  style={{ backgroundColor: 'rgba(239,68,68,0.10)', color: 'var(--status-danger)', padding: '2px 8px' }}
                                  onClick={() => handleDeletarVar(v)}>
                                  <i className="fas fa-trash" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NovoProduto;
