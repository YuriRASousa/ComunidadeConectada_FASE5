-- =====================================================================
-- Smart HAS / ComunidadeConectada - Fase 7
-- 01_ddl.sql - modelo fisico Oracle
--
-- Ordem de execucao: 01_ddl.sql, 02_seed.sql, 03_pkg_log.sql,
-- 04_pkg_calculos.sql, 05_pkg_emprestimo.sql, 06_pkg_admin.sql,
-- 07_triggers.sql. Tudo isso o script executar_scripts.py faz sozinho.
-- Para recomecar do zero, rode 99_drop.sql antes.
--
-- Prefixo SH_ (Smart HAS) em todos os objetos, para o schema do aluno
-- nao se misturar com o projeto DBurger usado nas aulas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- SH_CATEGORIA: categorias de recurso (antes eram um enum no codigo Java)
-- ---------------------------------------------------------------------
CREATE TABLE sh_categoria (
    id_categoria   NUMBER(4)     NOT NULL,
    nm_categoria   VARCHAR2(40)  NOT NULL,
    ds_categoria   VARCHAR2(200),
    CONSTRAINT pk_sh_categoria PRIMARY KEY (id_categoria),
    CONSTRAINT uk_sh_categoria_nome UNIQUE (nm_categoria)
);

COMMENT ON TABLE sh_categoria IS 'Categorias de recurso compartilhado na vizinhanca.';
COMMENT ON COLUMN sh_categoria.nm_categoria IS 'Nome unico da categoria: FERRAMENTAS, SAUDE, EDUCACAO, ALIMENTOS, ELETRONICOS, OUTROS.';

-- ---------------------------------------------------------------------
-- SH_USUARIO: morador cadastrado. Substitui o documento users do Firestore
-- e passa a guardar o hash da senha, antes mantido pelo Firebase Auth.
-- ---------------------------------------------------------------------
CREATE TABLE sh_usuario (
    id_usuario       NUMBER(10)    NOT NULL,
    nm_usuario       VARCHAR2(120) NOT NULL,
    ds_email         VARCHAR2(160) NOT NULL,
    ds_senha_hash    VARCHAR2(120) NOT NULL,
    ds_endereco      VARCHAR2(200),
    vl_latitude      NUMBER(9,6),
    vl_longitude     NUMBER(9,6),
    url_foto_perfil  VARCHAR2(500),
    vl_reputacao     NUMBER(3,2)   DEFAULT 5.00 NOT NULL,
    qt_transacoes    NUMBER(6)     DEFAULT 0    NOT NULL,
    fl_verificado    CHAR(1)       DEFAULT 'N'  NOT NULL,
    ds_papel         VARCHAR2(10)  DEFAULT 'USER' NOT NULL,
    dt_cadastro      DATE          DEFAULT SYSDATE NOT NULL,
    st_usuario       CHAR(1)       DEFAULT 'A'  NOT NULL,
    CONSTRAINT pk_sh_usuario PRIMARY KEY (id_usuario),
    CONSTRAINT uk_sh_usuario_email UNIQUE (ds_email),
    CONSTRAINT ck_sh_usuario_verificado CHECK (fl_verificado IN ('S','N')),
    CONSTRAINT ck_sh_usuario_papel      CHECK (ds_papel IN ('USER','ADMIN')),
    CONSTRAINT ck_sh_usuario_status     CHECK (st_usuario IN ('A','I')),
    CONSTRAINT ck_sh_usuario_reputacao  CHECK (vl_reputacao BETWEEN 0 AND 5)
);

COMMENT ON TABLE sh_usuario IS 'Morador que oferece ou solicita recursos na plataforma.';
COMMENT ON COLUMN sh_usuario.ds_senha_hash IS 'Hash BCrypt gerado pelo backend Spring Security. A senha em texto puro nunca e persistida.';
COMMENT ON COLUMN sh_usuario.vl_reputacao IS 'Media das avaliacoes recebidas, de 0 a 5. Recalculada por PRC_SH_ATUALIZA_REPUTACAO.';
COMMENT ON COLUMN sh_usuario.st_usuario IS 'A = ativo, I = inativo.';

-- ---------------------------------------------------------------------
-- SH_RECURSO: item publicado por um morador
-- ---------------------------------------------------------------------
CREATE TABLE sh_recurso (
    id_recurso          NUMBER(10)    NOT NULL,
    id_usuario          NUMBER(10)    NOT NULL,
    id_categoria        NUMBER(4)     NOT NULL,
    nm_recurso          VARCHAR2(120) NOT NULL,
    ds_recurso          VARCHAR2(1000),
    ds_condicao         VARCHAR2(12)  NOT NULL,
    ds_tipo             VARCHAR2(12)  NOT NULL,
    ds_disponibilidade  VARCHAR2(12)  DEFAULT 'DISPONIVEL' NOT NULL,
    url_imagem          VARCHAR2(500),
    vl_latitude         NUMBER(9,6),
    vl_longitude        NUMBER(9,6),
    dt_cadastro         DATE          DEFAULT SYSDATE NOT NULL,
    dt_atualizacao      DATE,
    CONSTRAINT pk_sh_recurso PRIMARY KEY (id_recurso),
    CONSTRAINT fk_sh_recurso_usuario   FOREIGN KEY (id_usuario)   REFERENCES sh_usuario (id_usuario),
    CONSTRAINT fk_sh_recurso_categoria FOREIGN KEY (id_categoria) REFERENCES sh_categoria (id_categoria),
    CONSTRAINT ck_sh_recurso_condicao  CHECK (ds_condicao IN ('NOVO','EXCELENTE','BOM','REGULAR')),
    CONSTRAINT ck_sh_recurso_tipo      CHECK (ds_tipo IN ('EMPRESTIMO','TROCA','DOACAO')),
    CONSTRAINT ck_sh_recurso_disp      CHECK (ds_disponibilidade IN ('DISPONIVEL','RESERVADO','INDISPONIVEL'))
);

COMMENT ON TABLE sh_recurso IS 'Item disponibilizado para emprestimo, troca ou doacao.';
COMMENT ON COLUMN sh_recurso.ds_disponibilidade IS 'DISPONIVEL, RESERVADO (emprestimo em andamento) ou INDISPONIVEL.';
COMMENT ON COLUMN sh_recurso.vl_latitude IS 'Coordenada usada no calculo de distancia ate quem procura o item.';

-- ---------------------------------------------------------------------
-- SH_MENSAGEM: conversa entre dois moradores, opcionalmente sobre um item
-- ---------------------------------------------------------------------
CREATE TABLE sh_mensagem (
    id_mensagem      NUMBER(10)     NOT NULL,
    id_remetente     NUMBER(10)     NOT NULL,
    id_destinatario  NUMBER(10)     NOT NULL,
    id_recurso       NUMBER(10),
    ds_conteudo      VARCHAR2(1000) NOT NULL,
    dt_envio         DATE           DEFAULT SYSDATE NOT NULL,
    fl_lida          CHAR(1)        DEFAULT 'N' NOT NULL,
    CONSTRAINT pk_sh_mensagem PRIMARY KEY (id_mensagem),
    CONSTRAINT fk_sh_msg_remetente    FOREIGN KEY (id_remetente)    REFERENCES sh_usuario (id_usuario),
    CONSTRAINT fk_sh_msg_destinatario FOREIGN KEY (id_destinatario) REFERENCES sh_usuario (id_usuario),
    CONSTRAINT fk_sh_msg_recurso      FOREIGN KEY (id_recurso)      REFERENCES sh_recurso (id_recurso),
    CONSTRAINT ck_sh_msg_lida         CHECK (fl_lida IN ('S','N')),
    CONSTRAINT ck_sh_msg_participantes CHECK (id_remetente <> id_destinatario)
);

COMMENT ON TABLE sh_mensagem IS 'Mensagem trocada entre dois moradores, normalmente sobre um recurso.';

-- ---------------------------------------------------------------------
-- SH_EMPRESTIMO: ciclo de vida do item emprestado. Entidade nova da Fase 6,
-- e o que permite medir circularidade, atraso e reputacao.
-- ---------------------------------------------------------------------
CREATE TABLE sh_emprestimo (
    id_emprestimo      NUMBER(10)   NOT NULL,
    id_recurso         NUMBER(10)   NOT NULL,
    id_solicitante     NUMBER(10)   NOT NULL,
    dt_solicitacao     DATE         DEFAULT SYSDATE NOT NULL,
    dt_retirada        DATE,
    dt_prev_devolucao  DATE         NOT NULL,
    dt_devolucao       DATE,
    st_emprestimo      VARCHAR2(12) DEFAULT 'SOLICITADO' NOT NULL,
    CONSTRAINT pk_sh_emprestimo PRIMARY KEY (id_emprestimo),
    CONSTRAINT fk_sh_emp_recurso     FOREIGN KEY (id_recurso)     REFERENCES sh_recurso (id_recurso),
    CONSTRAINT fk_sh_emp_solicitante FOREIGN KEY (id_solicitante) REFERENCES sh_usuario (id_usuario),
    CONSTRAINT ck_sh_emp_status      CHECK (st_emprestimo IN ('SOLICITADO','ATIVO','DEVOLVIDO','CANCELADO')),
    CONSTRAINT ck_sh_emp_datas       CHECK (dt_prev_devolucao >= dt_solicitacao)
);

COMMENT ON TABLE sh_emprestimo IS 'Emprestimo de um recurso a um morador, do pedido ate a devolucao.';
COMMENT ON COLUMN sh_emprestimo.st_emprestimo IS 'SOLICITADO, ATIVO (retirado), DEVOLVIDO ou CANCELADO.';
COMMENT ON COLUMN sh_emprestimo.dt_prev_devolucao IS 'Data combinada de devolucao. Base do alerta de atraso gerado por PRC_SH_DETECTA_ATRASOS.';

-- ---------------------------------------------------------------------
-- SH_AVALIACAO: nota dada apos a devolucao, alimenta a reputacao
-- ---------------------------------------------------------------------
CREATE TABLE sh_avaliacao (
    id_avaliacao   NUMBER(10)    NOT NULL,
    id_emprestimo  NUMBER(10)    NOT NULL,
    id_avaliador   NUMBER(10)    NOT NULL,
    id_avaliado    NUMBER(10)    NOT NULL,
    nr_nota        NUMBER(1)     NOT NULL,
    ds_comentario  VARCHAR2(400),
    dt_avaliacao   DATE          DEFAULT SYSDATE NOT NULL,
    CONSTRAINT pk_sh_avaliacao PRIMARY KEY (id_avaliacao),
    CONSTRAINT uk_sh_avaliacao_emp UNIQUE (id_emprestimo, id_avaliador),
    CONSTRAINT fk_sh_aval_emprestimo FOREIGN KEY (id_emprestimo) REFERENCES sh_emprestimo (id_emprestimo),
    CONSTRAINT fk_sh_aval_avaliador  FOREIGN KEY (id_avaliador)  REFERENCES sh_usuario (id_usuario),
    CONSTRAINT fk_sh_aval_avaliado   FOREIGN KEY (id_avaliado)   REFERENCES sh_usuario (id_usuario),
    CONSTRAINT ck_sh_aval_nota       CHECK (nr_nota BETWEEN 1 AND 5)
);

COMMENT ON TABLE sh_avaliacao IS 'Avaliacao de 1 a 5 registrada apos a devolucao do item.';

-- ---------------------------------------------------------------------
-- SH_ALERTA: ocorrencias detectadas pelas rotinas do banco
-- ---------------------------------------------------------------------
CREATE TABLE sh_alerta (
    id_alerta      NUMBER(10)    NOT NULL,
    ds_tipo        VARCHAR2(30)  NOT NULL,
    id_referencia  NUMBER(10),
    ds_severidade  VARCHAR2(10)  DEFAULT 'MEDIA' NOT NULL,
    ds_mensagem    VARCHAR2(400) NOT NULL,
    dt_alerta      DATE          DEFAULT SYSDATE NOT NULL,
    fl_resolvido   CHAR(1)       DEFAULT 'N' NOT NULL,
    CONSTRAINT pk_sh_alerta PRIMARY KEY (id_alerta),
    CONSTRAINT ck_sh_alerta_sever    CHECK (ds_severidade IN ('BAIXA','MEDIA','ALTA')),
    CONSTRAINT ck_sh_alerta_resolvido CHECK (fl_resolvido IN ('S','N'))
);

COMMENT ON TABLE sh_alerta IS 'Alerta operacional gerado pelas rotinas PL/SQL, por exemplo emprestimo em atraso.';
COMMENT ON COLUMN sh_alerta.id_referencia IS 'Id do registro que originou o alerta (emprestimo, recurso ou usuario), conforme o tipo.';

-- ---------------------------------------------------------------------
-- SH_RESUMO_USUARIO_MES: tabela de resumo recalculada por rotina diaria.
-- Existe para o painel ler numero pronto em vez de agregar tudo a cada
-- abertura de tela.
-- ---------------------------------------------------------------------
CREATE TABLE sh_resumo_usuario_mes (
    id_usuario               NUMBER(10)    NOT NULL,
    nr_ano_mes               NUMBER(6)     NOT NULL,
    nm_usuario               VARCHAR2(120) NOT NULL,
    qt_recursos_publicados   NUMBER(6)     DEFAULT 0 NOT NULL,
    qt_emprestimos_concedidos NUMBER(6)    DEFAULT 0 NOT NULL,
    qt_emprestimos_tomados   NUMBER(6)     DEFAULT 0 NOT NULL,
    qt_devolucoes_atraso     NUMBER(6)     DEFAULT 0 NOT NULL,
    vl_indice_circularidade  NUMBER(5,2)   DEFAULT 0 NOT NULL,
    vl_reputacao             NUMBER(3,2)   DEFAULT 5 NOT NULL,
    dt_processamento         DATE          DEFAULT SYSDATE NOT NULL,
    CONSTRAINT pk_sh_resumo_usuario_mes PRIMARY KEY (id_usuario, nr_ano_mes),
    CONSTRAINT fk_sh_resumo_usuario FOREIGN KEY (id_usuario) REFERENCES sh_usuario (id_usuario)
);

COMMENT ON TABLE sh_resumo_usuario_mes IS 'Resumo mensal por morador, recarregado por PRC_SH_GERA_RESUMO_MENSAL.';
COMMENT ON COLUMN sh_resumo_usuario_mes.nr_ano_mes IS 'Competencia no formato AAAAMM, por exemplo 202609.';
COMMENT ON COLUMN sh_resumo_usuario_mes.vl_indice_circularidade IS 'Emprestimos concedidos por recurso publicado no mes. Quanto maior, mais o item parado voltou a circular.';

-- ---------------------------------------------------------------------
-- SH_LOG_SISTEMA: trilha de execucao das rotinas, gravada em transacao
-- autonoma para sobreviver a um rollback da transacao principal.
-- ---------------------------------------------------------------------
CREATE TABLE sh_log_sistema (
    id_log      NUMBER(10)     NOT NULL,
    nm_origem   VARCHAR2(100)  NOT NULL,
    dt_log      DATE           DEFAULT SYSDATE NOT NULL,
    ds_mensagem VARCHAR2(4000) NOT NULL,
    CONSTRAINT pk_sh_log_sistema PRIMARY KEY (id_log)
);

COMMENT ON TABLE sh_log_sistema IS 'Log das procedures e functions do Smart HAS.';

-- ---------------------------------------------------------------------
-- SH_AUDITORIA (Fase 7): trilha de quem mudou o que. Alimentada pelas
-- triggers de SH_EMPRESTIMO e SH_USUARIO. Diferente do log, o registro
-- participa da transacao: se a alteracao sofrer rollback, a linha de
-- auditoria some junto, entao a trilha nunca descreve algo que nao houve.
-- ---------------------------------------------------------------------
CREATE TABLE sh_auditoria (
    id_auditoria  NUMBER(12)     NOT NULL,
    nm_tabela     VARCHAR2(30)   NOT NULL,
    tp_operacao   VARCHAR2(10)   NOT NULL,
    id_registro   NUMBER(10),
    nm_usuario_bd VARCHAR2(60)   NOT NULL,
    dt_evento     DATE           DEFAULT SYSDATE NOT NULL,
    ds_antes      VARCHAR2(1000),
    ds_depois     VARCHAR2(1000),
    CONSTRAINT pk_sh_auditoria PRIMARY KEY (id_auditoria),
    CONSTRAINT ck_sh_auditoria_op CHECK (tp_operacao IN ('INSERT','UPDATE','DELETE'))
);

COMMENT ON TABLE sh_auditoria IS 'Trilha de auditoria preenchida por triggers. Nunca guarda senha ou hash.';

-- ---------------------------------------------------------------------
-- SH_VOLUMETRIA (Fase 7): fotografia do tamanho de cada tabela, gravada
-- por PKG_SH_ADMIN.PRC_VOLUMETRIA com SQL dinamico. Serve para ver o
-- crescimento do banco ao longo do tempo (e prever custo na nuvem).
-- ---------------------------------------------------------------------
CREATE TABLE sh_volumetria (
    id_volumetria NUMBER(12)   NOT NULL,
    dt_coleta     DATE         NOT NULL,
    nm_tabela     VARCHAR2(30) NOT NULL,
    qt_linhas     NUMBER(12)   NOT NULL,
    CONSTRAINT pk_sh_volumetria PRIMARY KEY (id_volumetria)
);

COMMENT ON TABLE sh_volumetria IS 'Quantidade de linhas por tabela em cada coleta.';

-- ---------------------------------------------------------------------
-- Sequences
-- ---------------------------------------------------------------------
CREATE SEQUENCE sq_sh_categoria   START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sq_sh_usuario     START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sq_sh_recurso     START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sq_sh_mensagem    START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sq_sh_emprestimo  START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sq_sh_avaliacao   START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sq_sh_alerta      START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sq_sh_log_sistema START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sq_sh_auditoria   START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sq_sh_volumetria  START WITH 1 INCREMENT BY 1 NOCACHE;

-- ---------------------------------------------------------------------
-- Indices de apoio as consultas mais frequentes do app e do painel
-- ---------------------------------------------------------------------
CREATE INDEX ix_sh_recurso_categoria  ON sh_recurso (id_categoria, ds_disponibilidade);
CREATE INDEX ix_sh_recurso_usuario    ON sh_recurso (id_usuario);
CREATE INDEX ix_sh_emprestimo_status  ON sh_emprestimo (st_emprestimo, dt_prev_devolucao);
CREATE INDEX ix_sh_emprestimo_recurso ON sh_emprestimo (id_recurso);
CREATE INDEX ix_sh_mensagem_par       ON sh_mensagem (id_remetente, id_destinatario, dt_envio);
CREATE INDEX ix_sh_alerta_tipo        ON sh_alerta (ds_tipo, fl_resolvido);
CREATE INDEX ix_sh_auditoria_registro ON sh_auditoria (nm_tabela, id_registro, dt_evento);
CREATE INDEX ix_sh_volumetria_coleta  ON sh_volumetria (dt_coleta, nm_tabela);

COMMIT;
