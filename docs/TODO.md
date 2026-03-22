# Planejamento de Implementação — Rede de Apoio (mHealth)

> Documento de referência para o desenvolvimento da API.
> Baseado em [`ideal-app.md`](file:///home/viier/projects/ifmg/mhealth/api_mhealth/docs/ideal-app.md) e [`schema.prisma`](file:///home/viier/projects/ifmg/mhealth/api_mhealth/prisma/schema.prisma).

---

## 1. Infraestrutura e Configuração Inicial

- [ ] Rodar migration inicial do Prisma (`npx prisma migrate dev`)
- [x] Gerar o Prisma Client (`npx prisma generate`)
- [x] Configurar variáveis de ambiente (`.env` com `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`)
- [x] Configurar estrutura de pastas (controllers, services, middlewares, validators)
- [x] Configurar middleware de tratamento de erros global
- [x] Configurar CORS e rate limiting

---

## 2. Autenticação e Gestão de Usuários

### 2.1 Registro e Login
- [x] Endpoint `POST /auth/register` — Registro com email/senha
- [x] Hash de senha (bcrypt)
- [x] Endpoint `POST /auth/login` — Login com email/senha
- [x] Geração e validação de JWT (access token + refresh token)
- [x] Endpoint `POST /auth/google` — Login/Registro via Google OAuth
- [x] Middleware de autenticação (`authMiddleware`) para rotas protegidas

### 2.2 Perfil do Usuário
- [x] Endpoint `GET /users/me` — Dados do usuário logado
- [x] Endpoint `PATCH /users/me` — Atualizar nome, telefone

---

## 3. Rede de Apoio (Core)

### 3.1 CRUD da Rede
- [ ] Endpoint `POST /networks` — Criar uma rede de apoio
- [ ] Endpoint `GET /networks` — Listar redes das quais o usuário faz parte
- [ ] Endpoint `GET /networks/:id` — Detalhes de uma rede (membros, resumo)
- [ ] Endpoint `PATCH /networks/:id` — Editar nome/descrição da rede
- [ ] Endpoint `DELETE /networks/:id` — Excluir rede (apenas criador)

### 3.2 Membros da Rede
- [ ] Endpoint `GET /networks/:id/members` — Listar membros e suas permissões
- [ ] Endpoint `PATCH /networks/:id/members/:memberId` — Editar permissões/role de um membro
- [ ] Endpoint `DELETE /networks/:id/members/:memberId` — Remover membro da rede
- [ ] Middleware de autorização por permissão (`checkPermission`)

### 3.3 Sistema de Convites
- [ ] Endpoint `POST /networks/:id/invitations` — Criar convite (com role e permissões propostas)
- [ ] Gerar link/token único para compartilhamento (WhatsApp, QR Code)
- [ ] Endpoint `GET /invitations/:token` — Visualizar detalhes do convite (público)
- [ ] Endpoint `POST /invitations/:token/accept` — Aceitar convite (Requer autenticação, cria `NetworkMember`)
- [ ] Endpoint `POST /invitations/:token/reject` — Rejeitar convite
- [ ] Endpoint `DELETE /invitations/:id` — Cancelar convite (apenas quem enviou)
- [ ] Lógica de expiração de convites

---

## 4. Medicações

### 4.1 CRUD de Medicamentos
- [ ] Endpoint `POST /networks/:id/medications` — Cadastrar medicamento
- [ ] Endpoint `GET /networks/:id/medications` — Listar medicamentos da rede
- [ ] Endpoint `GET /medications/:id` — Detalhes de um medicamento (com schedules)
- [ ] Endpoint `PATCH /medications/:id/toggle-buy` — Alternar o status "Precisa Comprar"
- [ ] Endpoint `GET /networks/:id/medications/to-buy` — Listar apenas medicamentos que precisam ser comprados
- [ ] Endpoint `DELETE /medications/:id` — Remover medicamento

### 4.2 Agendamentos (Schedules)
- [ ] Endpoint `POST /medications/:id/schedules` — Criar agendamento (intervalHours, intervalDays, specificTimes, startDate, endDate)
- [ ] Endpoint `PATCH /schedules/:id` — Editar agendamento
- [ ] Endpoint `DELETE /schedules/:id` — Remover agendamento
- [ ] Lógica de cálculo de próximos horários com base nos intervalos

### 4.3 Registro de Ingestão (Intakes)
- [ ] Endpoint `POST /medications/:id/intakes` — Registrar tomada (TAKEN, MISSED, LATE)
- [ ] Endpoint `GET /medications/:id/intakes` — Histórico de ingestão
- [ ] Endpoint `GET /medications/:id/pending` — Filtrar horários pendentes de confirmação (atrasos sem registro)

### 4.4 Alertas e Monitoramento
- [ ] Lógica de alerta de medicação atrasada (comparar horário atual × schedule)
- [ ] Alerta de "Precisa Comprar" (baseado no booleano do medicamento)

---

## 5. Consultas e Procedimentos

- [ ] Endpoint `POST /networks/:id/consultations` — Agendar consulta ou procedimento (type: CONSULTA | PROCEDIMENTO)
- [ ] Endpoint `GET /networks/:id/consultations` — Listar consultas/procedimentos (com filtro por type)
- [ ] Endpoint `GET /consultations/:id` — Detalhes
- [ ] Endpoint `PATCH /consultations/:id` — Editar consulta
- [ ] Endpoint `DELETE /consultations/:id` — Cancelar consulta
- [ ] Lógica de lembrete de consulta próxima

---

## 6. Ocorrências / Diário

- [ ] Endpoint `POST /networks/:id/occurrences` — Registrar ocorrência (QUEDA, MAL_ESTAR, OBSERVACAO)
- [ ] Endpoint `GET /networks/:id/occurrences` — Listar ocorrências (com filtros por tipo e período)
- [ ] Endpoint `GET /occurrences/:id` — Detalhes
- [ ] Endpoint `PATCH /occurrences/:id` — Editar ocorrência
- [ ] Endpoint `DELETE /occurrences/:id` — Remover ocorrência

---

## 7. Metas e Hábitos

### 7.1 CRUD de Hábitos
- [ ] Endpoint `POST /networks/:id/habits` — Criar hábito (nome, frequency, goal, unit)
- [ ] Endpoint `GET /networks/:id/habits` — Listar hábitos da rede
- [ ] Endpoint `GET /habits/:id` — Detalhes de um hábito (com records do dia/semana)
- [ ] Endpoint `PATCH /habits/:id` — Editar hábito
- [ ] Endpoint `DELETE /habits/:id` — Remover hábito

### 7.2 Registro de Hábitos
- [ ] Endpoint `POST /habits/:id/records` — Registrar conclusão (value, notes)
- [ ] Endpoint `GET /habits/:id/records` — Histórico de registros
- [ ] Cálculo de progresso (value acumulado vs goal por período)

---

## 8. Emergência / SOS

- [ ] Endpoint `POST /networks/:id/emergency` — Disparar alerta de emergência
- [ ] Lógica de notificação: enviar para todos membros com `alertLevel = ALL` ou `EMERGENCY_ONLY`
- [ ] Endpoint `GET /networks/:id/emergency` — Histórico de alertas
- [ ] Endpoint `PATCH /emergency/:id/resolve` — Resolver alerta (marca `resolvedAt`)
- [ ] Endpoint `PATCH /emergency/:id/cancel` — Cancelar alerta falso

---

## 9. Auditoria e Timeline

- [ ] Endpoint `GET /networks/:id/timeline` — Timeline unificada de ações da rede
  - [ ] Agregar dados de: `MedicationIntake`, `Occurrence`, `HabitRecord`, `EmergencyAlert`
  - [ ] Ordenar por data, com paginação
  - [ ] Exibir "quem fez o quê" (registrar → User)

---

## 10. Dashboard e Relatórios

### 10.1 Dashboard do Idoso
- [ ] Endpoint `GET /networks/:id/dashboard/patient` — "O que fazer agora?"
  - [ ] Próximos medicamentos a tomar
  - [ ] Hábitos pendentes do dia
  - [ ] Consultas próximas

### 10.2 Dashboard do Responsável
- [ ] Endpoint `GET /networks/:id/dashboard/caregiver` — Visão geral de monitoramento
  - [ ] Taxa de adesão do dia/semana
  - [ ] Últimas ocorrências
  - [ ] Alertas ativos

### 10.3 Relatório de Adesão
- [ ] Endpoint `GET /networks/:id/reports/adherence` — Relatório de adesão a medicamentos
  - [ ] Percentual de medicamentos tomados no prazo
  - [ ] Lista de medicamentos com menor adesão
- [ ] Endpoint `GET /networks/:id/reports/habits` — Relatório de hábitos
  - [ ] Progresso semanal/mensal por hábito

---

## 11. Notificações (Push)

- [ ] Integração com serviço de push notifications (Firebase Cloud Messaging ou similar)
- [ ] Armazenar device tokens (`DeviceToken` model ou campo no User)
- [ ] Disparar notificações para:
  - [ ] Lembrete de medicação
  - [ ] Medicação atrasada
  - [ ] Consulta próxima
  - [ ] Alerta de emergência (SOS)
  - [ ] Estoque baixo
- [ ] Respeitar `alertLevel` de cada membro (ALL, EMERGENCY_ONLY, NONE)

---

## 12. Ideias Futuras (Backlog)

> Funcionalidades mencionadas no documento mas fora do escopo inicial.

- [ ] Scan e OCR de receitas médicas
- [ ] Agenda compartilhada (escalas de acompanhamento)
- [ ] Divisão de custos de medicamentos
- [ ] Timeline visual com fotos
- [ ] Modo profissional (multi-redes)
- [ ] Relatórios exportáveis em PDF
- [ ] Pasta de artigos / blog educativo
