import React, { useState, useEffect } from 'react';
import { calcularFrete } from '../../controllers/freteController';
import MostrarEndereco from '../../components/MostrarEndereco';
import { listarClientes } from "../../controllers/clienteController";

function FretePage() {
  const [nomeCliente, setNomeCliente] = useState('');
  const [cepDestino, setCepDestino] = useState('');
  const [produtos, setProdutos] = useState([{ nome: '', valor: '', quantidade: 1 }]);
  const [fretes, setFretes] = useState([]);
  const [freteSelecionado, setFreteSelecionado] = useState(null);
  const [endereco, setEndereco] = useState('');
  const [descontoProduto, setDescontoProduto] = useState('');
  const [descontoFrete, setDescontoFrete] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enderecoFrete, setEnderecoFrete] = useState(null);
  const [clientes, setClientes] = useState([]);

  const carregarClientes = async () => {
      try {
        const dados = await listarClientes();
        setClientes(dados);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
        alert("Não foi possível carregar a lista de clientes.");
      }
    };

  useEffect(() => {
      carregarClientes();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

  const handleProdutoChange = (index, field, value) => {
    const novosProdutos = [...produtos];
    novosProdutos[index][field] = value;
    setProdutos(novosProdutos);
  };

  const adicionarProduto = () => {
    setProdutos([...produtos, { nome: '', valor: '', quantidade: 1 }]);
  };

  const calFrete = async () => {
    if (!cepDestino) {
      alert('Informe o CEP de destino.');
      return;
    }

    try {
      const quantidadeTotal = produtos.reduce((acc, p) => acc + (parseInt(p.quantidade) || 1), 0);
      const response = await calcularFrete(cepDestino, [{ produto_id: 1, quantidade: quantidadeTotal }]);

      if (response && response.opcoes_frete) {
        setFretes(response.opcoes_frete);
      } else {
        setFretes([]);
      }
      setEnderecoFrete(response.enderecoDestino);
      setEndereco(`${response.enderecoDestino.logradouro} – Bairro ${response.enderecoDestino.bairro}\nCEP: ${response.enderecoDestino.cep} – ${response.enderecoDestino.cidade}, ${response.enderecoDestino.estado}`);
    } catch (error) {
      alert('Erro ao calcular o frete. Verifique o CEP e tente novamente.');
    }
  };

  const gerarTextoPedido = () => {
  if (!nomeCliente) {
    alert("Preencha o nome do cliente.");
    return;
  }

  if (produtos.length === 0) {
    alert("Adicione ao menos um produto.");
    return;
  }

  for (const p of produtos) {
    if (!p.nome || !p.valor) {
      alert("Todos os produtos precisam ter nome e valor.");
      return;
    }
  }

  if (!freteSelecionado || !freteSelecionado.preco_frete) {
    alert("Selecione uma opção de frete.");
    return;
  }

  if (!endereco) {
    alert("Preencha o endereço de destino.");
    return;
  }

  const totalProdutos = produtos.reduce((acc, p) => acc + parseFloat(p.valor || 0), 0);

  const valorDescontoProduto = descontoProduto.includes('%')
    ? (parseFloat(descontoProduto.replace('%', '')) / 100) * totalProdutos
    : parseFloat(descontoProduto || 0);

  const valorFreteOriginal = parseFloat(freteSelecionado?.preco_frete || 0);
const valorFrete = Math.round(valorFreteOriginal); // arredondamento padrão
  const valorDescontoFrete = descontoFrete.includes('%')
    ? (parseFloat(descontoFrete.replace('%', '')) / 100) * valorFrete
    : parseFloat(descontoFrete || 0);

  const total = totalProdutos - valorDescontoProduto + freteSelecionado.preco_frete - valorDescontoFrete;

  const texto = `📦 Pedido – ${nomeCliente} (Atualizado)

Produto:
${produtos.map(p => `- ${p.nome} – R$${parseFloat(p.valor).toFixed(2)}`).join('\n')}
${valorDescontoProduto > 0 ? `🎁 Desconto nos produtos: -R$${valorDescontoProduto.toFixed(2)}` : ''}

Frete (${freteSelecionado?.nome_transportadora || 'Não selecionado'}): R$${Math.round(freteSelecionado.preco_frete).toFixed(2)}
${valorDescontoFrete > 0 ? `🎁 Desconto no frete: -R$${valorDescontoFrete.toFixed(2)}` : ''}
📍 Prazo de entrega: ${freteSelecionado?.prazo_dias_uteis + 1 || '-'} dias úteis
📫 Endereço de destino:
${endereco}

💰 Total a pagar: R$${Math.round(total.toFixed(2))}

📌 Chave Pix (Telefone): (11) 97844-5381
📌 Nome: Amanda Batista da Silva – Pink Bella`;

  setMensagem(texto);
  navigator.clipboard.writeText(texto);
};


  return (
    <div className="container">
      <h2 className="mb-3">Gerar Pedido com Frete</h2>
      <div className="row">
      
      <div className="col-md-4">
        
      <div className="mb-3">
        <label>CEP de Destino:</label>
        <input type="text" className="form-control" value={cepDestino} onChange={e => setCepDestino(e.target.value)} />
        <button className="btn btn-primary mt-2" onClick={calFrete}>Calcular Frete</button>
      </div>

      {/* Exibição do endereço de destino */}
              {enderecoFrete ? ( // Renderiza o MostrarEndereco APENAS se enderecoFrete tiver valor
                <>
                  <h5 className="mt-3">Endereço de Destino:</h5>
                  {/* Passa o objeto de endereço completo para MostrarEndereco */}
                  <MostrarEndereco endereco={enderecoFrete} /> 
                </>
              ) : (
                <p>Endereço de destino não disponível na resposta do servidor.</p> 
              )}



              {fretes.length > 0 && (
  <div className="mb-3">
    <label className="form-label">Escolher Frete:</label>
    <div className="d-flex flex-column gap-2">
      {fretes.map((f, i) => (
        <div
          key={i}
          onClick={() => setFreteSelecionado(f)}
          className={`p-3 border rounded cursor-pointer ${
            freteSelecionado === f ? 'border-primary border-3 bg-light' : 'border-secondary'
          }`}
        >
          <div>
                        <strong>{f.servico}</strong> ({f.nome_transportadora || 'N/A'})
                        <br />
                        <small>Prazo: {f.prazo_dias_uteis + 1} dias úteis</small>
                      </div>
                      <span className="badge bg-primary rounded-pill">
                        R$ {Math.round(f.preco_frete).toFixed(2).replace('.', ',')}
                      </span>
        </div>
      ))}
    </div>
  </div>
)}
</div>
<div className="col-md-8">
  <div className="mb-3">
    
      <div>
        <label htmlFor={`cliente_`} className="form-label">Cliente</label>
        <select
  name="cliente_id"
  className="form-select"
  onChange={e => {
    const clienteId = e.target.value;
    const cliente = clientes.find(c => c.id === parseInt(clienteId));
    if (cliente) {
      setNomeCliente(cliente.nome); // Preenche nome
      setCepDestino(cliente.endereco?.cep || ''); // Preenche CEP
    } else {
      // Limpa se desmarcar
      setNomeCliente('');
      setCepDestino('');
    }
  }}
>
  <option value="">Selecione um Cliente</option>
  {clientes.map(cliente => (
    <option key={cliente.id} value={cliente.id}>
      {cliente.nome}
    </option>
  ))}
</select>
      </div>
    
        <label>Nome do Cliente:</label>
        <input type="text" className="form-control" value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} />
      </div>
      <h5>Produtos</h5>
      {produtos.map((produto, index) => (
        <div key={index} className="row mb-2 align-items-center">
          <div className="col-5">
            <input
              type="text"
              className="form-control"
              placeholder="Nome do Produto"
              value={produto.nome}
              onChange={e => handleProdutoChange(index, 'nome', e.target.value)}
            />
          </div>
          <div className="col-3">
            <input
              type="number"
              className="form-control"
              placeholder="Valor (R$)"
              value={produto.valor}
              onChange={e => handleProdutoChange(index, 'valor', e.target.value)}
            />
          </div>
          <div className="col-2">
            <input
              type="number"
              className="form-control"
              placeholder="Qtd"
              min="1"
              value={produto.quantidade}
              onChange={e => handleProdutoChange(index, 'quantidade', e.target.value)}
            />
          </div>
          <div className="col-2">
            {produtos.length > 1 && (
              <button
                className="btn btn-outline-danger btn-sm w-100"
                onClick={() => setProdutos(produtos.filter((_, i) => i !== index))}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}
      <button className="btn btn-secondary mb-3" onClick={adicionarProduto}>Adicionar Produto</button>

      <div className="row mb-3">
        <div className="col">
          <label>Desconto nos Produtos (R$ ou %):</label>
          <input type="text" className="form-control" value={descontoProduto} onChange={e => setDescontoProduto(e.target.value)} />
        </div>
        <div className="col">
          <label>Desconto no Frete (R$ ou %):</label>
          <input type="text" className="form-control" value={descontoFrete} onChange={e => setDescontoFrete(e.target.value)} />
        </div>
      </div>

      <button className="btn btn-success" onClick={gerarTextoPedido}>Gerar Texto do Pedido</button>

      {mensagem && (
  <div className="alert alert-info mt-4" style={{ whiteSpace: 'pre-line', position: 'relative' }}>
    <button
      className="btn btn-sm btn-secondary position-absolute top-0 end-0 m-2"
      onClick={() => navigator.clipboard.writeText(mensagem)}
    >
      Copiar
    </button>
    {mensagem}
  </div>
)}
</div>
</div>
    </div>
  );
}

export default FretePage;
