import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  buscarProdutoPorId,
  criarProduto,
  atualizarProduto,
} from '../../controllers/produtoController';

const FORM_VAZIO = {
  nome: '',
  preco: '',
  estoque: '',
  peso: '',
  altura: '',
  largura: '',
  comprimento: '',
  descricao: '',
  imagem: null,
};

function NovoProduto() {
  const [form, setForm] = useState(FORM_VAZIO);
  const [previewImagem, setPreviewImagem] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (!id) return;
    buscarProdutoPorId(id)
      .then((p) => {
        setForm({
          nome: p.nome || '',
          preco: p.preco ?? '',
          estoque: p.estoque ?? '',
          peso: p.peso ?? '',
          altura: p.altura ?? '',
          largura: p.largura ?? '',
          comprimento: p.comprimento ?? '',
          descricao: p.descricao || '',
          imagem: p.imagem || null,
        });
        if (p.imagem) setPreviewImagem(`http://localhost:3000${p.imagem}`);
      })
      .catch(() => {
        alert('Erro ao carregar produto.');
        navigate('/produtos');
      });
  }, [id, navigate]);

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
        alert('Produto atualizado com sucesso!');
      } else {
        await criarProduto(form);
        alert('Produto cadastrado com sucesso!');
      }
      navigate('/produtos');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Erro ao salvar produto.';
      alert(`Erro: ${msg}`);
    } finally {
      setSalvando(false);
    }
  };

  const labelStyle = { color: 'var(--text-color)', fontWeight: '500' };
  const inputStyle = {
    backgroundColor: 'var(--background-color)',
    color: 'var(--text-color)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
  };

  return (
    <div className="container-fluid p-0">
      <h1
        className="fw-bold mb-4"
        style={{ color: 'var(--text-color)', borderBottom: '2px solid var(--primary-color)', paddingBottom: '10px' }}
      >
        <i className="fas fa-box me-2" style={{ color: 'var(--primary-color)' }}></i>
        {id ? 'Editar Produto' : 'Novo Produto'}
      </h1>

      <div
        className="card border-0 shadow-lg"
        style={{ backgroundColor: 'var(--surface-color)', borderRadius: '15px' }}
      >
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">

              {/* Nome */}
              <div className="col-md-8">
                <label htmlFor="nome" className="form-label" style={labelStyle}>Nome *</label>
                <input
                  id="nome"
                  type="text"
                  className="form-control"
                  name="nome"
                  value={form.nome}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>

              {/* Preço */}
              <div className="col-md-4">
                <label htmlFor="preco" className="form-label" style={labelStyle}>Preço (R$) *</label>
                <input
                  id="preco"
                  type="number"
                  className="form-control"
                  name="preco"
                  value={form.preco}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  style={inputStyle}
                />
              </div>

              {/* Estoque */}
              <div className="col-md-4">
                <label htmlFor="estoque" className="form-label" style={labelStyle}>Estoque *</label>
                <input
                  id="estoque"
                  type="number"
                  className="form-control"
                  name="estoque"
                  value={form.estoque}
                  onChange={handleChange}
                  required
                  min="0"
                  style={inputStyle}
                />
              </div>

              {/* Peso */}
              <div className="col-md-4">
                <label htmlFor="peso" className="form-label" style={labelStyle}>Peso (g)</label>
                <input
                  id="peso"
                  type="number"
                  className="form-control"
                  name="peso"
                  value={form.peso}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  style={inputStyle}
                />
              </div>

              {/* Dimensões */}
              <div className="col-md-4">
                <label htmlFor="altura" className="form-label" style={labelStyle}>Altura (cm)</label>
                <input
                  id="altura"
                  type="number"
                  className="form-control"
                  name="altura"
                  value={form.altura}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  style={inputStyle}
                />
              </div>

              <div className="col-md-4">
                <label htmlFor="largura" className="form-label" style={labelStyle}>Largura (cm)</label>
                <input
                  id="largura"
                  type="number"
                  className="form-control"
                  name="largura"
                  value={form.largura}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  style={inputStyle}
                />
              </div>

              <div className="col-md-4">
                <label htmlFor="comprimento" className="form-label" style={labelStyle}>Comprimento (cm)</label>
                <input
                  id="comprimento"
                  type="number"
                  className="form-control"
                  name="comprimento"
                  value={form.comprimento}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  style={inputStyle}
                />
              </div>

              {/* Descrição */}
              <div className="col-12">
                <label htmlFor="descricao" className="form-label" style={labelStyle}>Descrição</label>
                <textarea
                  id="descricao"
                  className="form-control"
                  name="descricao"
                  value={form.descricao}
                  onChange={handleChange}
                  rows={3}
                  style={inputStyle}
                />
              </div>

              {/* Imagem */}
              <div className="col-md-6">
                <label className="form-label" style={labelStyle}>Imagem do Produto</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleImagem}
                  style={inputStyle}
                />
              </div>

              {previewImagem && (
                <div className="col-md-6 d-flex align-items-end">
                  <img
                    src={previewImagem}
                    alt="Preview"
                    style={{
                      width: '100px',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '10px',
                      border: '2px solid var(--primary-color)',
                    }}
                  />
                </div>
              )}

            </div>

            <div className="d-flex gap-2 mt-4">
              <button
                type="submit"
                className="btn fw-bold px-4"
                disabled={salvando}
                style={{ backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '10px' }}
              >
                {salvando ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</>
                ) : (
                  <><i className="fas fa-save me-2"></i>{id ? 'Atualizar' : 'Cadastrar'}</>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary fw-bold px-4"
                style={{ borderRadius: '10px' }}
                onClick={() => navigate('/produtos')}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NovoProduto;
