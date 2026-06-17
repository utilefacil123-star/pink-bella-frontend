import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../../context/ToastContext';
import Produtos from './Produtos';
import * as controller from '../../controllers/produtoController';

jest.mock('../../controllers/produtoController');

const renderPagina = () =>
  render(
    <ToastProvider>
      <MemoryRouter>
        <Produtos />
      </MemoryRouter>
    </ToastProvider>
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

    fireEvent.change(screen.getByPlaceholderText(/nome do produto/i), {
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
  it('remove produto da lista após confirmar no modal', async () => {
    controller.listarProdutos.mockResolvedValue([produtosMock[0]]);
    controller.deletarProduto.mockResolvedValue({ message: 'Produto removido com sucesso!' });

    renderPagina();
    await waitFor(() => expect(screen.getByText('Vestido Floral')).toBeInTheDocument());

    // Abre o modal de confirmação
    fireEvent.click(screen.getByRole('button', { name: /excluir/i }));

    // Clica em "Confirmar" no modal do ToastContext
    await waitFor(() => expect(screen.getByText(/confirmar/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /^confirmar$/i }));

    await waitFor(() =>
      expect(screen.queryByText('Vestido Floral')).not.toBeInTheDocument()
    );
    expect(controller.deletarProduto).toHaveBeenCalledWith(1);
  });

  it('não remove produto se cancelar no modal', async () => {
    controller.listarProdutos.mockResolvedValue([produtosMock[0]]);

    renderPagina();
    await waitFor(() => expect(screen.getByText('Vestido Floral')).toBeInTheDocument());

    // Abre o modal de confirmação
    fireEvent.click(screen.getByRole('button', { name: /excluir/i }));

    // Clica em "Cancelar" no modal
    await waitFor(() => expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(controller.deletarProduto).not.toHaveBeenCalled();
    expect(screen.getByText('Vestido Floral')).toBeInTheDocument();
  });
});
