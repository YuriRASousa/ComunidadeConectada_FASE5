# Smart HAS / ComunidadeConectada — Contrato de API (Fase 6)

Backend: Spring Boot (Java 21), Spring Web MVC + Spring JDBC sobre **Oracle** + Spring Security (JWT próprio, senha em hash BCrypt na tabela `SH_USUARIO`), documentado com springdoc-openapi (Swagger UI em `/swagger-ui.html`). As regras de negócio de empréstimo e devolução ficam em procedures PL/SQL; o backend chama a procedure e traduz o erro do Oracle para o status HTTP.

> **Atualização (Fase 6, migração para Oracle):** o Firebase saiu por completo. Os IDs continuam sendo **String** no JSON (agora é o NUMBER da sequence convertido), então nada muda para o aplicativo React Native nem para o painel Angular. O que entrou de novo neste contrato são as rotas de empréstimo e as rotas de rotina/indicador do painel, listadas abaixo.

Base URL local: `http://localhost:8080/api`

## Autenticação

JWT Bearer token. Enviar `Authorization: Bearer <token>` em todas as rotas autenticadas.

- `POST /api/auth/register` — body `{ name, email, password, address }` → 201 `{ token, user }`
- `POST /api/auth/login` — body `{ email, password }` → 200 `{ token, user }`

## Entidades

### User
```
id: Long
name: String
email: String (único)
address: String
profileImageUrl: String?
reputation: Double (default 5.0)
totalTransactions: Integer (default 0)
verified: Boolean (default false)
role: "USER" | "ADMIN"
createdAt: Instant
```
(`password` nunca é retornado nas respostas — apenas o hash é persistido.)

### Resource
```
id: Long
title: String
description: String
category: "FERRAMENTAS" | "SAUDE" | "EDUCACAO" | "ALIMENTOS" | "ELETRONICOS" | "OUTROS"
condition: "NOVO" | "EXCELENTE" | "BOM" | "REGULAR"
type: "EMPRESTIMO" | "TROCA" | "DOACAO"
availability: "DISPONIVEL" | "RESERVADO" | "INDISPONIVEL"
imageUrl: String?
latitude: Double?
longitude: Double?
offerantId: Long
offerantName: String
createdAt: Instant
updatedAt: Instant
```

### Message
```
id: Long
senderId: Long
receiverId: Long
resourceId: Long?
content: String
timestamp: Instant
read: Boolean
```

## Endpoints

### Users
- `GET /api/users/me` (auth) → User autenticado
- `PUT /api/users/me` (auth) → body `{ name?, address?, profileImageUrl? }`
- `GET /api/users/{id}` (público) → perfil público resumido
- `GET /api/users` (ADMIN, paginado: `?page=&size=`) → lista para o dashboard
- `DELETE /api/users/{id}` (ADMIN)

### Resources
- `GET /api/resources` (público, paginado, filtros `?category=&type=&availability=&q=`)
- `GET /api/resources/{id}` (público)
- `GET /api/resources/mine` (auth) → recursos do usuário logado
- `POST /api/resources` (auth)
- `PUT /api/resources/{id}` (auth — dono ou ADMIN)
- `DELETE /api/resources/{id}` (auth — dono ou ADMIN)

### Messages
- `GET /api/messages/conversations` (auth) → resumo por conversa (outro usuário, última mensagem, não lidas)
- `GET /api/messages/conversation/{userId}` (auth, filtro opcional `?resourceId=`)
- `POST /api/messages` (auth) → body `{ receiverId, resourceId?, content }`
- `PUT /api/messages/{id}/read` (auth)

### Emprestimos (Fase 6 — cada rota termina em uma procedure ou function PL/SQL)
- `POST /api/emprestimos` (auth) → body `{ resourceId, days? }` → 201 `{ id, message }` — executa `PRC_SH_REGISTRA_EMPRESTIMO`
- `POST /api/emprestimos/{id}/devolucao` (auth) → body opcional `{ rating?, comment? }` → 200 `{ id, message }` — executa `PRC_SH_REGISTRA_DEVOLUCAO`
- `GET /api/emprestimos/meus` (auth) → lista dos empréstimos em que o usuário é dono ou solicitante
- `GET /api/emprestimos/indice-circularidade` (auth, `?anoMes=AAAAMM`) → `{ anoMes, indiceCircularidade }` — `FN_SH_INDICE_CIRCULARIDADE`
- `GET /api/emprestimos/ficha/{resourceId}` (auth) → `{ ficha }` — `FN_SH_FICHA_RECURSO`
- `GET /api/resources/proximos` (público, `?lat=&lon=&limit=`) → vitrine ordenada por distância — `FN_SH_DISTANCIA_KM`

O objeto de empréstimo devolvido é
`{ id, resourceId, resourceTitle, borrowerId, borrowerName, ownerName, requestedAt, dueAt, returnedAt, status, daysLate }`,
com `status` em `SOLICITADO | ATIVO | DEVOLVIDO | CANCELADO`.

### Admin (dashboard Angular)
- `GET /api/admin/stats` (ADMIN) → `{ totalUsers, totalResources, totalMessages, resourcesByCategory: {categoria: count} }`
- `GET /api/admin/emprestimos` (ADMIN) → empréstimos solicitados ou ativos, ordenados pelo vencimento
- `GET /api/admin/alertas` (ADMIN) → `[{ id, type, referenceId, severity, message, createdAt, resolved }]`
- `POST /api/admin/alertas/{id}/resolver` (ADMIN) → 204
- `POST /api/admin/rotinas/detectar-atrasos` (ADMIN) → `{ routine, affectedRows, message }` — `PRC_SH_DETECTA_ATRASOS`
- `POST /api/admin/rotinas/resumo-mensal` (ADMIN, `?anoMes=AAAAMM`) → `{ routine, affectedRows, message }` — `PRC_SH_GERA_RESUMO_MENSAL`
- `GET /api/admin/resumo-mensal` (ADMIN, `?anoMes=AAAAMM`) → linhas de `SH_RESUMO_USUARIO_MES`

## Erros

Formato padrão (via `@ControllerAdvice`):
```json
{ "timestamp": "...", "status": 404, "error": "Not Found", "message": "...", "path": "/api/resources/99" }
```

Regra recusada por procedure PL/SQL (`RAISE_APPLICATION_ERROR` entre -20000 e -20999) chega ao cliente no
mesmo formato, com a mensagem escrita dentro do banco e o status conforme o código: -20201/-20206 → 404,
-20202 a -20205, -20207 e -20208 → 409, demais → 400.

## CORS

Liberado para `http://localhost:4200` (dashboard Angular em dev) e demais origens do app mobile (sem restrição de origem para chamadas nativas).

## Papéis (roles)

- `USER`: padrão no registro.
- `ADMIN`: promovido manualmente (a carga `database/02_seed.sql` cria 1 admin: `admin@smarthas.com`) — usado para logar no dashboard Angular.
