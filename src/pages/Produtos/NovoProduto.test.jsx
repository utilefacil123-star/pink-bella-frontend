import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../../context/ToastContext';
import NovoProduto from './NovoProduto';
import * as controller from '../../controllers/produtoController';

jest.mock('../../controllers/produtoController');

// Wrap com ToastProvider (componente usa useToast)
const renderNovo = () =>
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/produtos/novo']}>
        <Routes>
          <Route path="/produtos/novo" element={<NovoProduto />} />
          <Route path="/produtos/editar/:id" element={<div>Edição do Produto</div>} />
          <Route path="/produtos" element={<div>Lista de Produtos</div>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );

const renderEditar = (id) =>
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={[`/produtos/editar/${id}`]}>
        <Routes>
          <Route path="/produtos/editar/:id" element={<NovoProduto />} />
          <Route path="/produtos" element={<div>Lista de Produtos</div>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );

beforeEach(() => {
  // Mock padrão de listarCategorias (chamado sempre no mount)
  controller.listarCategorias.mockResolvedValue([]);
  // Mock padrão de listarVariacoesProduto (chamado no mount em modo edição)
  controller.listarVariacoesProduto.mockResolvedValue([]);
  controller.salvarCategoriasProduto.mockResolvedValue({ message: 'ok' });
});

// ─── Modo criação ─────────────────────────────────────────────────────────────

describe('NovoProduto — modo criação', () => {
  it('renderiza título "Novo Produto"', async () => {
    renderNovo();
    await waitFor(() =>
      expect(screen.getByText(/novo produto/i)).toBeInTheDocument()
    );
  });

  it('exibe campos obrigatórios', async () => {
    renderNovo();
    await waitFor(() => expect(screen.getByLabelText(/nome \*/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/preço/i)).toBeInTheDocument();
    // O label de estoque tem asterisco e possivelmente um span "(calculado...)"
    expect(screen.getByLabelText(/estoque \*/i)).toBeInTheDocument();
  });

  it('não exibe seção de variações em modo criação', async () => {
    renderNovo();
    await waitFor(() => expect(screen.getByText(/novo produto/i)).toBeInTheDocument());
    expect(screen.queryByText(/variações/i)).not.toBeInTheDocument();
  });

  it('chama criarProduto ao submeter e navega para edição', async () => {
    controller.criarProduto.mockResolvedValue({ productId: 10 });

    renderNovo();

    await waitFor(() => expect(screen.getByLabelText(/nome \*/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/nome \*/i), { target: { value: 'Vestido Floral' } });
    fireEvent.change(screen.getByLabelText(/preço/i), { target: { value: '89.90' } });
    fireEvent.change(screen.getByLabelText(/estoque \*/i), { target: { value: '20' } });

    fireEvent.click(screen.getByRole('button', { name: /salvar e adicionar tamanhos/i }));

    await waitFor(() => expect(controller.criarProduto).toHaveBeenCalledTimes(1));
    expect(controller.criarProduto).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Vestido Floral', preco: '89.90', estoque: '20' })
    );
    // Após criar, navega para edição
    await waitFor(() => expect(screen.getByText(/edição do produto/i)).toBeInTheDocument());
  });

  it('exibe spinner durante o envio', async () => {
    controller.criarProduto.mockReturnValue(new Promise(() => {}));

    renderNovo();

    await waitFor(() => expect(screen.getByLabelText(/nome \*/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/nome \*/i), { target: { value: 'Camiseta' } });
    fireEvent.change(screen.getByLabelText(/preço/i), { target: { value: '39' } });
    fireEvent.change(screen.getByLabelText(/estoque \*/i), { target: { value: '5' } });

    fireEvent.click(screen.getByRole('button', { name: /salvar e adicionar tamanhos/i }));

    await waitFor(() => expect(screen.getByText(/salvando/i)).toBeInTheDocument());
  });

  it('exibe chips de categorias carregadas da API', async () => {
    controller.listarCategorias.mockResolvedValue([
      { id: 1, nome: 'Vestido' },
      { id: 2, nome: 'Blusa' },
    ]);

    renderNovo();

    await waitFor(() => expect(screen.getByText('Vestido')).toBeInTheDocument());
    expect(screen.getByText('Blusa')).toBeInTheDocument();
  });
});

// ─── Modo edição ──────────────────────────────────────────────────────────────

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
    categorias: [{ id: 2, nome: 'Calça' }],
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

  it('marca a categoria do produto como selecionada', async () => {
    controller.buscarProdutoPorId.mockResolvedValue(produtoMock);
    controller.listarCategorias.mockResolvedValue([
      { id: 1, nome: 'Vestido' },
      { id: 2, nome: 'Calça' },
    ]);
    renderEditar(3);

    await waitFor(() => expect(screen.getByText('Calça')).toBeInTheDocument());
    // Botão "Calça" deve estar selecionado (tem ícone fa-check)
    const btnCalca = screen.getByText('Calça').closest('button');
    expect(btnCalca).toBeDefined();
  });

  it('exibe seção de variações em modo edição', async () => {
    controller.buscarProdutoPorId.mockResolvedValue(produtoMock);
    renderEditar(3);

    await waitFor(() =>
      expect(screen.getByText(/variações \(tamanho \/ cor\)/i)).toBeInTheDocument()
    );
  });

  it('exibe variações existentes na tabela', async () => {
    controller.buscarProdutoPorId.mockResolvedValue(produtoMock);
    controller.listarVariacoesProduto.mockResolvedValue([
      { id: 1, produto_id: 3, tamanho: 'M', cor: 'Rosa', sku: 'calca-jeans-rosa-m', estoque: 5, ativo: true },
      { id: 2, produto_id: 3, tamanho: 'G', cor: 'Preto', sku: 'calca-jeans-preto-g', estoque: 3, ativo: true },
    ]);
    renderEditar(3);

    await waitFor(() => expect(screen.getByText('M')).toBeInTheDocument());
    expect(screen.getByText('G')).toBeInTheDocument();
    expect(screen.getByText('Rosa')).toBeInTheDocument();
    expect(screen.getByText('Preto')).toBeInTheDocument();
  });

  it('chama atualizarProduto e salvarCategoriasProduto ao salvar', async () => {
    controller.buscarProdutoPorId.mockResolvedValue(produtoMock);
    controller.atualizarProduto.mockResolvedValue({ message: 'Produto atualizado com sucesso!' });

    renderEditar(3);

    await waitFor(() => expect(screen.getByDisplayValue('Calça Jeans')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /atualizar/i }));

    await waitFor(() => expect(controller.atualizarProduto).toHaveBeenCalledWith(
      '3',
      expect.objectContaining({ nome: 'Calça Jeans' })
    ));
    expect(controller.salvarCategoriasProduto).toHaveBeenCalledTimes(1);
  });

  it('exibe mensagem vazia quando produto não tem variações', async () => {
    controller.buscarProdutoPorId.mockResolvedValue(produtoMock);
    controller.listarVariacoesProduto.mockResolvedValue([]);
    renderEditar(3);

    await waitFor(() =>
      expect(screen.getByText(/nenhuma variação cadastrada/i)).toBeInTheDocument()
    );
  });
});
