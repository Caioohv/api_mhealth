# Notas de Implementação - Autenticação (Tarefa 2.1)

## O que foi feito
- [x] Implementação do `AuthService.js`: Lógica de registro, login (bcrypt), JWT e Google OAuth.
- [x] Implementação do `AuthController.js`: Handlers de rota.
- [x] Implementação do `authMiddleware.js`: Validação de JWT e injeção do usuário no `req.user`.
- [x] Criação de rotas em `app/routes/auth.js`.
- [x] Configuração centralizada do Prisma em `app/config/prisma.js`.
- [x] Instalação de dependências: `bcryptjs`, `jsonwebtoken`, `google-auth-library`.
- [x] Integração no `app/config/express.js`.
- [x] Criação de `docs/curl_commands.md` para testes.

## Status Atual
A implementação lógica está completa, mas o servidor está falhando ao iniciar devido a um erro de inicialização do Prisma Client (versão 7.4.2).

### Problema Identificado
- **Erro**: `PrismaClientInitializationError: PrismaClient needs to be constructed with a non-empty, valid PrismaClientOptions`.
- **Tentativas de correção**:
    1. Passar `{}` no construtor do `PrismaClient`. Resultou em erro de `engineType` (exigindo adapter ou accelerateUrl).
    2. Adicionar `engineType = "library"` no `generator client` do `schema.prisma` e rodar `npx prisma generate`.
    3. Adicionar `PRISMA_CLIENT_ENGINE_TYPE=library` no `.env`.
- O erro persiste mesmo com essas alterações em um ambiente Node.js padrão.

## Próximos Passos
1. **Resolver Inicialização do Prisma**: Investigar se a nova `prisma.config.ts` do Prisma 7 está interferindo na detecção do ambiente.
2. **Migrações**: Rodar `npx prisma migrate dev` assim que um servidor MySQL estiver acessível (localhost:3306).
3. **Verificação**: Utilizar os comandos em `docs/curl_commands.md` para testar os endpoints.
