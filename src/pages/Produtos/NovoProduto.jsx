import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import {
  buscarProdutoPorId,
  criarProduto,
  atualizarProduto,
} from '../../controllers/produtoController';

const FORM_VAZIO = {
  nome: '', preco: '', estoque: '', peso: '',
  altura: '', largura: '', comprimento: '', descricao: '', imagem: null,
};

function NovoProduto() {
  const [form, setForm] = useState(FORM_VAZIO);
  const [previewImagem, setPreviewImagem] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    buscarProdutoPorId(id)
      .then((p) => {
        setForm({
          nome: p.nome || '', preco: p.preco ?? '', estoque: p.estoque ?? '',
          peso: p.peso ?? '', altura: p.altura ?? '', largura: p.largura ?? '',
          comprimento: p.comprimento ?? '', descricao: p.descricao || '', imagem: p.imagem || null,
        });
        if (p.imagem) setPreviewImagem(`http://localhost:3000${p.imagem}`);
      })
      .catch(() => {
        toast.error('Erro ao carregar produto.');
        navigate('/produtos');
      });
  }, [id, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      if (id) {
        await atualizarProduto(id, form);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await criarProduto(form);
        toast.success('Produto cadastrado com sucesso!');
      }
      navigate('/produtos');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Erro ao salvar produto.';
      toast.error(`Erro: ${msg}`);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="container-fluid py-2">

      {/* Cabeçalho */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate('/produtos')}
            title="Voltar"
          >
            <i className="fas fa-arrow-left" />
          </button>
          <div>
            <h1 className="page-title">
              <i className="fas fa-box page-title-icon" />
              {id ? 'Editar Produto' : 'Novo Produto'}
            </h1>
            <p className="page-subtitle">
              {id ? 'Atualize as informações do produto.' : 'Preencha os dados para cadastrar um novo produto.'}
            </p>
          </div>
        </div>
      </div>

      <div className="card-premium">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">

              <div className="col-md-8">
                <label htmlFor="nome" className="form-label">Nome *</label>
                <input id="nome" type="text" className="form-control" name="nome"
                  value={form.nome} onChange={handleChange} required />
              </div>

              <div className="col-md-4">
                <label htmlFor="preco" className="form-label">Preço (R$) *</label>
                <input id="preco" type="number" className="form-control" name="preco"
                  value={form.preco} onChange={handleChange} required min="0" step="0.01" />
              </div>

              <div className="col-md-4">
                <label htmlFor="estoque" className="form-label">Estoque *</label>
                <input id="estoque" type="number" className="form-control" name="estoque"
                  value={form.estoque} onChange={handleChange} required min="0" />
              </div>

              <div className="col-md-4">
                <label htmlFor="peso" className="form-label">Peso (g)</label>
                <input id="peso" type="number" className="form-control" name="peso"
                  value={form.peso} onChange={handleChange} min="0" step="0.1" />
              </div>

              <div className="col-md-4">
                <label htmlFor="altura" className="form-label">Altura (cm)</label>
                <input id="altura" type="number" className="form-control" name="altura"
                  value={form.altura} onChange={handleChange} min="0" step="0.1" />
              </div>

              <div className="col-md-4">
                <label htmlFor="largura" className="form-label">Largura (cm)</label>
                <input id="largura" type="number" className="form-control" name="largura"
                  value={form.largura} onChange={handleChange} min="0" step="0.1" />
              </div>

              <div className="col-md-4">
                <label htmlFor="comprimento" className="form-label">Comprimento (cm)</label>
                <input id="comprimento" type="number" className="form-control" name="comprimento"
                  value={form.comprimento} onChange={handleChange} min="0" step="0.1" />
              </div>

              <div className="col-12">
                <label htmlFor="descricao" className="form-label">Descrição</label>
                <textarea id="descricao" className="form-control" name="descricao"
                  value={form.descricao} onChange={handleChange} rows={3} />
              </div>

              <div className="col-md-6">
                <label className="form-label">Imagem do Produto</label>
                <input type="file" className="form-control" accept="image/*" onChange={handleImagem} />
              </div>

              {previewImagem && (
                <div className="col-md-6 d-flex align-items-end">
                  <img
                    src={previewImagem}
                    alt="Preview"
                    style={{
                      width: 96, height: 96, objectFit: 'cover',
                      borderRadius: 10, border: '2px solid var(--primary-color)',
                    }}
                  />
                </div>
              )}
            </div>

            <div className="d-flex gap-3 mt-4">
              <button type="submit" className="btn-primary-brand px-4 py-2" disabled={salvando}>
                {salvando
                  ? <><span className="spinner-border spinner-border-sm me-2" />Salvando...</>
                  : <><i className="fas fa-save me-1" />{id ? 'Atualizar' : 'Cadastrar'}</>
                }
              </button>
              <button
                type="button"
                className="btn-secondary-brand px-4 py-2"
                onClick={() => navigate('/produtos')}
              >
                <i className="fas fa-times me-1" /> Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NovoProduto;
