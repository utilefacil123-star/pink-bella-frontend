import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import NovoProduto from './NovoProduto';
import * as controller from '../../controllers/produtoController';

jest.mock('../../controllers/produtoController');

const renderNovo = () =>
  render(
    <MemoryRouter initialEntries={['/produtos/novo']}>
      <Routes>
        <Route path="/produtos/novo" element={<NovoProduto />} />
        <Route path="/produtos" element={<div>Lista de Produtos</div>} />
      </Routes>
    </MemoryRouter>
  );

const renderEditar = (id) =>
  render(
    <MemoryRouter initialEntries={[`/produtos/editar/${id}`]}>
      <Routes>
        <Route path="/produtos/editar/:id" element={<NovoProduto />} />
        <Route path="/produtos" element={<div>Lista de Produtos</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('NovoProduto — modo criação', () => {
  it('renderiza título "Novo Produto"', () => {
    renderNovo();
    expect(screen.getByText(/novo produto/i)).toBeInTheDocument();
  });

  it('exibe campos obrigatórios', () => {
    renderNovo();
    expect(screen.getByLabelText(/nome \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preço/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/estoque \*/i)).toBeInTheDocument();
  });

  it('chama criarProduto ao submeter', async () => {
    controller.criarProduto.mockResolvedValue({ productId: 10 });
    window.alert = jest.fn();

    renderNovo();

    fireEvent.change(screen.getByLabelText(/nome \*/i), { target: { value: 'Vestido' } });
    fireEvent.change(screen.getByLabelText(/preço/i), { target: { value: '89.90' } });
    fireEvent.change(screen.getByLabelText(/estoque \*/i), { target: { value: '20' } });

    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));

    await waitFor(() => expect(controller.criarProduto).toHaveBeenCalledTimes(1));
    expect(controller.criarProduto).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Vestido', preco: '89.90', estoque: '20' })
    );
  });

  it('exibe spinner no botão durante o envio', async () => {
    controller.criarProduto.mockReturnValue(new Promise(() => {}));

    renderNovo();

    fireEvent.change(screen.getByLabelText(/nome \*/i), { target: { value: 'Camiseta' } });
    fireEvent.change(screen.getByLabelText(/preço/i), { target: { value: '39' } });
    fireEvent.change(screen.getByLabelText(/estoque \*/i), { target: { value: '5' } });

    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));

    await waitFor(() => expect(screen.getByText(/salvando/i)).toBeInTheDocument());
  });
});

describe('NovoProduto — modo edição', () => {
  const produtoMock = {
    id: 3,
    nome: 'Calça Jeans',
    preco: 129.9,
    estoque: 8,
    peso: 500,
    altura: 10,
    largura: 25,
    comprimento: 30,
    descricao: 'Calça slim',
    imagem: '/uploads/calca.jpg',
  };

  it('renderiza título "Editar Produto"', async () => {
    controller.buscarProdutoPorId.mockResolvedValue(produtoMock);
    renderEditar(3);
    await waitFor(() => expect(screen.getByText(/editar produto/i)).toBeInTheDocument());
  });

  it('preenche campos com dados do produto', async () => {
    controller.buscarProdutoPorId.mockResolvedValue(produtoMock);
    renderEditar(3);

    await waitFor(() =>
      expect(screen.getByDisplayValue('Calça Jeans')).toBeInTheDocument()
    );
    expect(screen.getByDisplayValue('129.9')).toBeInTheDocument();
    expect(screen.getByDisplayValue('8')).toBeInTheDocument();
  });

  it('chama atualizarProduto ao salvar', async () => {
    controller.buscarProdutoPorId.mockResolvedValue(produtoMock);
    controller.atualizarProduto.mockResolvedValue({ message: 'Produto atualizado com sucesso!' });
    window.alert = jest.fn();

    renderEditar(3);

    await waitFor(() => expect(screen.getByDisplayValue('Calça Jeans')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /atualizar/i }));

    await waitFor(() => expect(controller.atualizarProduto).toHaveBeenCalledWith(
      '3',
      expect.objectContaining({ nome: 'Calça Jeans' })
    ));
  });
});
