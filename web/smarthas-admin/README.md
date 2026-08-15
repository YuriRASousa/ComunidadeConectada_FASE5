# Smart HAS — Admin Dashboard (Angular)

Dashboard administrativo web para o **ComunidadeConectada / Smart HAS**, consumindo a API REST
descrita em `API_CONTRACT.md` (backend Spring Boot em `http://localhost:8080/api`).

## Como rodar

```bash
npm install
npx ng serve
```

A aplicação sobe em `http://localhost:4200`.

Certifique-se de que o backend Spring Boot esteja rodando em `http://localhost:8080` (CORS já
liberado para `http://localhost:4200` conforme o contrato).

## Login

Use a conta de administrador semeada pelo backend:

- E-mail: `admin@smarthas.com`
- Senha: `admin123`

## Rotas

- `/` → redireciona para `/home`
- `/home` — página inicial pública com apresentação do app
- `/login` — formulário de login (e-mail/senha), grava o JWT no `localStorage`
- `/admin` — painel administrativo (protegido por guard de autenticação):
  - Cards de estatísticas (`GET /api/admin/stats`)
  - Tabela de usuários com exclusão (`GET`/`DELETE /api/users`)
  - Tabela de recursos com exclusão (`GET`/`DELETE /api/resources`)
  - Formulário de criação de recurso (`POST /api/resources`)

## Build

```bash
npx ng build
```

Gera o bundle de produção em `dist/smarthas-admin`.
