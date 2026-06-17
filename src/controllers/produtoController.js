import api from '../services/api';

export async function listarProdutos() {
  const response = await api.get('/produtos');
  return response.data;
}

export async function buscarProdutoPorId(id) {
  const response = await api.get(`/produtos/${id}`);
  return response.data;
}

export async function criarProduto(dados) {
  const formData = new FormData();
  formData.append('nome', dados.nome);
  formData.append('preco', dados.preco);
  formData.append('estoque', dados.estoque);
  if (dados.peso)        formData.append('peso', dados.peso);
  if (dados.altura)      formData.append('altura', dados.altura);
  if (dados.largura)     formData.append('largura', dados.largura);
  if (dados.comprimento) formData.append('comprimento', dados.comprimento);
  if (dados.descricao)   formData.append('descricao', dados.descricao);
  if (dados.imagem instanceof File) formData.append('imagemProduto', dados.imagem);

  const response = await api.post('/produtos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function atualizarProduto(id, dados) {
  const formData = new FormData();
  formData.append('nome', dados.nome);
  formData.append('preco', dados.preco);
  formData.append('estoque', dados.estoque);
  if (dados.peso)        formData.append('peso', dados.peso);
  if (dados.altura)      formData.append('altura', dados.altura);
  if (dados.largura)     formData.append('largura', dados.largura);
  if (dados.comprimento) formData.append('comprimento', dados.comprimento);
  if (dados.descricao)   formData.append('descricao', dados.descricao);
  if (dados.imagem instanceof File) {
    formData.append('imagemProduto', dados.imagem);
  } else if (dados.imagem) {
    // mantém a imagem existente enviando o path
    formData.append('imagem', dados.imagem);
  }

  const response = await api.put(`/produtos/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function deletarProduto(id) {
  const response = await api.delete(`/produtos/${id}`);
  return response.data;
}

// --- Variações ---

export async function listarVariacoesProduto(produtoId) {
  const response = await api.get(`/produtos/${produtoId}/variacoes`);
  return response.data;
}

export async function criarVariacao(produtoId, dados) {
  const response = await api.post(`/produtos/${produtoId}/variacoes`, dados);
  return response.data;
}

export async function atualizarVariacao(produtoId, varId, dados) {
  const response = await api.put(`/produtos/${produtoId}/variacoes/${varId}`, dados);
  return response.data;
}

export async function deletarVariacao(produtoId, varId) {
  const response = await api.delete(`/produtos/${produtoId}/variacoes/${varId}`);
  return response.data;
}

// --- Categorias ---

export async function listarCategorias() {
  const response = await api.get('/categorias');
  return response.data;
}

export async function criarCategoria(nome) {
  const response = await api.post('/categorias', { nome });
  return response.data;
}

export async function salvarCategoriasProduto(produtoId, categoriaIds) {
  const response = await api.put(`/produtos/${produtoId}/categorias`, { categorias: categoriaIds });
  return response.data;
}
