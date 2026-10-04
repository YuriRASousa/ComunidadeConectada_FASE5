# Smart HAS API (ComunidadeConectada) — Backend

Backend Spring Boot do Smart HAS / ComunidadeConectada (FIAP). Implementa a especificação em
`../../API_CONTRACT.md`.

> **Fase 6 — migração para Oracle.** O backend deixou de usar Firebase (Firestore + Firebase
> Authentication) e passou a persistir em **Oracle**, com as regras de negócio dentro do banco, em
> procedures e functions PL/SQL. O contrato de API não mudou para os clientes: mesmos endpoints, mesmo
> fluxo `Bearer <token>` emitido pelo próprio backend, IDs continuam como String (agora o NUMBER da
> sequence, convertido). O que mudou é quem decide: uma solicitação de empréstimo é validada pela
> procedure, não pelo Java.

## Stack

- Java 21, Spring Boot 4.1.0
- Spring Web MVC, Spring Security (JWT stateless — jjwt 0.12.6), BCrypt para a senha
- **Spring JDBC** (`JdbcTemplate`, `SimpleJdbcCall`) e driver **ojdbc11** para o Oracle
- `spring-data-commons` (só `Pageable`/`Page`, sem JPA) para os endpoints paginados
- springdoc-openapi (Swagger UI), Lombok, Bean Validation

## Pré-requisitos

1. **JDK 21** (o wrapper Maven baixa o Maven sozinho).
2. Acesso a um schema Oracle. No ambiente da FIAP: `oracle.fiap.com.br:1521:ORCL`, usuário `RM<matrícula>`.
3. Os scripts de `../../database/` executados na ordem:

```
01_ddl.sql  →  02_seed.sql  →  03_log.sql  →  04_functions.sql  →  05_procedures.sql
```

`06_consultas.sql` é opcional e serve para conferir a instalação. `99_drop.sql` remove tudo para recomeçar.

## Credenciais

Nada de credencial no repositório. Copie o arquivo de exemplo e preencha:

```bash
cd backend/smarthas-api
cp config/oracle.properties.example config/oracle.properties
```

`config/oracle.properties` está no `.gitignore`. As mesmas informações também podem vir de variáveis de
ambiente: `ORACLE_URL`, `ORACLE_USER`, `ORACLE_PASSWORD` (e `JWT_SECRET` para o segredo do token).

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

A API sobe em `http://localhost:8080`. Não há mais seeder no código: os dados de exemplo vêm do
`02_seed.sql` (8 moradores, 20 recursos, 15 empréstimos, avaliações e mensagens).

## Comunicação segura

A avaliação da fase anterior apontou que o projeto trafegava em HTTP puro. Nesta fase o backend passou a
falar TLS, e o transporte virou uma questão de perfil, não de reescrita:

```bash
config\gerar_certificado.bat                  # cria config/smarthas-local.p12 (fora do git)
./mvnw spring-boot:run -Dspring-boot.run.profiles=https
```

- `application-https.properties` liga `server.ssl`, sobe na porta **8443** e aceita **apenas TLS 1.2 e 1.3**.
- O certificado é autoassinado e vale só para desenvolvimento. Em produção entra um certificado emitido por
  uma autoridade certificadora, apontando `SSL_KEYSTORE` e `SSL_KEYSTORE_PASSWORD` para ele: nada mais muda.
- Com TLS ativo, as respostas passam a levar `Strict-Transport-Security` (um ano, incluindo subdomínios).
  Em HTTP o cabeçalho fica desligado de propósito, porque ali ele não protege nada.
- O painel Angular aponta para `https://localhost:8443/api` no build de produção
  (`environment.prod.ts`); o app aceita `EXPO_PUBLIC_API_URL` para o mesmo fim.

O CORS também deixou de ser curinga. Antes era `allowedOriginPatterns("*")` junto com
`allowCredentials(true)`, a combinação mais permissiva possível. Agora a lista é fechada e vem de
`smarthas.cors.allowed-origins` (sobrescrevível por `CORS_ORIGINS`), com as origens do painel e do app.
Requisição sem cabeçalho `Origin`, como a do app nativo, não passa por CORS e continua funcionando.

Verificação feita com a aplicação no ar:

```
protocolo negociado: TLSv1.3   cifra: TLS_AES_256_GCM_SHA384
Strict-Transport-Security: max-age=31536000 ; includeSubDomains
Origin http://localhost:4200        -> 200 (Access-Control-Allow-Origin devolvido)
Origin http://site-malicioso.example -> 403
handshake forçado em TLS 1.1        -> recusado
```

## Swagger / OpenAPI

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

Use "Authorize" com `Bearer <token>` obtido em `/api/auth/login` para testar as rotas protegidas.

## Autenticação

- `POST /api/auth/register`: grava o morador em `SH_USUARIO` com o hash BCrypt da senha
  (`DS_SENHA_HASH`) e emite o JWT.
- `POST /api/auth/login`: lê o hash pelo e-mail, confere com `BCryptPasswordEncoder#matches` e emite o
  mesmo tipo de JWT. Não há mais chamada HTTP externa no login.
- O `subject` do token é o id do usuário no Oracle; `CustomUserDetailsService` resolve o perfil por esse id.

## Camadas

```
Controller  →  Service  →  Repository (JdbcTemplate / SimpleJdbcCall)  →  Oracle
```

- `JdbcUserRepository`, `JdbcResourceRepository`, `JdbcMessageRepository`: CRUD com SQL explícito,
  paginação com `OFFSET ? ROWS FETCH NEXT ? ROWS ONLY` e filtros montados no `WHERE`.
- `JdbcEmprestimoRepository`: ponte com o PL/SQL. Declara os parâmetros na mão
  (`withoutProcedureColumnMetaDataAccess`), porque ler metadados do dicionário exige privilégio extra no
  schema do aluno.
- `JdbcPainelRepository`: leituras do painel que saem das tabelas alimentadas pelas rotinas
  (`SH_ALERTA` e `SH_RESUMO_USUARIO_MES`).

## Endpoints que chegam ao PL/SQL

| Rota | Objeto no Oracle |
| --- | --- |
| `POST /api/emprestimos` | `PRC_SH_REGISTRA_EMPRESTIMO` |
| `POST /api/emprestimos/{id}/devolucao` | `PRC_SH_REGISTRA_DEVOLUCAO` |
| `GET /api/emprestimos/meus` | consulta sobre `SH_EMPRESTIMO` |
| `GET /api/emprestimos/indice-circularidade` | `FN_SH_INDICE_CIRCULARIDADE` |
| `GET /api/emprestimos/ficha/{resourceId}` | `FN_SH_FICHA_RECURSO` |
| `GET /api/resources/proximos` | `FN_SH_DISTANCIA_KM` |
| `POST /api/admin/rotinas/detectar-atrasos` | `PRC_SH_DETECTA_ATRASOS` |
| `POST /api/admin/rotinas/resumo-mensal` | `PRC_SH_GERA_RESUMO_MENSAL` |
| `GET /api/admin/alertas` | `SH_ALERTA` |
| `GET /api/admin/resumo-mensal` | `SH_RESUMO_USUARIO_MES` |

Demais endpoints (usuários, recursos, mensagens, `/api/admin/stats`) seguem iguais aos da fase anterior.

## Erros de negócio

As procedures recusam operação inválida com `RAISE_APPLICATION_ERROR` entre -20000 e -20999.
`OracleErrors` extrai só a primeira linha da mensagem (descartando a pilha `ORA-06512`) e
`GlobalExceptionHandler` converte o código em status HTTP:

| Código | Situação | HTTP |
| --- | --- | --- |
| -20201 | Recurso ou solicitante inexistente | 404 |
| -20202 | Solicitante inativo | 409 |
| -20203 | O solicitante é o dono do item | 409 |
| -20204 | Item é troca ou doação, não empréstimo | 409 |
| -20205 | Item reservado ou indisponível | 409 |
| -20206 | Empréstimo inexistente | 404 |
| -20207 | Empréstimo já devolvido ou cancelado | 409 |
| -20208 | Avaliação já registrada por este morador | 409 |
| -20101 | Competência fora do formato AAAAMM | 400 |

O texto que chega na tela do morador é o texto escrito dentro da procedure.

## Modelo de dados

Nove tabelas com prefixo `SH_`: `sh_categoria`, `sh_usuario`, `sh_recurso`, `sh_mensagem`,
`sh_emprestimo`, `sh_avaliacao`, `sh_alerta`, `sh_resumo_usuario_mes` e `sh_log_sistema`. O DER está em
`docs/DER_SmartHAS_Fase6.png` e o dicionário no documento da fase.

Pontos que o modelo relacional passou a garantir e o Firestore não garantia: categoria só existe se estiver
em `SH_CATEGORIA`, e-mail é único, nota vai de 1 a 5, status e disponibilidade são validados por `CHECK`, e
o resumo tem uma linha por morador e competência (chave composta).

Exclusão de usuário é lógica (`ST_USUARIO = 'I'`): empréstimos e avaliações precisam continuar existindo
para os indicadores fecharem.

## Known issues / limitações

- Sem testes automatizados além do `contextLoads`. A verificação é manual, contra a aplicação rodando.
- As duas rotinas (`detectar-atrasos` e `resumo-mensal`) são disparadas pelo painel. Agendá-las com
  `DBMS_SCHEDULER` é o próximo passo natural.
- O pool Hikari está limitado a 5 conexões porque o schema do aluno na FIAP tem limite baixo de sessões.
