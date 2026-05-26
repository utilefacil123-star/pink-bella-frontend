import React, { createContext, useState, useEffect } from 'react';
import {
  listarCompras
} from "../../controllers/compraController";

const CompraContext = createContext();

const CompraProvider = ({ children }) => {
  const [comprasT, setComprasT] = useState([]);

  const carregarComprasT = async () => {
    try {
      const dados = await listarCompras();
      setComprasT(dados);
    } catch (err) {
      console.error("Erro ao carregar compras:", err);
    }
  };

  useEffect(() => {
    carregarComprasT();
  }, []);


  return (
    <CompraContext.Provider value={{ comprasT, setComprasT, carregarComprasT }}>
      {children}
    </CompraContext.Provider>
  );
};

export { CompraProvider, CompraContext };