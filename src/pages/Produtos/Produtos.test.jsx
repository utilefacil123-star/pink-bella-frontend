import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Produtos from './Produtos';
import * as controller from '../../controllers/produtoController';

jest.mock('../../controllers/produtoController');

const renderPagina = () =>
  render(
    <MemoryRouter>
      <Produtos />
    </MemoryRouter>
  );

const produtosMock = [
  { id: 1, nome: 'Vestido Floral', preco: 99.9, estoque: 10, imagem: null, descricao: '' },
  { id: 2, nome: 'Blusa Rosa', preco: 49.9, estoque: 0, imagem: '/uploads/blusa.jpg', descricao: 'Linda' },
];

describe('Produtos — listagem', () => {
  it('exibe spinner durante o carregamento', () => {
    controller.listarProdutos.mockReturnValue(new Promise(() => {}));
    renderPagina();
    expect(screen.getByText(/carregando produtos/i)).toBeInTheDocument();
  });

  it('exibe a lista de produtos após carregar', async () => {
    controller.listarProdutos.mockResolvedValue(produtosMock);
    renderPagina();
    await waitFor(() => expect(screen.getByText('Vestido Floral')).toBeInTheDocument());
    expect(screen.getByText('Blusa Rosa')).toBeInTheDocument();
  });

  it('exibe mensagem quando não há produtos', async () => {
    controller.listarProdutos.mockResolvedValue([]);
    renderPagina();
    await waitFor(() =>
      expect(screen.getByText(/nenhum produto cadastrado/i)).toBeInTheDocument()
    );
  });

  it('filtra produtos pelo campo de busca', async () => {
    controller.listarProdutos.mockResolvedValue(produtosMock);
    renderPagina();
    await waitFor(() => expect(screen.getByText('Vestido Floral')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/buscar por nome/i), {
      target: { value: 'blusa' },
    });

    expect(screen.queryByText('Vestido Floral')).not.toBeInTheDocument();
    expect(screen.getByText('Blusa Rosa')).toBeInTheDocument();
  });

  it('exibe badge vermelho para produto sem estoque', async () => {
    controller.listarProdutos.mockResolvedValue(produtosMock);
    renderPagina();
    await waitFor(() => expect(screen.getByText('Sem estoque')).toBeInTheDocument());
  });

  it('mostra rodapé com contagem de produtos', async () => {
    controller.listarProdutos.mockResolvedValue(produtosMock);
    renderPagina();
    await waitFor(() =>
      expect(screen.getByText(/2 produtos encontrados/i)).toBeInTheDocument()
    );
  });
});

describe('Produtos — exclusão', () => {
  it('remove produto da lista após confirmar exclusão', async () => {
    controller.listarProdutos.mockResolvedValue([produtosMock[0]]);
    controller.deletarProduto.mockResolvedValue({ message: 'Produto removido com sucesso!' });
    window.confirm = jest.fn().mockReturnValue(true);

    renderPagina();
    await waitFor(() => expect(screen.getByText('Vestido Floral')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /excluir/i }));

    await waitFor(() =>
      expect(screen.queryByText('Vestido Floral')).not.toBeInTheDocument()
    );
    expect(controller.deletarProduto).toHaveBeenCalledWith(1);
  });

  it('não remove produto se exclusão for cancelada', async () => {
    controller.listarProdutos.mockResolvedValue([produtosMock[0]]);
    window.confirm = jest.fn().mockReturnValue(false);

    renderPagina();
    await waitFor(() => expect(screen.getByText('Vestido Floral')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /excluir/i }));

    expect(controller.deletarProduto).not.toHaveBeenCalled();
    expect(screen.getByText('Vestido Floral')).toBeInTheDocument();
  });
});
