# Smart HAS - Comunidade Conectada

[![CI/CD](https://github.com/YuriRASousa/ComunidadeConectada_FASE5/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/YuriRASousa/ComunidadeConectada_FASE5/actions/workflows/ci-cd.yml)

Plataforma para moradores de uma mesma regiao compartilharem recursos (ferramentas, itens de saude, livros, alimentos) por emprestimo, troca ou doacao. Projeto da FIAP, Sociedade 5.0.

| Parte | Tecnologia | Pasta |
|---|---|---|
| Aplicativo | React Native (Expo) | `mobile-react-native/SmartHASApp` |
| API | Spring Boot 4, Java 21, JDBC | `backend/smarthas-api` |
| Painel administrativo | Angular 20 | `web/smarthas-admin` |
| Banco | Oracle, regras de negocio em pacotes PL/SQL | `database` |
| Pipeline | GitHub Actions | `.github/workflows/ci-cd.yml` |

## Fase 7: consolidacao

- **PL/SQL**: quatro pacotes (`PKG_SH_LOG`, `PKG_SH_CALCULOS`, `PKG_SH_EMPRESTIMO`, `PKG_SH_ADMIN`), tres triggers de automacao e auditoria e SQL dinamico seguro. Documentacao dos objetos em [`database/README.md`](database/README.md).
- **CI/CD**: a cada push o pipeline sobe um Oracle Free, instala o schema, compila o backend, roda 14 testes de integracao contra o banco, compila o painel e o app, e na `main` faz um teste de fumaca da API empacotada e publica a imagem Docker.

## Rodar tudo local

```bash
docker compose up --build           # Oracle Free + API
pip install oracledb
ORACLE_USER=smarthas ORACLE_PASSWORD=smarthas ORACLE_DSN=localhost:1521/FREEPDB1 \
  python database/executar_scripts.py   # tabelas, carga, pacotes e triggers
```

Sem Docker, aponte `backend/smarthas-api/config/oracle.properties` (modelo em `oracle.properties.example`) para o seu Oracle e rode `./mvnw spring-boot:run`.

## Testes

```bash
cd backend/smarthas-api
SMARTHAS_DB_TESTS=true ./mvnw verify    # testes de integracao exigem um Oracle com o schema instalado
```

Usuarios da carga inicial: `admin@smarthas.com` / `admin123` e moradores com senha `123456`.
