-- =====================================================================
-- Smart HAS - Fase 7
-- 03_pkg_log.sql - PKG_SH_LOG, a rotina de log do projeto
--
-- Compilado antes dos demais pacotes porque todos chamam
-- PKG_SH_LOG.GRAVA dentro dos seus blocos EXCEPTION. Se ele nao
-- existir primeiro, os outros objetos compilam invalidos.
-- =====================================================================

CREATE OR REPLACE PACKAGE pkg_sh_log AS
    -- Registra a ocorrencia em SH_LOG_SISTEMA numa transacao propria.
    PROCEDURE grava (
        p_nm_origem   IN sh_log_sistema.nm_origem%TYPE,
        p_ds_mensagem IN sh_log_sistema.ds_mensagem%TYPE
    );
END pkg_sh_log;
/

CREATE OR REPLACE PACKAGE BODY pkg_sh_log AS

    -- Por que transacao autonoma: quando uma rotina falha no meio, quem
    -- chamou normalmente faz ROLLBACK. Sem PRAGMA AUTONOMOUS_TRANSACTION
    -- o log do erro seria desfeito junto e o problema sumiria. Com ela, o
    -- log tem COMMIT proprio e sobrevive ao rollback.
    PROCEDURE grava (
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
    END grava;

END pkg_sh_log;
/
