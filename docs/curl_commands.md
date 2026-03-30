# Curl Commands — Rede de Apoio API

> Substitua `$TOKEN`, `$TOKEN2`, `<NETWORK_ID>`, `<MEMBER_ID>`, `<INVITATION_TOKEN>`, `<INVITATION_ID>` pelos valores retornados.

## Autenticação

```bash
# Registrar usuário 1
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@test.com","password":"123456","name":"User One"}' | jq

# Registrar usuário 2
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user2@test.com","password":"123456","name":"User Two"}' | jq

# Login — salvar token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@test.com","password":"123456"}' | jq -r '.accessToken')

TOKEN2=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user2@test.com","password":"123456"}' | jq -r '.accessToken')
```

## 3.1 CRUD da Rede

```bash
# POST /networks — Criar rede
curl -s -X POST http://localhost:3000/api/networks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Rede Dona Maria","description":"Cuidados diários"}' | jq

# GET /networks — Listar redes
curl -s http://localhost:3000/api/networks \
  -H "Authorization: Bearer $TOKEN" | jq

# GET /networks/:id — Detalhes
curl -s http://localhost:3000/api/networks/<NETWORK_ID> \
  -H "Authorization: Bearer $TOKEN" | jq

# PATCH /networks/:id — Editar
curl -s -X PATCH http://localhost:3000/api/networks/<NETWORK_ID> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Rede Atualizada"}' | jq

# DELETE /networks/:id — Excluir
curl -s -X DELETE http://localhost:3000/api/networks/<NETWORK_ID> \
  -H "Authorization: Bearer $TOKEN" -w "\n%{http_code}\n"
```

## 3.2 Membros da Rede

```bash
# GET /networks/:id/members — Listar membros
curl -s http://localhost:3000/api/networks/<NETWORK_ID>/members \
  -H "Authorization: Bearer $TOKEN" | jq

# PATCH /networks/:id/members/:memberId — Editar permissões
curl -s -X PATCH http://localhost:3000/api/networks/<NETWORK_ID>/members/<MEMBER_ID> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"medicationAccess":"VIEW","alertLevel":"EMERGENCY_ONLY"}' | jq

# DELETE /networks/:id/members/:memberId — Remover membro
curl -s -X DELETE http://localhost:3000/api/networks/<NETWORK_ID>/members/<MEMBER_ID> \
  -H "Authorization: Bearer $TOKEN" -w "\n%{http_code}\n"
```

## 3.3 Sistema de Convites

```bash
# POST /networks/:id/invitations — Criar convite
curl -s -X POST http://localhost:3000/api/networks/<NETWORK_ID>/invitations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"proposedRole":"RESPONSAVEL","medicationAccess":"VIEW","invitedEmail":"user2@test.com"}' | jq

# GET /invitations/:token — Visualizar (público)
curl -s http://localhost:3000/api/invitations/<INVITATION_TOKEN> | jq

# POST /invitations/:token/accept — Aceitar (user2)
curl -s -X POST http://localhost:3000/api/invitations/<INVITATION_TOKEN>/accept \
  -H "Authorization: Bearer $TOKEN2" | jq

# POST /invitations/:token/reject — Rejeitar
curl -s -X POST http://localhost:3000/api/invitations/<INVITATION_TOKEN>/reject \
  -H "Authorization: Bearer $TOKEN2" -w "\n%{http_code}\n"

# DELETE /invitations/:id — Cancelar (quem enviou)
curl -s -X DELETE http://localhost:3000/api/invitations/<INVITATION_ID> \
  -H "Authorization: Bearer $TOKEN" -w "\n%{http_code}\n"
```
