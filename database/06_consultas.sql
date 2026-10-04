-- =====================================================================
-- Smart HAS - Fase 6
-- 06_consultas.sql - uso pratico das functions e das procedures
--
-- Script de demonstracao: cada bloco mostra uma function dentro de uma
-- consulta SQL comum ou uma procedure sendo executada. E o roteiro
-- usado no video e na defesa do trabalho.
-- =====================================================================

SET SERVEROUTPUT ON;
SET LINESIZE 200;
SET PAGESIZE 100;

-- ---------------------------------------------------------------------
-- 1. Catalogo do jeito que o aplicativo mostra
--    FN_SH_FICHA_RECURSO concentra a formatacao no banco.
-- ---------------------------------------------------------------------
COLUMN ficha FORMAT A150;
SELECT fn_sh_ficha_recurso(id_recurso) AS ficha
  FROM sh_recurso
 WHERE ds_disponibilidade = 'DISPONIVEL'
 ORDER BY dt_cadastro DESC
 FETCH FIRST 8 ROWS ONLY;

-- ---------------------------------------------------------------------
-- 2. O que esta perto de quem procura
--    FN_SH_DISTANCIA_KM ordenando a vitrine por proximidade, a partir
--    de um ponto de referencia (aqui, a Rua Augusta).
-- ---------------------------------------------------------------------
COLUMN nm_recurso FORMAT A40;
COLUMN nm_usuario FORMAT A24;
SELECT r.nm_recurso,
       u.nm_usuario,
       fn_sh_distancia_km(-23.5561, -46.6603, r.vl_latitude, r.vl_longitude) AS km
  FROM sh_recurso r
       INNER JOIN sh_usuario u ON (u.id_usuario = r.id_usuario)
 WHERE r.ds_disponibilidade = 'DISPONIVEL'
 ORDER BY km NULLS LAST
 FETCH FIRST 10 ROWS ONLY;

-- ---------------------------------------------------------------------
-- 3. Ranking de circularidade do mes corrente
--    FN_SH_INDICE_CIRCULARIDADE respondendo quem mais fez o proprio
--    acervo girar. Indice 1,00 significa um emprestimo por item.
-- ---------------------------------------------------------------------
SELECT u.nm_usuario,
       (SELECT COUNT(*) FROM sh_recurso r WHERE r.id_usuario = u.id_usuario) AS itens_publicados,
       fn_sh_indice_circularidade(u.id_usuario, TO_NUMBER(TO_CHAR(SYSDATE, 'YYYYMM'))) AS indice_mes,
       fn_sh_reputacao(u.id_usuario) AS reputacao
  FROM sh_usuario u
 WHERE u.st_usuario = 'A'
   AND u.ds_papel   = 'USER'
 ORDER BY indice_mes DESC, reputacao DESC;

-- ---------------------------------------------------------------------
-- 4. Reputacao calculada x reputacao gravada
--    Serve para conferir se PRC_SH_ATUALIZA_REPUTACAO esta em dia.
-- ---------------------------------------------------------------------
SELECT u.nm_usuario,
       u.vl_reputacao          AS gravada,
       fn_sh_reputacao(u.id_usuario) AS calculada,
       CASE WHEN u.vl_reputacao = fn_sh_reputacao(u.id_usuario)
            THEN 'ok' ELSE 'recalcular' END AS situacao
  FROM sh_usuario u
 WHERE u.ds_papel = 'USER'
 ORDER BY u.nm_usuario;

-- ---------------------------------------------------------------------
-- 5. Rotina de vigilancia: gera os alertas de atraso
-- ---------------------------------------------------------------------
DECLARE
    v_qt NUMBER;
BEGIN
    prc_sh_detecta_atrasos(v_qt);
    dbms_output.put_line('Alertas de atraso gerados agora: ' || v_qt);
END;
/

COLUMN ds_mensagem FORMAT A90;
SELECT id_alerta, ds_tipo, ds_severidade, ds_mensagem,
       TO_CHAR(dt_alerta, 'DD/MM/YYYY HH24:MI') AS quando
  FROM sh_alerta
 WHERE fl_resolvido = 'N'
 ORDER BY DECODE(ds_severidade, 'ALTA', 1, 'MEDIA', 2, 3), dt_alerta;

-- ---------------------------------------------------------------------
-- 6. Rotina de consolidacao: recarrega o resumo do mes corrente
-- ---------------------------------------------------------------------
DECLARE
    v_linhas NUMBER;
BEGIN
    prc_sh_gera_resumo_mensal(TO_NUMBER(TO_CHAR(SYSDATE, 'YYYYMM')), v_linhas);
    dbms_output.put_line('Linhas gravadas no resumo: ' || v_linhas);
END;
/

SELECT nm_usuario,
       qt_recursos_publicados    AS itens,
       qt_emprestimos_concedidos AS emprestou,
       qt_emprestimos_tomados    AS pegou,
       qt_devolucoes_atraso      AS atrasos,
       vl_indice_circularidade   AS circularidade,
       vl_reputacao              AS reputacao
  FROM sh_resumo_usuario_mes
 WHERE nr_ano_mes = TO_NUMBER(TO_CHAR(SYSDATE, 'YYYYMM'))
 ORDER BY vl_indice_circularidade DESC;

-- ---------------------------------------------------------------------
-- 7. Ciclo completo de um emprestimo, do pedido a devolucao avaliada.
--    E o mesmo caminho que o backend Java percorre por JDBC.
-- ---------------------------------------------------------------------
DECLARE
    v_id_emprestimo NUMBER;
    v_retorno       VARCHAR2(400);
BEGIN
    -- recurso 13 (kit de chaves, da Leticia) solicitado pelo morador 2
    prc_sh_registra_emprestimo(
        p_id_recurso     => 13,
        p_id_solicitante => 2,
        p_qt_dias        => 5,
        p_id_emprestimo  => v_id_emprestimo,
        p_ds_retorno     => v_retorno
    );
    dbms_output.put_line(v_retorno);

    prc_sh_registra_devolucao(
        p_id_emprestimo => v_id_emprestimo,
        p_nr_nota       => 5,
        p_ds_comentario => 'Kit completo e limpo, tudo certo.',
        p_ds_retorno    => v_retorno
    );
    dbms_output.put_line(v_retorno);
END;
/

-- ---------------------------------------------------------------------
-- 8. Regras de negocio recusando operacao invalida
--    Mostra o RAISE_APPLICATION_ERROR chegando pronto para a interface.
-- ---------------------------------------------------------------------
DECLARE
    v_id      NUMBER;
    v_retorno VARCHAR2(400);
BEGIN
    -- o dono do recurso 1 e o usuario 2, entao ele nao pode pegar
    -- emprestado o proprio item
    prc_sh_registra_emprestimo(1, 2, 7, v_id, v_retorno);
EXCEPTION
    WHEN OTHERS THEN
        dbms_output.put_line('Erro esperado: ' || SQLERRM);
END;
/

-- ---------------------------------------------------------------------
-- 9. Trilha de execucao das rotinas
-- ---------------------------------------------------------------------
COLUMN nm_origem FORMAT A28;
COLUMN ds_mensagem FORMAT A100;
SELECT TO_CHAR(dt_log, 'DD/MM HH24:MI:SS') AS quando, nm_origem, ds_mensagem
  FROM sh_log_sistema
 ORDER BY id_log DESC
 FETCH FIRST 15 ROWS ONLY;
