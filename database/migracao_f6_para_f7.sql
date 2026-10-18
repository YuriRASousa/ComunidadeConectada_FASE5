-- =====================================================================
-- Smart HAS - Fase 7
-- migracao_f6_para_f7.sql
--
-- Para o banco que ja esta instalado com a Fase 6: cria as duas tabelas
-- novas. Os pacotes e as triggers sao instalados em seguida pelo
-- executar_scripts.py --migrar. As procedures e functions soltas da
-- Fase 6 ficam ate o "DROP" de remover_rotinas_avulsas.sql, que e o
-- ultimo passo do exercicio guiado de packages (migrar, testar, eliminar).
--
-- Pode rodar mais de uma vez: cada comando ignora o erro de "ja existe"
-- ou "nao existe".
-- =====================================================================

DECLARE
    PROCEDURE tenta(p_comando IN VARCHAR2) IS
    BEGIN
        EXECUTE IMMEDIATE p_comando;
    EXCEPTION
        WHEN OTHERS THEN
            -- -955 ja existe, -942 tabela inexistente, -4043 objeto
            -- inexistente, -2289 sequence inexistente
            IF SQLCODE NOT IN (-955, -942, -4043, -2289) THEN
                RAISE;
            END IF;
    END tenta;
BEGIN
    tenta(q'[CREATE TABLE sh_auditoria (
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
)]');
    tenta(q'[CREATE TABLE sh_volumetria (
    id_volumetria NUMBER(12)   NOT NULL,
    dt_coleta     DATE         NOT NULL,
    nm_tabela     VARCHAR2(30) NOT NULL,
    qt_linhas     NUMBER(12)   NOT NULL,
    CONSTRAINT pk_sh_volumetria PRIMARY KEY (id_volumetria)
)]');
    tenta('CREATE SEQUENCE sq_sh_auditoria  START WITH 1 INCREMENT BY 1 NOCACHE');
    tenta('CREATE SEQUENCE sq_sh_volumetria START WITH 1 INCREMENT BY 1 NOCACHE');
    tenta('CREATE INDEX ix_sh_auditoria_registro ON sh_auditoria (nm_tabela, id_registro, dt_evento)');
    tenta('CREATE INDEX ix_sh_volumetria_coleta ON sh_volumetria (dt_coleta, nm_tabela)');
END;
/
