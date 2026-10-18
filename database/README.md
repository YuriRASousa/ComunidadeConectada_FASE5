# Banco Oracle do Smart HAS

Schema `SH_` em Oracle (19c na FIAP, 23ai Free no pipeline). A regra de negocio mora no banco, em pacotes PL/SQL; o backend Spring Boot apenas chama.

## Instalar

```bash
pip install oracledb
# credenciais: variaveis de ambiente (ORACLE_USER, ORACLE_PASSWORD, ORACLE_DSN=host:porta/servico)
# ou o arquivo backend/smarthas-api/config/oracle.properties
python database/executar_scripts.py             # banco vazio: instala 01 a 07
python database/executar_scripts.py --recriar   # apaga tudo (99_drop.sql) e instala de novo
python database/executar_scripts.py --migrar    # banco que ja estava na Fase 6
python database/executar_scripts.py --remover-avulsas   # ultimo passo da migracao
python database/executar_scripts.py --verificar # so confere se esta tudo VALID
```

O script divide cada arquivo em comandos, executa na ordem e termina com codigo diferente de zero se qualquer comando falhar ou se sobrar objeto invalido. E o mesmo que o pipeline usa.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `01_ddl.sql` | 11 tabelas, 10 sequences e indices |
| `02_seed.sql` | carga de dados simulados (moradores, itens, emprestimos, um atrasado de proposito) |
| `03_pkg_log.sql` | `PKG_SH_LOG` |
| `04_pkg_calculos.sql` | `PKG_SH_CALCULOS` |
| `05_pkg_emprestimo.sql` | `PKG_SH_EMPRESTIMO` |
| `06_pkg_admin.sql` | `PKG_SH_ADMIN` (inclui o SQL dinamico) |
| `07_triggers.sql` | 3 triggers |
| `08_consultas.sql` | roteiro de demonstracao em SQL |
| `99_drop.sql` | remove tudo |
| `migracao_f6_para_f7.sql`, `remover_rotinas_avulsas.sql` | passagem da Fase 6 (rotinas soltas) para a Fase 7 (pacotes) |
| `demo_consultas.py`, `demo_fase7.py` | demonstracoes interativas para o video |

## Objetos da Fase 7

### Pacotes

| Pacote | Conteudo | Valor para o sistema |
|---|---|---|
| `PKG_SH_LOG` | `GRAVA` (transacao autonoma) | todo erro das rotinas deixa rastro, mesmo quando a operacao sofre rollback |
| `PKG_SH_CALCULOS` | `REPUTACAO`, `INDICE_CIRCULARIDADE`, `FICHA_RECURSO`, `DISTANCIA_KM` | calculos reutilizaveis dentro de SELECT; app, painel e relatorio mostram o mesmo numero |
| `PKG_SH_EMPRESTIMO` | `REGISTRA_EMPRESTIMO`, `REGISTRA_DEVOLUCAO`, `ATUALIZA_REPUTACAO`, `DETECTA_ATRASOS`; constantes de prazo e de severidade | ciclo de vida do emprestimo com as regras no banco, parametros de negocio num lugar so |
| `PKG_SH_ADMIN` | `GERA_RESUMO_MENSAL` (BULK COLLECT + FORALL), `CONTAGEM_LINHAS`, `PRC_VOLUMETRIA`, `BUSCA_RECURSOS` | consolidacao mensal e consultas em tempo real (SQL dinamico) |

### Triggers

| Trigger | Evento | O que faz |
|---|---|---|
| `TRG_SH_EMPRESTIMO_BU` | BEFORE UPDATE OF `st_emprestimo` | estado final nao volta atras (ORA-20301, 20302); preenche `dt_retirada` e `dt_devolucao` sozinha |
| `TRG_SH_EMPRESTIMO_AUD` | AFTER INSERT/UPDATE/DELETE | grava `SH_AUDITORIA` (antes e depois); cancelar o emprestimo libera o item na vitrine |
| `TRG_SH_USUARIO_AUD` | AFTER UPDATE OF `ds_papel`, `st_usuario`, `fl_verificado` | audita mudanca de papel e de status; nunca le a senha |

### SQL dinamico

| Rotina | Tecnica | Defesa contra injecao |
|---|---|---|
| `CONTAGEM_LINHAS(tabela)` | `EXECUTE IMMEDIATE` | o nome tem de existir em `USER_TABLES` e passa por `DBMS_ASSERT.ENQUOTE_NAME` |
| `PRC_VOLUMETRIA` | laco sobre `USER_TABLES` + `EXECUTE IMMEDIATE` | idem |
| `BUSCA_RECURSOS(...)` | `OPEN ... FOR ... USING` com filtros opcionais | todo valor vai por bind; a ordenacao vem de lista fechada |

### Tabelas novas

`SH_AUDITORIA` (trilha de auditoria) e `SH_VOLUMETRIA` (tamanho das tabelas ao longo do tempo).

### Codigos de erro de aplicacao

| Faixa | Origem |
|---|---|
| 20101 | competencia invalida |
| 20200-20213 | emprestimo, devolucao, reputacao, atrasos, resumo |
| 20301-20302 | trigger de status do emprestimo |
| 20401-20403 | SQL dinamico (tabela inexistente, ordenacao invalida, falha na volumetria) |

O backend traduz cada um para o status HTTP correspondente em `OracleErrors`/`GlobalExceptionHandler`.
