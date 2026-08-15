# Smart HAS / ComunidadeConectada — Contrato de API (Fase 5, Cap 1)

Backend: Spring Boot (Java 21), Spring Web MVC + Firebase Admin SDK (Firestore para dados, Firebase Authentication para identidade/senha) + Spring Security (JWT próprio emitido pelo backend após validar a senha no Firebase — os clientes continuam usando o mesmo fluxo `Bearer <token>` de sempre, nada muda no consumo da API), documentado com springdoc-openapi (Swagger UI em `/swagger-ui.html`).

> **Atualização (migração para Firebase):** os IDs de entidades deixaram de ser `Long` sequenciais (H2) e passaram a ser **Strings opacas** (UID do Firebase Authentication para `User`, ID de documento do Firestore para `Resource`/`Message`). Todo campo `id`/`*Id` deste contrato deve ser tratado como `String` pelos clientes — o Flutter e o React Native já tratavam IDs como String desde o início; o dashboard Angular precisa ajustar suas interfaces TypeScript (`id: number` → `id: string`).

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

### Admin (dashboard Angular)
- `GET /api/admin/stats` (ADMIN) → `{ totalUsers, totalResources, totalMessages, resourcesByCategory: {categoria: count} }`

## Erros

Formato padrão (via `@ControllerAdvice`):
```json
{ "timestamp": "...", "status": 404, "error": "Not Found", "message": "...", "path": "/api/resources/99" }
```

## CORS

Liberado para `http://localhost:4200` (dashboard Angular em dev) e demais origens do app mobile (sem restrição de origem para chamadas nativas).

## Papéis (roles)

- `USER`: padrão no registro.
- `ADMIN`: promovido manualmente (seed inicial cria 1 admin: `admin@smarthas.com` / `admin123`) — usado para logar no dashboard Angular.
