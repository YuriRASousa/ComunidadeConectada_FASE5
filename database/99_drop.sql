-- =====================================================================
-- Smart HAS - Fase 6
-- 99_drop.sql - remove tudo que os demais scripts criam
--
-- Util para reexecutar a carga do zero. Nao falha quando o objeto ainda
-- nao existe: cada DROP roda dentro de um bloco que ignora o erro de
-- objeto inexistente.
-- =====================================================================

DECLARE
    PROCEDURE dropa(p_comando IN VARCHAR2) IS
    BEGIN
        EXECUTE IMMEDIATE p_comando;
        dbms_output.put_line('ok: ' || p_comando);
    EXCEPTION
        WHEN OTHERS THEN
            -- -942 tabela inexistente, -2289 sequence inexistente,
            -- -4043 objeto inexistente (procedure/function)
            IF SQLCODE IN (-942, -2289, -4043) THEN
                dbms_output.put_line('ja nao existia: ' || p_comando);
            ELSE
                RAISE;
            END IF;
    END dropa;
BEGIN
    -- Subprogramas primeiro, para nao travar em dependencia
    dropa('DROP PROCEDURE prc_sh_gera_resumo_mensal');
    dropa('DROP PROCEDURE prc_sh_detecta_atrasos');
    dropa('DROP PROCEDURE prc_sh_registra_devolucao');
    dropa('DROP PROCEDURE prc_sh_registra_emprestimo');
    dropa('DROP PROCEDURE prc_sh_atualiza_reputacao');
    dropa('DROP FUNCTION  fn_sh_distancia_km');
    dropa('DROP FUNCTION  fn_sh_ficha_recurso');
    dropa('DROP FUNCTION  fn_sh_indice_circularidade');
    dropa('DROP FUNCTION  fn_sh_reputacao');
    dropa('DROP PROCEDURE prc_sh_grava_log');

    -- Tabelas na ordem inversa das dependencias
    dropa('DROP TABLE sh_resumo_usuario_mes CASCADE CONSTRAINTS');
    dropa('DROP TABLE sh_alerta             CASCADE CONSTRAINTS');
    dropa('DROP TABLE sh_avaliacao          CASCADE CONSTRAINTS');
    dropa('DROP TABLE sh_emprestimo         CASCADE CONSTRAINTS');
    dropa('DROP TABLE sh_mensagem           CASCADE CONSTRAINTS');
    dropa('DROP TABLE sh_recurso            CASCADE CONSTRAINTS');
    dropa('DROP TABLE sh_usuario            CASCADE CONSTRAINTS');
    dropa('DROP TABLE sh_categoria          CASCADE CONSTRAINTS');
    dropa('DROP TABLE sh_log_sistema        CASCADE CONSTRAINTS');

    -- Sequences
    dropa('DROP SEQUENCE sq_sh_log_sistema');
    dropa('DROP SEQUENCE sq_sh_alerta');
    dropa('DROP SEQUENCE sq_sh_avaliacao');
    dropa('DROP SEQUENCE sq_sh_emprestimo');
    dropa('DROP SEQUENCE sq_sh_mensagem');
    dropa('DROP SEQUENCE sq_sh_recurso');
    dropa('DROP SEQUENCE sq_sh_usuario');
    dropa('DROP SEQUENCE sq_sh_categoria');
END;
/
