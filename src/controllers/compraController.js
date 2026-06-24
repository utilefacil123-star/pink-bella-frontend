// src/controllers/compraController.js
import api from '../services/api';

export async function criarCompra(compraData) {
  try {
    const response = await api.post('/compras', compraData);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar compra:', error.response ? error.response.data : error.message);
    throw error;
  }
}

export async function listarCompras(page = 1, limit = 20, filtros = {}) {
  try {
    const response = await api.get('/compras', {
      params: { page, limit, ...filtros },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao listar compras:', error.response ? error.response.data : error.message);
    throw error;
  }
}

export async function atualizarStatusCompra(compraId, novoStatus) {
  const url = `/compras/${compraId}/status`;
  const payload = { status: novoStatus };

  try {
    const response = await api.put(url, payload);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar status da compra ${compraId}:`, error.response ? error.response.data : error.message);
    throw error;
  }
}

export async function atualizarRastreio() {
  try {
    const response = await api.get('/melhor-envio/rastreios/atualizar');
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar rastreio:', error);
  }
}

// Buscar compra pelo ID
export async function buscarCompraPorId(id) {
  try {
    const response = await api.get(`/compras/${id}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar compra por ID:", error);
    throw error;
  }
}

// Calcular frete
export async function calcularFrete(payload) {
  try {
    const response = await api.post('/frete/calcular', payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao calcular frete:', error);
    throw error;
  }
}

// Atualizar compra
export async function atualizarCompra(id, payload) {
  try {
    const response = await api.put(`/compras/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar compra:', error);
    throw error;
  }
}

// Recalcula todas as opções de frete para uma compra existente
export async function cotarFreteParaCompra(compraId) {
  try {
    const response = await api.get(`/compras/${compraId}/cotar-frete`);
    return response.data;
  } catch (error) {
    console.error('Erro ao cotar frete:', error);
    throw error;
  }
}

// Atualiza a opção de frete selecionada na compra
export async function atualizarFreteCompra(compraId, opcao) {
  try {
    const response = await api.put(`/compras/${compraId}/frete`, opcao);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar frete da compra:', error);
    throw error;
  }
}