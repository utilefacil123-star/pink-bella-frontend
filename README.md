# Pink Bella — Frontend

Interface web do sistema de gestão de pedidos Pink Bella.

- **Framework**: React 18 + Create React App
- **Estilo**: Bootstrap 5 + CSS Variables (temas)
- **Roteamento**: React Router v7
- **HTTP**: Axios (`src/services/api.js`)
- **Produção**: deploy na Vercel

## Requisitos

- Node.js 18+
- Backend rodando (local ou Railway)

## Instalação e execução local

```bash
npm install
npm start        # http://localhost:3001
```

## Build de produção

```bash
npm run build
```

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do frontend:

```
REACT_APP_API_URL=http://localhost:3000
```

Em produção (Vercel), configure:

```
REACT_APP_API_URL=https://pink-bella-backend-production.up.railway.app
```

## Estrutura

```
src/
  App.js              — roteador principal, DashboardLayout
  context/
    ThemeContext.js   — temas: pink-dark / pink-light / dark-blue
  services/
    api.js            — instância axios apontando para o backend
  pages/
    Home/             — dashboard com gráficos
    Clientes/         — listagem, novo, editar
    Compras/          — listagem, nova, editar, detalhe
    Produtos/
    Frete/            — cálculo e etiquetas Melhor Envio
    Configuracoes/
  components/
    Sidebar.jsx
    Header.jsx
```

## Deploy

O projeto faz deploy automático na Vercel a partir do branch `main` do repositório `utilefacil123-star/pink-bella-frontend`.
