// src/pages/Clientes/novo.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../context/ToastContext";

import {
  buscarClientePorId,
  criarCliente,
  atualizarCliente,
} from "../../controllers/clienteController";

function NovoCliente() {
  const { toast, confirm } = useToast();
  const [cliente, setCliente] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    endereco: {
      logradouro: "",
      cep: "",
      numero: "",
      complemento: "",
      referencia: "",
      tipo_endereco: "",
      is_principal: true,
      bairro: "",
      cidade: "",
      estado: "",
    },
  });

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    async function carregarClienteParaEdicao() {
      if (id) {
        try {
          const dadosCliente = await buscarClientePorId(id);
          setCliente((prev) => ({
            ...dadosCliente,
            endereco: {
              logradouro: dadosCliente.endereco?.logradouro || "",
              cep: dadosCliente.endereco?.cep || "",
              numero: dadosCliente.endereco?.numero || "",
              complemento: dadosCliente.endereco?.complemento || "",
              referencia: dadosCliente.endereco?.referencia || "",
              tipo_endereco: dadosCliente.endereco?.tipo_endereco || "",
              is_principal: dadosCliente.endereco?.is_principal ?? true,
              bairro: dadosCliente.endereco?.bairro || "",
              cidade: dadosCliente.endereco?.cidade || "",
              estado: dadosCliente.endereco?.estado || "",
            },
          }));
        } catch (err) {
          console.error("Erro ao carregar cliente para edição:", err);
          toast.error("Erro ao carregar dados do cliente para edição.");
          navigate("/clientes");
        }
      } else {
        setCliente({
          nome: "",
          email: "",
          telefone: "",
          cpf: "",
          endereco: {
            logradouro: "",
            numero: "",
            complemento: "",
            referencia: "",
            tipo_endereco: "",
            is_principal: true,
            bairro: "",
            cidade: "",
            estado: "",
            cep: "",
          },
        });
      }
    }
    carregarClienteParaEdicao();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("endereco.")) {
      const campo = name.split(".")[1];
      setCliente((prev) => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          [campo]: value,
        },
      }));
    } else {
      setCliente((prev) => ({ ...prev, [name]: value }));
    }
  };

  const buscarCep = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, "");

    if (cepLimpo.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setCliente((prev) => ({
            ...prev,
            endereco: {
              ...prev.endereco,
              logradouro: data.logradouro || "",
              bairro: data.bairro || "",
              cidade: data.localidade || "",
              estado: data.uf || "",
            },
          }));
        } else {
          setCliente((prev) => ({
            ...prev,
            endereco: {
              ...prev.endereco,
              logradouro: "",
              bairro: "",
              cidade: "",
              estado: "",
            },
          }));
          console.warn("CEP não encontrado ou inválido:", cepLimpo);
          toast.warning("CEP não encontrado. Preencha o endereço manualmente.");
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err);
        toast.error("Erro ao buscar CEP. Verifique sua conexão.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (id) {
        await atualizarCliente(id, cliente);
        toast.success("Cliente atualizado com sucesso!");
        navigate("/clientes");
      } else {
        const novoClienteSalvo = await criarCliente(cliente);
        toast.success("Cliente cadastrado com sucesso!");
        const irParaCompra = await confirm("Deseja criar uma nova compra para este cliente?");
        if (irParaCompra) {
          navigate(`/compras/novo/${novoClienteSalvo.cliente.clienteId}`);
        } else {
          navigate("/clientes");
        }
      }
    } catch (err) {
      console.error("Erro ao salvar cliente:", err);
      const errorMessage = err.response?.data?.error || err.message || "Erro ao salvar cliente.";
      toast.error(`Erro ao salvar: ${errorMessage}`);
    }
  };

  return (
    <div className="container-fluid py-3">
      {/* Page Header */}
      <div className="d-flex align-items-center mb-4 gap-3">
        <button
          type="button"
          className="btn btn-sm border-0"
          style={{ color: "var(--text-color)", backgroundColor: "var(--surface-color)", borderRadius: "var(--radius-md)" }}
          onClick={() => navigate("/clientes")}
        >
          <i className="fas fa-arrow-left" />
        </button>
        <div>
          <h1 className="fw-bold mb-0" style={{ color: "var(--text-color)", fontSize: "1.6rem" }}>
            <i className="fas fa-user-plus me-2" style={{ color: "var(--primary-color)" }} />
            {id ? "Editar Cliente" : "Novo Cliente"}
          </h1>
          <p className="text-muted small mb-0">
            {id ? "Atualize os dados do cliente abaixo." : "Preencha os dados para cadastrar um novo cliente."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Seção: Dados Pessoais */}
        <div className="card-premium mb-4">
          <div
            className="px-4 py-3"
            style={{ borderBottom: "1px solid var(--border-color)" }}
          >
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <i className="fas fa-id-card" style={{ color: "var(--primary-color)" }} />
              Dados Pessoais
            </h5>
          </div>
          <div className="p-4">
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="nome" className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  Nome Completo <span style={{ color: "var(--status-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="nome"
                  name="nome"
                  placeholder="Ex: Maria da Silva"
                  value={cliente.nome}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="email" className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  E-mail
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  placeholder="cliente@email.com"
                  value={cliente.email || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="telefone" className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  Telefone / WhatsApp <span style={{ color: "var(--status-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="telefone"
                  name="telefone"
                  placeholder="(00) 00000-0000"
                  value={cliente.telefone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="cpf" className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  CPF <span style={{ color: "var(--status-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="cpf"
                  name="cpf"
                  placeholder="000.000.000-00"
                  value={cliente.cpf}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Seção: Endereço */}
        <div className="card-premium mb-4">
          <div
            className="px-4 py-3"
            style={{ borderBottom: "1px solid var(--border-color)" }}
          >
            <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
              <i className="fas fa-map-marker-alt" style={{ color: "var(--primary-color)" }} />
              Endereço Principal
            </h5>
          </div>
          <div className="p-4">
            <div className="row g-3">
              <div className="col-md-3">
                <label htmlFor="cep" className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  CEP <span style={{ color: "var(--status-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="cep"
                  name="endereco.cep"
                  placeholder="00000-000"
                  value={cliente.endereco.cep}
                  onChange={(e) => {
                    handleChange(e);
                    buscarCep(e.target.value);
                  }}
                  required
                  maxLength="9"
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="logradouro" className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  Logradouro <span style={{ color: "var(--status-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="logradouro"
                  name="endereco.logradouro"
                  placeholder="Rua, Avenida, etc."
                  value={cliente.endereco.logradouro}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-3">
                <label htmlFor="numero" className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  Número <span style={{ color: "var(--status-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="numero"
                  name="endereco.numero"
                  placeholder="123"
                  value={cliente.endereco.numero}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-3">
                <label htmlFor="complemento" className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  Complemento
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="complemento"
                  name="endereco.complemento"
                  placeholder="Apto, Bloco..."
                  value={cliente.endereco.complemento}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-3">
                <label htmlFor="bairro" className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  Bairro <span style={{ color: "var(--status-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="bairro"
                  name="endereco.bairro"
                  placeholder="Bairro"
                  value={cliente.endereco.bairro}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-4">
                <label htmlFor="cidade" className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  Cidade <span style={{ color: "var(--status-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="cidade"
                  name="endereco.cidade"
                  placeholder="Cidade"
                  value={cliente.endereco.cidade}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-2">
                <label htmlFor="estado" className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  UF <span style={{ color: "var(--status-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="estado"
                  name="endereco.estado"
                  placeholder="SP"
                  value={cliente.endereco.estado}
                  onChange={handleChange}
                  required
                  maxLength="2"
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="referencia" className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  Ponto de Referência
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="referencia"
                  name="endereco.referencia"
                  placeholder="Próximo ao mercado..."
                  value={cliente.endereco.referencia}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="tipo_endereco" className="form-label fw-semibold" style={{ color: "var(--text-color)" }}>
                  Tipo de Endereço
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="tipo_endereco"
                  name="endereco.tipo_endereco"
                  placeholder="Casa, Trabalho..."
                  value={cliente.endereco.tipo_endereco}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="d-flex gap-3 flex-wrap">
          <button type="submit" className="btn-primary-brand px-4 py-2">
            <i className="fas fa-save me-2" />
            {id ? "Salvar Alterações" : "Cadastrar Cliente"}
          </button>
          <button
            type="button"
            className="btn-secondary-brand px-4 py-2"
            onClick={() => navigate("/clientes")}
          >
            <i className="fas fa-times me-2" />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default NovoCliente;