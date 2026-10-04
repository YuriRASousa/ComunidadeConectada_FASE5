-- =====================================================================
-- Smart HAS - Fase 6
-- 05_procedures.sql - procedures PL/SQL
--
-- PRC_SH_REGISTRA_EMPRESTIMO e PRC_SH_REGISTRA_DEVOLUCAO sao chamadas
-- pelo backend Java (REST -> Spring -> JDBC -> Oracle).
-- PRC_SH_DETECTA_ATRASOS e PRC_SH_GERA_RESUMO_MENSAL sao rotinas de
-- operacao, disparadas pelo painel administrativo ou por agendamento.
-- =====================================================================

-- ---------------------------------------------------------------------
-- PRC_SH_ATUALIZA_REPUTACAO
-- Grava em SH_USUARIO a reputacao calculada por FN_SH_REPUTACAO.
-- A coluna existe para o app nao precisar recalcular a media a cada
-- listagem; esta procedure e quem a mantem coerente.
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE prc_sh_atualiza_reputacao (
    p_id_usuario IN sh_usuario.id_usuario%TYPE
) IS
    v_reputacao sh_usuario.vl_reputacao%TYPE;
BEGIN
    v_reputacao := fn_sh_reputacao(p_id_usuario);

    UPDATE sh_usuario
       SET vl_reputacao = v_reputacao
     WHERE id_usuario = p_id_usuario;

    IF SQL%ROWCOUNT = 0 THEN
        raise_application_error(-20210,
            'Usuario ' || p_id_usuario || ' nao encontrado para atualizar reputacao.');
    END IF;
END prc_sh_atualiza_reputacao;
/

-- ---------------------------------------------------------------------
-- PRC_SH_REGISTRA_EMPRESTIMO
-- Ponto de entrada do backend: o morador toca em "solicitar" no app, a
-- API REST recebe a chamada e o Java executa esta procedure por JDBC.
--
-- Toda a regra fica aqui, e nao no Java: recurso precisa existir, estar
-- disponivel, ser do tipo emprestimo, e ninguem pega emprestado o
-- proprio item. Assim aplicativo e painel obedecem a mesma regra.
--
-- Parametros de saida: id gerado e mensagem pronta para a interface.
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE prc_sh_registra_emprestimo (
    p_id_recurso     IN  sh_recurso.id_recurso%TYPE,
    p_id_solicitante IN  sh_usuario.id_usuario%TYPE,
    p_qt_dias        IN  NUMBER DEFAULT 7,
    p_id_emprestimo  OUT sh_emprestimo.id_emprestimo%TYPE,
    p_ds_retorno     OUT VARCHAR2
) IS
    v_id_dono     sh_usuario.id_usuario%TYPE;
    v_disp        sh_recurso.ds_disponibilidade%TYPE;
    v_tipo        sh_recurso.ds_tipo%TYPE;
    v_nm_recurso  sh_recurso.nm_recurso%TYPE;
    v_st_usuario  sh_usuario.st_usuario%TYPE;

    e_recurso_indisponivel EXCEPTION;
    e_proprio_dono         EXCEPTION;
    e_tipo_invalido        EXCEPTION;
    e_usuario_inativo      EXCEPTION;
BEGIN
    -- Dados do recurso
    SELECT id_usuario, ds_disponibilidade, ds_tipo, nm_recurso
      INTO v_id_dono, v_disp, v_tipo, v_nm_recurso
      FROM sh_recurso
     WHERE id_recurso = p_id_recurso;

    -- Situacao do solicitante
    SELECT st_usuario
      INTO v_st_usuario
      FROM sh_usuario
     WHERE id_usuario = p_id_solicitante;

    IF v_st_usuario <> 'A' THEN
        RAISE e_usuario_inativo;
    END IF;

    IF v_id_dono = p_id_solicitante THEN
        RAISE e_proprio_dono;
    END IF;

    IF v_tipo <> 'EMPRESTIMO' THEN
        RAISE e_tipo_invalido;
    END IF;

    IF v_disp <> 'DISPONIVEL' THEN
        RAISE e_recurso_indisponivel;
    END IF;

    -- Registro do emprestimo
    SELECT sq_sh_emprestimo.NEXTVAL INTO p_id_emprestimo FROM dual;

    INSERT INTO sh_emprestimo (
        id_emprestimo, id_recurso, id_solicitante,
        dt_solicitacao, dt_prev_devolucao, st_emprestimo
    ) VALUES (
        p_id_emprestimo, p_id_recurso, p_id_solicitante,
        SYSDATE, SYSDATE + NVL(p_qt_dias, 7), 'SOLICITADO'
    );

    -- O item sai da vitrine enquanto o emprestimo estiver em andamento
    UPDATE sh_recurso
       SET ds_disponibilidade = 'RESERVADO',
           dt_atualizacao     = SYSDATE
     WHERE id_recurso = p_id_recurso;

    p_ds_retorno := 'Emprestimo ' || p_id_emprestimo || ' registrado para o recurso "'
                 || v_nm_recurso || '". Devolucao prevista para '
                 || TO_CHAR(SYSDATE + NVL(p_qt_dias, 7), 'DD/MM/YYYY') || '.';

    prc_sh_grava_log('PRC_SH_REGISTRA_EMPRESTIMO', p_ds_retorno);
    COMMIT;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        ROLLBACK;
        prc_sh_grava_log('PRC_SH_REGISTRA_EMPRESTIMO',
            'Recurso ' || p_id_recurso || ' ou usuario ' || p_id_solicitante || ' nao encontrado.');
        raise_application_error(-20201,
            'Recurso ou solicitante nao encontrado.');
    WHEN e_usuario_inativo THEN
        ROLLBACK;
        raise_application_error(-20202,
            'Usuario ' || p_id_solicitante || ' esta inativo e nao pode solicitar emprestimo.');
    WHEN e_proprio_dono THEN
        ROLLBACK;
        raise_application_error(-20203,
            'O solicitante e o proprio dono do recurso ' || p_id_recurso || '.');
    WHEN e_tipo_invalido THEN
        ROLLBACK;
        raise_application_error(-20204,
            'O recurso ' || p_id_recurso || ' esta cadastrado como ' || v_tipo ||
            ' e nao como EMPRESTIMO.');
    WHEN e_recurso_indisponivel THEN
        ROLLBACK;
        raise_application_error(-20205,
            'O recurso ' || p_id_recurso || ' esta ' || v_disp || ' no momento.');
    WHEN OTHERS THEN
        ROLLBACK;
        prc_sh_grava_log('PRC_SH_REGISTRA_EMPRESTIMO',
            'Erro inesperado no recurso ' || p_id_recurso || ': ' || SQLERRM);
        raise_application_error(-20200,
            'Falha ao registrar emprestimo: ' || SQLERRM);
END prc_sh_registra_emprestimo;
/

-- ---------------------------------------------------------------------
-- PRC_SH_REGISTRA_DEVOLUCAO
-- Fecha o ciclo: marca a devolucao, libera o recurso, conta a transacao
-- para as duas partes e, quando vem nota, grava a avaliacao e recalcula
-- a reputacao de quem emprestou.
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE prc_sh_registra_devolucao (
    p_id_emprestimo IN  sh_emprestimo.id_emprestimo%TYPE,
    p_nr_nota       IN  sh_avaliacao.nr_nota%TYPE DEFAULT NULL,
    p_ds_comentario IN  sh_avaliacao.ds_comentario%TYPE DEFAULT NULL,
    p_ds_retorno    OUT VARCHAR2
) IS
    v_id_recurso     sh_emprestimo.id_recurso%TYPE;
    v_id_solicitante sh_emprestimo.id_solicitante%TYPE;
    v_id_dono        sh_usuario.id_usuario%TYPE;
    v_st             sh_emprestimo.st_emprestimo%TYPE;
    v_dt_prevista    sh_emprestimo.dt_prev_devolucao%TYPE;
    v_qt_atraso      NUMBER;

    e_ja_devolvido EXCEPTION;
BEGIN
    SELECT e.id_recurso, e.id_solicitante, e.st_emprestimo, e.dt_prev_devolucao, r.id_usuario
      INTO v_id_recurso, v_id_solicitante, v_st, v_dt_prevista, v_id_dono
      FROM sh_emprestimo e
           INNER JOIN sh_recurso r ON (r.id_recurso = e.id_recurso)
     WHERE e.id_emprestimo = p_id_emprestimo;

    IF v_st IN ('DEVOLVIDO', 'CANCELADO') THEN
        RAISE e_ja_devolvido;
    END IF;

    UPDATE sh_emprestimo
       SET dt_devolucao  = SYSDATE,
           st_emprestimo = 'DEVOLVIDO'
     WHERE id_emprestimo = p_id_emprestimo;

    UPDATE sh_recurso
       SET ds_disponibilidade = 'DISPONIVEL',
           dt_atualizacao     = SYSDATE
     WHERE id_recurso = v_id_recurso;

    -- Cada devolucao concluida conta como transacao para as duas pontas
    UPDATE sh_usuario
       SET qt_transacoes = qt_transacoes + 1
     WHERE id_usuario IN (v_id_dono, v_id_solicitante);

    -- Avaliacao e opcional: sem nota, o ciclo fecha do mesmo jeito
    IF p_nr_nota IS NOT NULL THEN
        INSERT INTO sh_avaliacao (
            id_avaliacao, id_emprestimo, id_avaliador, id_avaliado,
            nr_nota, ds_comentario, dt_avaliacao
        ) VALUES (
            sq_sh_avaliacao.NEXTVAL, p_id_emprestimo, v_id_solicitante, v_id_dono,
            p_nr_nota, p_ds_comentario, SYSDATE
        );
        prc_sh_atualiza_reputacao(v_id_dono);
    END IF;

    v_qt_atraso := TRUNC(SYSDATE) - TRUNC(v_dt_prevista);

    IF v_qt_atraso > 0 THEN
        p_ds_retorno := 'Devolucao registrada com ' || v_qt_atraso || ' dia(s) de atraso.';
        -- Atraso fica registrado como alerta de baixa severidade, para
        -- aparecer no historico do morador sem gerar cobranca.
        INSERT INTO sh_alerta (id_alerta, ds_tipo, id_referencia, ds_severidade, ds_mensagem)
        VALUES (sq_sh_alerta.NEXTVAL, 'DEVOLUCAO_ATRASADA', p_id_emprestimo, 'BAIXA',
                'Emprestimo ' || p_id_emprestimo || ' devolvido com ' || v_qt_atraso || ' dia(s) de atraso.');
    ELSE
        p_ds_retorno := 'Devolucao registrada no prazo.';
    END IF;

    prc_sh_grava_log('PRC_SH_REGISTRA_DEVOLUCAO',
        'Emprestimo ' || p_id_emprestimo || ': ' || p_ds_retorno);
    COMMIT;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        ROLLBACK;
        raise_application_error(-20206,
            'Emprestimo ' || p_id_emprestimo || ' nao encontrado.');
    WHEN e_ja_devolvido THEN
        ROLLBACK;
        raise_application_error(-20207,
            'Emprestimo ' || p_id_emprestimo || ' ja esta com status ' || v_st || '.');
    WHEN DUP_VAL_ON_INDEX THEN
        ROLLBACK;
        raise_application_error(-20208,
            'Este emprestimo ja possui avaliacao registrada por este morador.');
    WHEN OTHERS THEN
        ROLLBACK;
        prc_sh_grava_log('PRC_SH_REGISTRA_DEVOLUCAO',
            'Emprestimo ' || p_id_emprestimo || '. Erro: ' || SQLERRM);
        raise_application_error(-20209,
            'Falha ao registrar devolucao: ' || SQLERRM);
END prc_sh_registra_devolucao;
/

-- ---------------------------------------------------------------------
-- PRC_SH_DETECTA_ATRASOS
-- Rotina de vigilancia: percorre os emprestimos em aberto e abre alerta
-- para os que passaram da data combinada. A severidade cresce com o
-- tempo de atraso. Nao abre alerta repetido para o mesmo emprestimo.
--
-- Equivale, no dominio do Smart HAS, ao alerta por leitura critica de
-- sensor citado no enunciado: a leitura aqui e o prazo estourado.
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE prc_sh_detecta_atrasos (
    p_qt_alertas OUT NUMBER
) IS
    CURSOR c_atrasados IS
        SELECT e.id_emprestimo,
               e.id_solicitante,
               TRUNC(SYSDATE) - TRUNC(e.dt_prev_devolucao) AS qt_dias_atraso,
               r.nm_recurso,
               u.nm_usuario
          FROM sh_emprestimo e
               INNER JOIN sh_recurso r ON (r.id_recurso = e.id_recurso)
               INNER JOIN sh_usuario u ON (u.id_usuario = e.id_solicitante)
         WHERE e.st_emprestimo    IN ('SOLICITADO', 'ATIVO')
           AND e.dt_devolucao     IS NULL
           AND TRUNC(e.dt_prev_devolucao) < TRUNC(SYSDATE)
         ORDER BY e.dt_prev_devolucao;

    v_severidade  sh_alerta.ds_severidade%TYPE;
    v_ja_existe   PLS_INTEGER;
BEGIN
    p_qt_alertas := 0;

    FOR r_atraso IN c_atrasados LOOP
        -- Evita encher a tela do painel com o mesmo alerta todo dia
        SELECT COUNT(*)
          INTO v_ja_existe
          FROM sh_alerta
         WHERE ds_tipo       = 'EMPRESTIMO_ATRASADO'
           AND id_referencia = r_atraso.id_emprestimo
           AND fl_resolvido  = 'N';

        IF v_ja_existe = 0 THEN
            IF r_atraso.qt_dias_atraso >= 15 THEN
                v_severidade := 'ALTA';
            ELSIF r_atraso.qt_dias_atraso >= 5 THEN
                v_severidade := 'MEDIA';
            ELSE
                v_severidade := 'BAIXA';
            END IF;

            INSERT INTO sh_alerta (
                id_alerta, ds_tipo, id_referencia, ds_severidade, ds_mensagem
            ) VALUES (
                sq_sh_alerta.NEXTVAL, 'EMPRESTIMO_ATRASADO', r_atraso.id_emprestimo, v_severidade,
                'O item "' || r_atraso.nm_recurso || '" esta com ' || r_atraso.qt_dias_atraso ||
                ' dia(s) de atraso com ' || r_atraso.nm_usuario || '.'
            );

            p_qt_alertas := p_qt_alertas + 1;
        END IF;
    END LOOP;

    prc_sh_grava_log('PRC_SH_DETECTA_ATRASOS',
        'Rotina concluida. Alertas gerados: ' || p_qt_alertas);
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        prc_sh_grava_log('PRC_SH_DETECTA_ATRASOS', 'Erro: ' || SQLERRM);
        raise_application_error(-20211,
            'Falha ao detectar atrasos: ' || SQLERRM);
END prc_sh_detecta_atrasos;
/

-- ---------------------------------------------------------------------
-- PRC_SH_GERA_RESUMO_MENSAL
-- Recarrega SH_RESUMO_USUARIO_MES para a competencia informada.
--
-- A leitura usa BULK COLLECT e a gravacao usa FORALL: em vez de ir e
-- voltar entre o motor PL/SQL e o motor SQL uma vez por morador, os
-- dados sobem de uma vez e descem de uma vez. Com a base pequena da
-- demonstracao a diferenca e pequena, mas o padrao e o que sustenta a
-- rotina quando a vizinhanca cresce.
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE prc_sh_gera_resumo_mensal (
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
           fn_sh_indice_circularidade(u.id_usuario, p_nr_ano_mes)          AS vl_indice_circularidade,
           fn_sh_reputacao(u.id_usuario)                                   AS vl_reputacao,
           SYSDATE                                                         AS dt_processamento
      BULK COLLECT INTO v_resumo
      FROM sh_usuario u
     WHERE u.st_usuario = 'A';

    FORALL i IN 1 .. v_resumo.COUNT
        INSERT INTO sh_resumo_usuario_mes VALUES v_resumo(i);

    p_qt_linhas := v_resumo.COUNT;

    prc_sh_grava_log('PRC_SH_GERA_RESUMO_MENSAL',
        'Competencia ' || p_nr_ano_mes || ' processada. Linhas gravadas: ' || p_qt_linhas);
    COMMIT;
EXCEPTION
    WHEN e_competencia_invalida THEN
        ROLLBACK;
        raise_application_error(-20212,
            'Competencia invalida em PRC_SH_GERA_RESUMO_MENSAL. Use o formato AAAAMM.');
    WHEN OTHERS THEN
        ROLLBACK;
        prc_sh_grava_log('PRC_SH_GERA_RESUMO_MENSAL',
            'Competencia ' || p_nr_ano_mes || '. Erro: ' || SQLERRM);
        raise_application_error(-20213,
            'Falha ao gerar o resumo mensal: ' || SQLERRM);
END prc_sh_gera_resumo_mensal;
/

SHOW ERRORS;
