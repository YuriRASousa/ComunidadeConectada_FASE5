-- =====================================================================
-- Smart HAS - Fase 6
-- 03_log.sql - rotina de log, compilada antes das demais
--
-- Fica em arquivo separado porque as functions e as procedures do
-- projeto chamam PRC_SH_GRAVA_LOG dentro dos seus blocos EXCEPTION.
-- Se ela nao existir primeiro, os outros objetos compilam invalidos.
-- =====================================================================

-- ---------------------------------------------------------------------
-- PRC_SH_GRAVA_LOG
-- Registra a ocorrencia em SH_LOG_SISTEMA usando transacao autonoma.
--
-- Por que autonoma: quando uma rotina falha no meio, quem chamou
-- normalmente faz ROLLBACK. Sem PRAGMA AUTONOMOUS_TRANSACTION o log do
-- erro seria desfeito junto e o problema sumiria. Com ela, o log tem
-- transacao propria, com COMMIT independente, e sobrevive ao rollback.
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE prc_sh_grava_log (
    p_nm_origem   IN sh_log_sistema.nm_origem%TYPE,
    p_ds_mensagem IN sh_log_sistema.ds_mensagem%TYPE
) IS
    PRAGMA AUTONOMOUS_TRANSACTION;
BEGIN
    INSERT INTO sh_log_sistema (id_log, nm_origem, dt_log, ds_mensagem)
    VALUES (sq_sh_log_sistema.NEXTVAL, p_nm_origem, SYSDATE,
            SUBSTR(p_ds_mensagem, 1, 4000));
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        -- Log que falha nao pode derrubar a rotina de negocio que o
        -- chamou, entao o erro morre aqui mesmo.
        ROLLBACK;
END prc_sh_grava_log;
/

SHOW ERRORS;
