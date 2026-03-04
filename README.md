# API mHealth

API simples desenvolvida com Node.js e Express.

## Estrutura do Projeto

```
api_mhealth/
├── config/
│   └── express.js       # Configuração do Express e middlewares
├── routes/
│   ├── public.js        # Rotas públicas (healthcheck, etc)
│   └── private.js       # Rotas privadas
├── index.js             # Ponto de entrada da aplicação
└── package.json         # Dependências e scripts
```

## Instalação

```bash
npm install
```

## Executar

```bash
# Modo produção
npm start

# Modo desenvolvimento (com nodemon)
npm run dev
```

## Rotas Disponíveis

### Públicas
- `GET /` - Rota de boas-vindas
- `GET /health` - Healthcheck da aplicação

### Privadas
- `GET /api/users` - Lista de usuários
- `GET /api/dashboard` - Dashboard

## Tecnologias

- **Express** - Framework web
- **Morgan** - Logger de requisições HTTP
- **Body-parser** - Parser de body das requisições
- **CORS** - Habilitação de CORS
- **Nodemon** - Auto-reload em desenvolvimento
