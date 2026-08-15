# Smart HAS API (ComunidadeConectada) — Backend

Backend Spring Boot para o app Smart HAS / ComunidadeConectada (Fase 5, Cap 1 — FIAP).
Implementa a especificação em `../../API_CONTRACT.md`.

> **Migração para Firebase (Fase 5, Cap 1):** este backend deixou de usar H2/Spring Data JPA e passou a
> persistir em **Firestore** (dados) + **Firebase Authentication** (identidade/senha). O contrato de API
> para os clientes não mudou — mesmos endpoints, mesmo fluxo `Bearer <token>` emitido pelo próprio backend
> — só os IDs deixaram de ser `Long` e passaram a ser Strings opacas (UID do Firebase Auth para `User`,
> ID de documento do Firestore para `Resource`/`Message`).

## Stack

- Java 21, Spring Boot 4.1.0
- Spring Web MVC, Spring Security (JWT stateless — jjwt 0.12.6)
- **Firebase Admin SDK** (`com.google.firebase:firebase-admin:9.4.1`) — Firestore para dados
- **Firebase Authentication** (Identity Toolkit) — dono da senha do usuário; o backend nunca guarda hash de senha
- `spring-data-commons` (só `Pageable`/`Page`, sem JPA) para os endpoints paginados
- springdoc-openapi 2.8.9 (Swagger UI)
- Lombok, Bean Validation

## Pré-requisitos para rodar

1. **JDK 21** instalado (o wrapper Maven baixa o Maven sozinho).
2. Um projeto Firebase com:
   - **Firestore Database** habilitado (usado neste projeto em modo de teste).
   - **Firebase Authentication** habilitado com o provedor **Email/Password**.
3. O arquivo de credenciais da service account salvo em
   **`backend/smarthas-api/config/firebase-service-account.json`** (já está no `.gitignore` — nunca commitar
   esse arquivo). O caminho é relativo ao diretório de trabalho do processo, então rode os comandos abaixo
   **a partir de `backend/smarthas-api`**.
4. A **Web API Key** do projeto Firebase configurada em `src/main/resources/application.properties`
   (`firebase.web-api-key=...`) — necessária porque o Admin SDK não tem uma API de verificação de senha
   server-side; o login chama a Identity Toolkit REST API (`accounts:signInWithPassword`) com essa chave.
5. O **Project ID** do Firebase em `firebase.project-id` (mesmo arquivo de properties).

## Como rodar

```bash
cd backend/smarthas-api
./mvnw spring-boot:run
```

ou, para gerar e rodar o jar:

```bash
./mvnw -DskipTests package
java -jar target/smarthas-api-0.0.1-SNAPSHOT.jar
```

A API sobe em `http://localhost:8080`.

Na primeira subida, um `CommandLineRunner` (`DataSeeder`) popula o Firestore/Firebase Auth (só roda se a
coleção `users` do Firestore estiver vazia) com:

- **Admin**: `admin@smarthas.com` / `admin123` (ROLE_ADMIN)
- **Demo (Yuri)**: `yuri@exemplo.com` / `123456` — reputação 4.9, 12 transações, verificado
- **João Silva**: `joao.silva@exemplo.com` / `123456`
- **Maria Oliveira**: `maria.oliveira@exemplo.com` / `123456`
- **Carlos Souza**: `carlos.souza@exemplo.com` / `123456`
- 3 recursos demo: Furadeira Bosch (João), Cadeira de Rodas (Maria), Livro Dom Casmurro (Carlos)

Se uma subida anterior já tiver criado parcialmente algum desses usuários no Firebase Authentication (mas
não no Firestore), o seeder detecta isso por email e reaproveita a conta em vez de falhar.

## Swagger / OpenAPI

- Swagger UI: `http://localhost:8080/swagger-ui/index.html` (também responde em `/swagger-ui.html`)
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

Use o botão "Authorize" no Swagger com `Bearer <token>` obtido em `/api/auth/login` para testar rotas autenticadas.

## Autenticação

- `POST /api/auth/register` (`{ name, email, password, address }`): cria o usuário no Firebase Authentication
  (`accounts:create`), grava o perfil em `Firestore/users/{uid}`, e emite **nosso próprio JWT** (jjwt, mesma
  estrutura de sempre) com o UID do Firebase como `subject`. Retorna `{ token, user }`, `201`.
- `POST /api/auth/login` (`{ email, password }`): valida a senha chamando a Identity Toolkit REST API
  (`accounts:signInWithPassword`) diretamente — o Admin SDK não oferece essa verificação. Em caso de sucesso,
  busca o perfil em `Firestore/users/{uid}` e emite o mesmo tipo de JWT. Retorna `{ token, user }`, `200`.
- Envie `Authorization: Bearer <token>` nas rotas protegidas — nada muda do ponto de vista do cliente.

### Sobre a implementação (bug real encontrado e a decisão de arquitetura que resultou)

O Firebase Admin SDK para Java (`firebase-admin`) usa internamente o `google-http-client`, que pede
respostas HTTP comprimidas em gzip. Nesta máquina de desenvolvimento (Windows), **toda** chamada feita por
esse cliente ao `identitytoolkit.googleapis.com` (`FirebaseAuth#createUser`, `#getUserByEmail`) falhava
consistentemente (100% de reprodução em 2 execuções completas + 6 retries por chamada) com
`java.util.zip.ZipException: Not in GZIP format` — sintoma clássico de um proxy/antivírus com inspeção TLS
que descomprime a resposta de forma transparente mas não remove o cabeçalho `Content-Encoding: gzip`.

Em vez de tentar contornar isso no transporte HTTP interno do Admin SDK (não há um hook exposto para isso),
a criação/consulta de usuários no Firebase Authentication foi implementada com chamadas REST diretas à
Identity Toolkit Admin API (`accounts:create`, `accounts:lookup`) usando `java.net.http.HttpClient` — a
mesma abordagem já usada para verificar a senha no login — autenticadas com um access token OAuth2 obtido a
partir da mesma service account (`GoogleCredentials`). Esse cliente HTTP não pede gzip por padrão e nunca
reproduziu o problema. Essa lógica está em `br.com.fiap.smarthas.security.FirebaseAuthAdminClient`; veja o
Javadoc da classe para o diagnóstico completo. O Firestore (que usa gRPC, não HTTP+gzip) não foi afetado.

## Principais endpoints

Ver `../../API_CONTRACT.md` para o contrato completo. Resumo:

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET/PUT /api/users/me`, `GET /api/users/{id}` (público), `GET /api/users` (ADMIN), `DELETE /api/users/{id}` (ADMIN)
- `GET /api/resources` (público, paginado/filtrável), `GET /api/resources/{id}` (público), `GET /api/resources/mine` (auth), `POST /api/resources` (auth), `PUT/DELETE /api/resources/{id}` (auth, dono ou ADMIN)
- `GET /api/messages/conversations`, `GET /api/messages/conversation/{userId}`, `POST /api/messages`, `PUT /api/messages/{id}/read` (todos auth)
- `GET /api/admin/stats` (ADMIN)

## Modelo de dados no Firestore

- `users/{uid}` (documento ID = Firebase Auth UID): `name`, `email`, `address`, `profileImageUrl`,
  `reputation`, `totalTransactions`, `isVerified`, `role`, `createdAt`. **Sem senha/hash** — a senha vive
  inteiramente no Firebase Authentication.
- `resources/{autoId}`: `title`, `description`, `category`, `condition`, `type`, `availability`, `imageUrl`,
  `latitude`, `longitude`, `offerantId`, `offerantName`, `createdAt`, `updatedAt`.
- `messages/{autoId}`: `senderId`, `receiverId`, `resourceId`, `content`, `timestamp`, `read`.

### Filtros e paginação (`GET /api/resources`)

`category`/`type`/`availability` são aplicados como `whereEqualTo` no Firestore. `q` (busca livre) e a
paginação em si são feitos **em memória** após buscar o conjunto já filtrado pelos campos exatos — decisão
pragmática, já que o Firestore não tem busca full-text nativa e o volume de dados deste projeto de faculdade
é pequeno. Documentado aqui em vez de implementar Algolia/Typesense/etc., fora de escopo para a tarefa.

## Verificação realizada (via curl, contra a aplicação rodando de verdade)

- `./mvnw -q compile` — sem erros.
- `./mvnw spring-boot:run` de fato executado; seed rodou com sucesso (`Seed data criada: 5 usuários, 3 recursos.`).
- `GET /api/resources` → `200`, mostra os 3 recursos seedados com IDs de documento do Firestore (String).
- `POST /api/auth/login` como admin (`admin@smarthas.com`/`admin123`) → `200`, `{token, user}` com `id` = UID do Firebase.
- `POST /api/auth/register` de um novo usuário → `201`; login imediato em seguida com as mesmas credenciais → `200`
  (confirma que o usuário foi mesmo criado no Firebase Authentication, não só simulado).
- `POST /api/resources` autenticado como o usuário recém-registrado → `201`, `offerantId`/`offerantName`
  resolvidos corretamente a partir do JWT.
- `GET /api/admin/stats` como ADMIN → `200`, contagens corretas (`totalUsers`, `totalResources`, `resourcesByCategory`).
- `GET /api/users?page=0&size=10` como ADMIN → `200`, paginação funcionando.
- `POST /api/messages` (admin → usuário) → `201`; `GET /api/messages/conversations` e
  `GET /api/messages/conversation/{userId}` refletindo a mensagem; `PUT /api/messages/{id}/read` → `200`, `read: true`.
- Swagger UI (`/swagger-ui/index.html`) e OpenAPI JSON (`/v3/api-docs`) → `200`.
- Dashboard Angular (`web/smarthas-admin`): `npx ng build` sem erros de TypeScript após ajustar `id: number` →
  `id: string` em `models.ts` e nos serviços; smoke-check via curl contra `http://localhost:8080/api`
  confirmando que login/listagem de usuários/listagem de recursos retornam o shape que o dashboard consome.

## Bugs encontrados e corrigidos durante a migração

1. **`java.util.zip.ZipException: Not in GZIP format` no Firebase Admin SDK** (ver seção "Sobre a
   implementação" acima) — resolvido roteando `createUser`/`getUserByEmail` por chamadas REST diretas com
   `java.net.http.HttpClient` em vez do transporte HTTP interno do `firebase-admin`.
2. **`Pageable`/`Page` pararam de resolver nos controllers (`No primary or single unique constructor found
   for interface org.springframework.data.domain.Pageable`)**: ao remover `spring-boot-starter-data-jpa`,
   a auto-configuração `SpringDataWebAutoConfiguration` do Spring Boot deixou de ativar automaticamente
   (ela é condicionada à presença de certas classes que vinham transitivamente pelo starter JPA). Corrigido
   adicionando `spring-data-commons` como dependência explícita e uma classe `WebConfig` com
   `@EnableSpringDataWebSupport` para forçar o registro do `PageableHandlerMethodArgumentResolver`.
3. **Ordem das regras de autorização** (já corrigido na versão H2 e mantido): as rotas específicas
   `GET /api/users/me` e `GET /api/resources/mine` precisam vir antes das regras `permitAll` mais genéricas
   em `SecurityConfig`, senão o Spring Security aplica a primeira regra que casar com o caminho.

## Decisões e desvios do contrato

- O contrato descreve `verified` no corpo da entidade `User`, mas a resposta é serializada como `isVerified`
  (mantido igual à versão anterior).
- CORS: liberado com `allowedOriginPatterns("*")` e `allowCredentials(true)`, cobrindo tanto
  `http://localhost:4200` (dashboard Angular) quanto chamadas do app mobile (sem origem).
- `GET /api/messages/conversation/{userId}` aceita `?resourceId=` opcional conforme contrato.
- IDs: `Long` → `String` em toda a API, conforme a nota de migração em `../../API_CONTRACT.md`.

## Known issues / limitações

- Sem testes automatizados (unitários/integração) — a verificação foi feita via curl manual contra a
  aplicação rodando, conforme pedido na tarefa.
- Busca por `q` em `/api/resources` é feita em memória (ver seção "Filtros e paginação" acima) — não escala
  para um volume grande de recursos, mas é adequado ao escopo deste projeto.
- O ambiente de desenvolvimento usado tem algum componente de rede (antivírus/proxy com inspeção TLS) que
  corrompe respostas HTTP gzip para `googleapis.com` quando usadas pelo `google-http-client` do Firebase
  Admin SDK — contornado conforme descrito acima, mas vale ter em mente ao rodar em outra máquina: se o
  login (que usa `java.net.http.HttpClient` puro) funcionar mas `FirebaseAuth` direto falhar, é o mesmo
  sintoma.
