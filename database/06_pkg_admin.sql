-- =====================================================================
-- Smart HAS - Fase 7
-- 06_pkg_admin.sql - PKG_SH_ADMIN, rotinas administrativas e SQL dinamico
--
-- Abriga a consolidacao mensal da Fase 6 e as rotinas novas que usam
-- Dynamic SQL:
--   * CONTAGEM_LINHAS e PRC_VOLUMETRIA: o nome da tabela so e conhecido
--     em tempo de execucao (EXECUTE IMMEDIATE).
--   * BUSCA_RECURSOS: o filtro muda a cada chamada e o resultado volta
--     como cursor (OPEN-FOR com bind variables).
--
-- Regra deste pacote para SQL dinamico: valor vai como BIND, nome de
-- objeto passa pelo dicionario e por DBMS_ASSERT, ordenacao sai de lista
-- fechada. Texto vindo de fora nunca e concatenado no comando.
-- =====================================================================

CREATE OR REPLACE PACKAGE pkg_sh_admin AS
    -- Recarrega SH_RESUMO_USUARIO_MES da competencia (AAAAMM).
    PROCEDURE gera_resumo_mensal (
        p_nr_ano_mes IN  NUMBER,
        p_qt_linhas  OUT NUMBER
    );

    -- SQL dinamico 1: quantas linhas tem uma tabela do schema.
    FUNCTION contagem_linhas (
        p_nm_tabela IN VARCHAR2
    ) RETURN NUMBER;

    -- SQL dinamico 2: fotografa o tamanho de todas as tabelas SH_ em
    -- SH_VOLUMETRIA. Devolve quantas tabelas foram lidas.
    PROCEDURE prc_volumetria (
        p_qt_tabelas OUT NUMBER
    );

    -- SQL dinamico 3: busca de recursos com filtros opcionais e
    -- ordenacao escolhida pelo chamador (RECENTE, NOME ou DISTANCIA).
    FUNCTION busca_recursos (
        p_id_categoria       IN NUMBER   DEFAULT NULL,
        p_ds_tipo            IN VARCHAR2 DEFAULT NULL,
        p_ds_disponibilidade IN VARCHAR2 DEFAULT NULL,
        p_texto              IN VARCHAR2 DEFAULT NULL,
        p_lat                IN NUMBER   DEFAULT NULL,
        p_lon                IN NUMBER   DEFAULT NULL,
        p_raio_km            IN NUMBER   DEFAULT NULL,
        p_ordem              IN VARCHAR2 DEFAULT 'RECENTE'
    ) RETURN SYS_REFCURSOR;
END pkg_sh_admin;
/

CREATE OR REPLACE PACKAGE BODY pkg_sh_admin AS

    -- ---------------------------------------------------------------------
    -- PKG_SH_ADMIN.GERA_RESUMO_MENSAL
    -- Recarrega SH_RESUMO_USUARIO_MES para a competencia informada.
    --
    -- A leitura usa BULK COLLECT e a gravacao usa FORALL: em vez de ir e
    -- voltar entre o motor PL/SQL e o motor SQL uma vez por morador, os
    -- dados sobem de uma vez e descem de uma vez. Com a base pequena da
    -- demonstracao a diferenca e pequena, mas o padrao e o que sustenta a
    -- rotina quando a vizinhanca cresce.
    -- ---------------------------------------------------------------------
    PROCEDURE gera_resumo_mensal (
        p_nr_ano_mes IN  NUMBER,
        p_qt_linhas  OUT NUMBER
    ) IS
        TYPE t_resumo IS TABLE OF sh_resumo_usuario_mes%ROWTYPE;
        v_resumo    t_resumo;

        v_dt_inicio DATE;
        v_dt_fim    DATE;

        e_competencia_invalida EXCEPTION;
    BEGIN
        IF p_nr_ano_mes IS NULL OR LENGTH(TO_CHAR(p_nr_ano_mes)) <> 6 THEN
            RAISE e_competencia_invalida;
        END IF;

        v_dt_inicio := TO_DATE(TO_CHAR(p_nr_ano_mes) || '01', 'YYYYMMDD');
        v_dt_fim    := LAST_DAY(v_dt_inicio) + 1;

        -- A competencia e sempre reprocessada por inteiro, entao rodar duas
        -- vezes no mesmo dia nao duplica nada.
        DELETE FROM sh_resumo_usuario_mes
         WHERE nr_ano_mes = p_nr_ano_mes;

        SELECT u.id_usuario,
               p_nr_ano_mes,
               u.nm_usuario,
               (SELECT COUNT(*)
                  FROM sh_recurso r
                 WHERE r.id_usuario   = u.id_usuario
                   AND r.dt_cadastro  < v_dt_fim)                              AS qt_recursos_publicados,
               (SELECT COUNT(*)
                  FROM sh_emprestimo e
                       INNER JOIN sh_recurso r ON (r.id_recurso = e.id_recurso)
                 WHERE r.id_usuario       = u.id_usuario
                   AND e.dt_solicitacao  >= v_dt_inicio
                   AND e.dt_solicitacao   < v_dt_fim
                   AND e.st_emprestimo   <> 'CANCELADO')                       AS qt_emprestimos_concedidos,
               (SELECT COUNT(*)
                  FROM sh_emprestimo e
                 WHERE e.id_solicitante   = u.id_usuario
                   AND e.dt_solicitacao  >= v_dt_inicio
                   AND e.dt_solicitacao   < v_dt_fim
                   AND e.st_emprestimo   <> 'CANCELADO')                       AS qt_emprestimos_tomados,
               (SELECT COUNT(*)
                  FROM sh_emprestimo e
                 WHERE e.id_solicitante  = u.id_usuario
                   AND e.dt_devolucao   >= v_dt_inicio
                   AND e.dt_devolucao    < v_dt_fim
                   AND e.dt_devolucao    > e.dt_prev_devolucao)                AS qt_devolucoes_atraso,
               pkg_sh_calculos.indice_circularidade(u.id_usuario, p_nr_ano_mes)          AS vl_indice_circularidade,
               pkg_sh_calculos.reputacao(u.id_usuario)                                   AS vl_reputacao,
               SYSDATE                                                         AS dt_processamento
          BULK COLLECT INTO v_resumo
          FROM sh_usuario u
         WHERE u.st_usuario = 'A';

        FORALL i IN 1 .. v_resumo.COUNT
            INSERT INTO sh_resumo_usuario_mes VALUES v_resumo(i);

        p_qt_linhas := v_resumo.COUNT;

        pkg_sh_log.grava('PKG_SH_ADMIN.GERA_RESUMO_MENSAL',
            'Competencia ' || p_nr_ano_mes || ' processada. Linhas gravadas: ' || p_qt_linhas);
        COMMIT;
    EXCEPTION
        WHEN e_competencia_invalida THEN
            ROLLBACK;
            raise_application_error(-20212,
                'Competencia invalida em PKG_SH_ADMIN.GERA_RESUMO_MENSAL. Use o formato AAAAMM.');
        WHEN OTHERS THEN
            ROLLBACK;
            pkg_sh_log.grava('PKG_SH_ADMIN.GERA_RESUMO_MENSAL',
                'Competencia ' || p_nr_ano_mes || '. Erro: ' || SQLERRM);
            raise_application_error(-20213,
                'Falha ao gerar o resumo mensal: ' || SQLERRM);
    END gera_resumo_mensal;

    -- ---------------------------------------------------------------------
    -- PKG_SH_ADMIN.CONTAGEM_LINHAS
    -- O nome da tabela chega por parametro, entao o comando precisa ser
    -- montado em tempo de execucao. Duas travas contra SQL injection:
    -- 1) o nome tem de existir em USER_TABLES (lista fechada vinda do
    --    dicionario, nao do chamador);
    -- 2) o nome que vai para o comando e o do dicionario, ainda protegido
    --    por DBMS_ASSERT.ENQUOTE_NAME.
    -- ---------------------------------------------------------------------
    FUNCTION contagem_linhas (
        p_nm_tabela IN VARCHAR2
    ) RETURN NUMBER IS
        v_nm_tabela user_tables.table_name%TYPE;
        v_qt_linhas NUMBER;
    BEGIN
        BEGIN
            SELECT table_name
              INTO v_nm_tabela
              FROM user_tables
             WHERE table_name = UPPER(TRIM(p_nm_tabela));
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                raise_application_error(-20401,
                    'Tabela "' || SUBSTR(p_nm_tabela, 1, 40) || '" nao existe neste schema.');
        END;

        EXECUTE IMMEDIATE 'SELECT COUNT(*) FROM '
                          || DBMS_ASSERT.ENQUOTE_NAME(v_nm_tabela, FALSE)
            INTO v_qt_linhas;

        RETURN v_qt_linhas;
    END contagem_linhas;

    -- ---------------------------------------------------------------------
    -- PKG_SH_ADMIN.PRC_VOLUMETRIA
    -- Percorre as tabelas do projeto e grava uma linha por tabela em
    -- SH_VOLUMETRIA, todas com o mesmo carimbo de coleta. Rodando uma vez
    -- por dia da para ver o ritmo de crescimento do banco.
    -- ---------------------------------------------------------------------
    PROCEDURE prc_volumetria (
        p_qt_tabelas OUT NUMBER
    ) IS
        v_dt_coleta DATE := SYSDATE;
    BEGIN
        p_qt_tabelas := 0;

        FOR t IN (SELECT table_name
                    FROM user_tables
                   WHERE table_name LIKE 'SH\_%' ESCAPE '\'
                   ORDER BY table_name) LOOP
            INSERT INTO sh_volumetria (id_volumetria, dt_coleta, nm_tabela, qt_linhas)
            VALUES (sq_sh_volumetria.NEXTVAL, v_dt_coleta, t.table_name,
                    contagem_linhas(t.table_name));
            p_qt_tabelas := p_qt_tabelas + 1;
        END LOOP;

        pkg_sh_log.grava('PKG_SH_ADMIN.PRC_VOLUMETRIA',
            'Coleta concluida. Tabelas lidas: ' || p_qt_tabelas);
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            ROLLBACK;
            pkg_sh_log.grava('PKG_SH_ADMIN.PRC_VOLUMETRIA', 'Erro: ' || SQLERRM);
            raise_application_error(-20403, 'Falha na volumetria: ' || SQLERRM);
    END prc_volumetria;

    -- ---------------------------------------------------------------------
    -- PKG_SH_ADMIN.BUSCA_RECURSOS
    -- Consulta montada em tempo real a partir dos filtros recebidos.
    --
    -- O que muda de uma chamada para outra:
    --   * quais filtros entram no WHERE (so os informados);
    --   * a ordenacao (RECENTE, NOME ou DISTANCIA).
    -- O que NUNCA e concatenado: valor de filtro. Todo valor vai por bind
    -- (:categoria, :tipo ...). Os filtros ausentes viram "AND :x IS NULL",
    -- que mantem o numero de binds fixo sem pesar no plano. A ordenacao
    -- vem de uma lista fechada: texto fora dela e recusado.
    -- ---------------------------------------------------------------------
    FUNCTION busca_recursos (
        p_id_categoria       IN NUMBER,
        p_ds_tipo            IN VARCHAR2,
        p_ds_disponibilidade IN VARCHAR2,
        p_texto              IN VARCHAR2,
        p_lat                IN NUMBER,
        p_lon                IN NUMBER,
        p_raio_km            IN NUMBER,
        p_ordem              IN VARCHAR2
    ) RETURN SYS_REFCURSOR IS
        v_cursor   SYS_REFCURSOR;
        v_sql      VARCHAR2(4000);
        v_order_by VARCHAR2(60);
        v_texto    VARCHAR2(200);
        v_raio     NUMBER;
    BEGIN
        -- Ordenacao: lista fechada, nada do chamador entra no comando.
        v_order_by := CASE UPPER(NVL(p_ordem, 'RECENTE'))
                          WHEN 'RECENTE'   THEN 'dt_cadastro DESC'
                          WHEN 'NOME'      THEN 'nm_recurso'
                          WHEN 'DISTANCIA' THEN 'distancia_km NULLS LAST, nm_recurso'
                          ELSE NULL
                      END;
        IF v_order_by IS NULL THEN
            raise_application_error(-20402,
                'Ordenacao invalida. Use RECENTE, NOME ou DISTANCIA.');
        END IF;

        -- Texto livre vira padrao do LIKE; o valor segue como bind.
        v_texto := CASE WHEN p_texto IS NULL THEN NULL
                        ELSE '%' || UPPER(TRIM(p_texto)) || '%' END;

        v_sql := 'SELECT * FROM ('
              || ' SELECT r.id_recurso, r.nm_recurso, c.nm_categoria, r.ds_tipo,'
              || '        r.ds_disponibilidade, r.dt_cadastro,'
              || '        pkg_sh_calculos.distancia_km(:lat, :lon, r.vl_latitude, r.vl_longitude) AS distancia_km'
              || '   FROM sh_recurso r'
              || '        INNER JOIN sh_categoria c ON (c.id_categoria = r.id_categoria)'
              || '  WHERE 1 = 1';

        v_sql := v_sql || CASE WHEN p_id_categoria IS NOT NULL
                               THEN ' AND r.id_categoria = :id_categoria'
                               ELSE ' AND :id_categoria IS NULL' END;
        v_sql := v_sql || CASE WHEN p_ds_tipo IS NOT NULL
                               THEN ' AND r.ds_tipo = :tipo'
                               ELSE ' AND :tipo IS NULL' END;
        v_sql := v_sql || CASE WHEN p_ds_disponibilidade IS NOT NULL
                               THEN ' AND r.ds_disponibilidade = :disp'
                               ELSE ' AND :disp IS NULL' END;
        v_sql := v_sql || CASE WHEN v_texto IS NOT NULL
                               THEN ' AND UPPER(r.nm_recurso) LIKE :texto'
                               ELSE ' AND :texto IS NULL' END;

        -- Raio so faz sentido com a posicao de quem busca.
        v_raio := CASE WHEN p_lat IS NOT NULL AND p_lon IS NOT NULL THEN p_raio_km END;
        v_sql := v_sql || ' ) WHERE '
              || CASE WHEN v_raio IS NOT NULL
                      THEN 'distancia_km <= :raio'
                      ELSE ':raio IS NULL' END
              || ' ORDER BY ' || v_order_by;

        OPEN v_cursor FOR v_sql
            USING p_lat, p_lon,
                  p_id_categoria, UPPER(p_ds_tipo), UPPER(p_ds_disponibilidade),
                  v_texto, v_raio;
        RETURN v_cursor;
    END busca_recursos;

END pkg_sh_admin;
/
