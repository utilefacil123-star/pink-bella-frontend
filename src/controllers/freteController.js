import api from '../services/api'; // Corrija para incluir .js se necessário: '../services/api.js'

const calcularFrete = async (cepDestino, itens) => {
  try {
    const response = await api.post('/frete/calcular', {
      cepDestino,
      itens,
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao calcular frete:', error.response?.data || error.message);
    throw error;
  }
};

// ✅ Obtem saldo e valor total do carrinho no Melhor Envio
export async function obterSaldoMelhorEnvio() {
  try {
    const response = await api.get('/melhor-envio/saldo-carrinho');
    return response.data;
  } catch (error) {
    console.error('Erro ao obter saldo do Melhor Envio:', error.response?.data || error.message);
    throw error;
  }
}

// ✅ Gera PIX para pagar o valor do carrinho
export async function gerarPixParaCarrinho() {
  try {
    const response = await api.get('/melhor-envio/pix-valor-carrinho');
    return response.data;
  } catch (error) {
    console.error('Erro ao gerar PIX para o carrinho:', error.response?.data || error.message);
    throw error;
  }
}

// ✅ Efetua a compra das etiquetas do carrinho
export async function comprarEtiqueta() {
  try {
    const response = await api.get('/melhor-envio/comprar-etiquetas');
    return response.data;
  } catch (error) {
    console.error('Erro ao comprar etiquetas:', error.response?.data || error.message);
    throw error;
  }
}

// ✅ Gera as etiquetas com base nos IDs após pagamento autorizado
export async function gerarEtiqueta(labelIds) {
  try {
    const response = await api.post('/melhor-envio/etiqueta/gerar', {
      labelIds
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao gerar etiquetas:', error.response?.data || error.message);
    throw error;
  }
}

// (Opcional) Imprime etiquetas em lote
export async function imprimirEtiquetas(orders) {
  try {
    const response = await api.post('/melhor-envio/imprimir-etiquetas', {
      orders,
      mode: 'public'
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao imprimir etiquetas:', error.response?.data || error.message);
    throw error;
  }
}


export async function rastrearEnvioIndividual(codigoEtiqueta) {
  try {
    const response = await api.post('/melhor-envio/rastrear-envios', { orders: [codigoEtiqueta] });
    return response.data;
  } catch (error) {
    console.error('Erro ao rastrear envio:', error.response?.data || error.message);
    throw error;
  }
}

export async function limparCarrinhoObsoleto() {
  try {
    const response = await api.delete('/melhor-envio/carrinho-limpar-obsoletos');
    return response.data;
  } catch (error) {
    console.error('Erro ao limpar carrinho obsoleto:', error.response?.data || error.message);
    throw error;
  }
}

// 2. Mude a exportação para a sintaxe de ES Modules
export { calcularFrete }; // <<< ESTA É A MUDANÇA CRÍTICA! 