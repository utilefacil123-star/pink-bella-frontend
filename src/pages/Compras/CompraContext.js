import React, { createContext, useState, useCallback } from 'react';
import { listarCompras } from "../../controllers/compraController";

const CompraContext = createContext();

const LIMIT = 20;

const CompraProvider = ({ children }) => {
  const [comprasT, setComprasT]     = useState([]);
  const [paginacao, setPaginacao]   = useState({ total: 0, page: 1, totalPages: 1 });
  const [filtros, setFiltros]       = useState({ status: 'Todos', search: '' });

  const carregarComprasT = useCallback(async (page = 1, filtrosOverride) => {
    try {
      const filtrosAtivos = filtrosOverride ?? filtros;
      const dados = await listarCompras(page, LIMIT, filtrosAtivos);
      setComprasT(dados.compras ?? []);
      setPaginacao({ total: dados.total, page: dados.page, totalPages: dados.totalPages });
    } catch (err) {
      console.error("Erro ao carregar compras:", err);
    }
  }, [filtros]);

  const mudarPagina = (novaPagina) => {
    carregarComprasT(novaPagina);
  };

  const mudarFiltros = (novosFiltros) => {
    setFiltros(novosFiltros);
    carregarComprasT(1, novosFiltros);
  };

  return (
    <CompraContext.Provider value={{
      comprasT, setComprasT,
      paginacao,
      filtros, mudarFiltros,
      carregarComprasT, mudarPagina,
      LIMIT,
    }}>
      {children}
    </CompraContext.Provider>
  );
};

export { CompraProvider, CompraContext };
