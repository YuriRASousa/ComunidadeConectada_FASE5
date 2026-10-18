-- =====================================================================
-- Smart HAS - Fase 7
-- remover_rotinas_avulsas.sql
--
-- Ultimo passo da migracao: depois de testar os pacotes, elimina as
-- procedures e functions soltas da Fase 6, cujo codigo agora vive em
-- PKG_SH_LOG, PKG_SH_CALCULOS, PKG_SH_EMPRESTIMO e PKG_SH_ADMIN.
-- Quem ainda chamar o nome antigo (backend, scripts) passa a falhar,
-- por isso so rode depois de atualizar o backend.
--
-- Pode rodar mais de uma vez: objeto que ja nao existe e ignorado.
-- =====================================================================

DECLARE
    PROCEDURE tenta(p_comando IN VARCHAR2) IS
    BEGIN
        EXECUTE IMMEDIATE p_comando;
    EXCEPTION
        WHEN OTHERS THEN
            -- -4043 objeto inexistente
            IF SQLCODE <> -4043 THEN
                RAISE;
            END IF;
    END tenta;
BEGIN
    tenta('DROP PROCEDURE prc_sh_gera_resumo_mensal');
    tenta('DROP PROCEDURE prc_sh_detecta_atrasos');
    tenta('DROP PROCEDURE prc_sh_registra_devolucao');
    tenta('DROP PROCEDURE prc_sh_registra_emprestimo');
    tenta('DROP PROCEDURE prc_sh_atualiza_reputacao');
    tenta('DROP FUNCTION  fn_sh_distancia_km');
    tenta('DROP FUNCTION  fn_sh_ficha_recurso');
    tenta('DROP FUNCTION  fn_sh_indice_circularidade');
    tenta('DROP FUNCTION  fn_sh_reputacao');
    tenta('DROP PROCEDURE prc_sh_grava_log');
END;
/
