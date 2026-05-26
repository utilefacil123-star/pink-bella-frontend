import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { buscarCompraPorId, calcularFrete, atualizarCompra } from "../../controllers/compraController";
import { listarClientes } from "../../controllers/clienteController";
import { listarProdutos } from "../../controllers/produtoController";

function EditarCompra() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [endereco, setEndereco] = useState({});
  const [itensCompra, setItensCompra] = useState([]);
  const [opcoesFrete, setOpcoesFrete] = useState([]);
  const [freteSelecionado, setFreteSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      try {
        const compraData = await buscarCompraPorId(id);
        setClienteSelecionado(compraData.cliente);
        setEndereco(compraData.endereco);
        setItensCompra(compraData.itens.map(item => ({
          produto_id: item.produto.id,
          nome: item.produto.nome,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario_na_compra,
        })));
        setFreteSelecionado(compraData.frete);

        const clientesData = await listarClientes();
        setClientes(clientesData);

        const produtosData = await listarProdutos();
        setProdutos(produtosData);
      } catch (error) {
        alert("Erro ao carregar dados da compra.");
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [id]);

  // Função para buscar o endereço via CEP
  const buscarCep = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, "");

    if (cepLimpo.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setEndereco((prev) => ({
            ...prev,
            logradouro: data.logradouro || "",
            bairro: data.bairro || "",
            cidade: data.localidade || "",
            estado: data.uf || "",
          }));
        } else {
          alert("CEP não encontrado. Preencha o endereço manualmente.");
        }
      } catch (err) {
        alert("Erro ao buscar CEP.");
      }
    }
  };

  useEffect(() => {
    const cepLimpo = endereco?.cep?.replace(/\D/g, "");
    if (cepLimpo?.length === 8) {
      buscarCep(endereco.cep);
    }
  }, [endereco.cep]);

  function handleEnderecoChange(e) {
    setEndereco((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function handleClienteChange(e) {
    const clienteId = parseInt(e.target.value);
    const cliente = clientes.find(c => c.id === clienteId);
    setClienteSelecionado(cliente);
    setEndereco(cliente?.endereco || {});
    calcularFreteParaCompra(itensCompra, cliente?.endereco?.cep);
  }

  function handleQuantidadeChange(produto_id, novaQtd) {
    setItensCompra(prev => prev.map(item =>
      item.produto_id === produto_id ? { ...item, quantidade: parseInt(novaQtd) || 0 } : item
    ));
  }

  function handleRemoveItem(produto_id) {
    setItensCompra(prev => prev.filter(item => item.produto_id !== produto_id));
  }

  function handleAddItem() {
    setItensCompra(prev => [...prev, { produto_id: "", nome: "", quantidade: 1, preco_unitario: 0 }]);
  }

  function handleProdutoChange(index, produtoId) {
    const produto = produtos.find(p => p.id === parseInt(produtoId));
    setItensCompra(prev => prev.map((item, i) => {
      if (i === index) {
        return {
          produto_id: produto.id,
          nome: produto.nome,
          quantidade: 1,
          preco_unitario: produto.preco,
        };
      }
      return item;
    }));
  }

  async function calcularFreteParaCompra(itens, cepDestino) {
    if (!cepDestino || itens.length === 0) {
      setOpcoesFrete([]);
      setFreteSelecionado(null);
      return;
    }
    const payload = {
      cepDestino,
      itens: itens.map(i => ({
        produto_id: i.produto_id,
        quantidade: i.quantidade,
      })),
    };
    try {
      const response = await calcularFrete(payload);
      setOpcoesFrete(response.opcoes_frete || []);
      if (response.opcoes_frete?.length) {
        setFreteSelecionado(response.opcoes_frete[0]);
      }
    } catch {
      alert("Erro ao calcular frete.");
    }
  }

  useEffect(() => {
    calcularFreteParaCompra(itensCompra, endereco.cep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itensCompra]);

  async function handleSalvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      // Calcula o total dos produtos
const valorProdutos = itensCompra.reduce((total, item) => {
  return total + item.preco_unitario * item.quantidade;
}, 0);

// Pega o frete ou 0 se não tiver
const valorFrete = freteSelecionado?.preco_frete || 0;

// Soma tudo
const valor_total = valorProdutos + valorFrete;

      const payload = {
        cliente_id: clienteSelecionado?.id,
        endereco_entrega_id: endereco.id,
        itens: itensCompra.map(item => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario_no_momento_da_compra: item.preco_unitario,
        })),
        valor_frete: freteSelecionado?.preco_frete,
        transportadora: freteSelecionado?.nome_transportadora,
        servico_frete: freteSelecionado?.servico,
        prazo_frete_dias: freteSelecionado?.prazo_dias_uteis,
        valor_total,
      };
      await atualizarCompra(id, payload);
      alert("Compra atualizada com sucesso!");
      navigate("/compras");
    } catch (error) {
      alert("Erro ao salvar compra.");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) return <p>Carregando...</p>;

  return (
    <div className="container mt-4">
      <h2>Editar Compra #{id}</h2>

      <form onSubmit={handleSalvar}>
        {/* Cliente */}
        <div className="mb-3">
          <label className="form-label">Cliente</label>
          <select
            className="form-select"
            value={clienteSelecionado?.id || ""}
            onChange={handleClienteChange}
            required
          >
            <option value="">Selecione um cliente</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nome} (ID: {c.id})</option>
            ))}
          </select>
        </div>

        {/* Endereço */}
        <h4>Endereço de Entrega</h4>
        <div className="row g-3 mb-3">
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              name="cep"
              placeholder="CEP"
              value={endereco.cep || ""}
              onChange={handleEnderecoChange}
              required
            />
          </div>
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              name="logradouro"
              placeholder="Logradouro"
              value={endereco.logradouro || ""}
              onChange={handleEnderecoChange}
              required
            />
          </div>
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              name="numero"
              placeholder="Número"
              value={endereco.numero || ""}
              onChange={handleEnderecoChange}
              required
            />
          </div>
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              name="complemento"
              placeholder="Complemento"
              value={endereco.complemento || ""}
              onChange={handleEnderecoChange}
            />
          </div>
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              name="bairro"
              placeholder="Bairro"
              value={endereco.bairro || ""}
              onChange={handleEnderecoChange}
              required
            />
          </div>
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              name="cidade"
              placeholder="Cidade"
              value={endereco.cidade || ""}
              onChange={handleEnderecoChange}
              required
            />
          </div>
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              name="estado"
              placeholder="Estado"
              value={endereco.estado || ""}
              onChange={handleEnderecoChange}
              required
            />
          </div>
        </div>

        {/* Itens */}
        <h4>Produtos</h4>
        {itensCompra.map((item, index) => (
          <div key={index} className="row mb-3 align-items-end border p-3 rounded">
            <div className="col-md-6">
              <label className="form-label">Produto</label>
              <select
                className="form-select"
                value={item.produto_id || ""}
                onChange={(e) => handleProdutoChange(index, e.target.value)}
                required
              >
                <option value="">Selecione um produto</option>
                {produtos.map(produto => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome} (R$ {produto.preco.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Quantidade</label>
              <input
                type="number"
                className="form-control"
                min="1"
                value={item.quantidade}
                onChange={(e) => handleQuantidadeChange(item.produto_id, e.target.value)}
                required
              />
            </div>
            <div className="col-md-2 text-end">
              {itensCompra.length > 1 && (
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleRemoveItem(item.produto_id)}
                >
                  Remover
                </button>
              )}
            </div>
          </div>
        ))}
        <div className="mb-3">
          <button type="button" className="btn btn-secondary" onClick={handleAddItem}>
            Adicionar Mais Itens
          </button>
        </div>

        {/* Frete */}
        <h4>Opções de Frete</h4>
        {opcoesFrete.length === 0 && <p>Nenhuma opção de frete disponível</p>}
        <ul className="list-group mb-3">
          {opcoesFrete.map(opcao => (
            <li
              key={opcao.id_servico}
              className={`list-group-item d-flex justify-content-between align-items-center ${freteSelecionado?.id_servico === opcao.id_servico ? "active" : ""}`}
              onClick={() => setFreteSelecionado(opcao)}
              style={{ cursor: "pointer" }}
            >
              <div>
                {opcao.nome_transportadora} - {opcao.servico}
                <br />
                <small>{opcao.prazo_dias_uteis} dias úteis</small>
              </div>
              <span>R$ {opcao.preco_frete.toFixed(2)}</span>
            </li>
          ))}
        </ul>

        <button type="submit" className="btn btn-success" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar Alterações"}
        </button>
        <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate("/compras")} disabled={salvando}>
          Cancelar
        </button>
      </form>
    </div>
  );
}

export default EditarCompra;
