-- =====================================================================
-- Smart HAS - Fase 7
-- 07_triggers.sql - triggers de automacao e de auditoria
--
-- Tres gatilhos, um por papel, sem duas triggers para o mesmo evento na
-- mesma tabela (boa pratica do material):
--
--   TRG_SH_EMPRESTIMO_BU   automacao e regra: BEFORE UPDATE do status
--   TRG_SH_EMPRESTIMO_AUD  auditoria + liberacao do item: AFTER I/U/D
--   TRG_SH_USUARIO_AUD     auditoria de papel, status e verificacao
--
-- Rodam depois da carga (02_seed.sql), para a carga inicial nao encher
-- a trilha de auditoria com 12 emprestimos de mentira.
-- =====================================================================

-- ---------------------------------------------------------------------
-- TRG_SH_EMPRESTIMO_BU
-- Cuida do que o status do emprestimo precisa arrastar consigo:
--   * DEVOLVIDO e CANCELADO sao estados finais: nao voltam atras;
--   * ATIVO nao volta para SOLICITADO;
--   * ao virar ATIVO, a data de retirada e preenchida sozinha;
--   * ao virar DEVOLVIDO, a data de devolucao e preenchida sozinha.
-- Assim a regra vale para qualquer porta de entrada: procedure, painel,
-- script manual. So dispara quando o status realmente muda (WHEN).
-- ---------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_sh_emprestimo_bu
BEFORE UPDATE OF st_emprestimo ON sh_emprestimo
FOR EACH ROW
WHEN (NEW.st_emprestimo <> OLD.st_emprestimo)
BEGIN
    IF :OLD.st_emprestimo IN ('DEVOLVIDO', 'CANCELADO') THEN
        raise_application_error(-20301,
            'Emprestimo ' || :OLD.id_emprestimo || ' ja esta ' || :OLD.st_emprestimo ||
            ' e nao pode mudar para ' || :NEW.st_emprestimo || '.');
    END IF;

    IF :OLD.st_emprestimo = 'ATIVO' AND :NEW.st_emprestimo = 'SOLICITADO' THEN
        raise_application_error(-20302,
            'Emprestimo ' || :OLD.id_emprestimo || ' ja foi retirado e nao volta para SOLICITADO.');
    END IF;

    IF :NEW.st_emprestimo = 'ATIVO' AND :NEW.dt_retirada IS NULL THEN
        :NEW.dt_retirada := SYSDATE;
    END IF;

    IF :NEW.st_emprestimo = 'DEVOLVIDO' AND :NEW.dt_devolucao IS NULL THEN
        :NEW.dt_devolucao := SYSDATE;
    END IF;
END trg_sh_emprestimo_bu;
/

-- ---------------------------------------------------------------------
-- TRG_SH_EMPRESTIMO_AUD
-- Grava em SH_AUDITORIA quem fez o que em cada emprestimo (INSERT,
-- UPDATE e DELETE, com INSERTING/UPDATING/DELETING) e, quando o
-- emprestimo e cancelado, devolve o recurso para a vitrine.
-- ---------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_sh_emprestimo_aud
AFTER INSERT OR UPDATE OR DELETE ON sh_emprestimo
FOR EACH ROW
DECLARE
    v_operacao VARCHAR2(10);
    v_id       sh_emprestimo.id_emprestimo%TYPE;
    v_antes    VARCHAR2(1000);
    v_depois   VARCHAR2(1000);

    FUNCTION resumo(p_status IN VARCHAR2, p_recurso IN NUMBER, p_solic IN NUMBER,
                    p_prev IN DATE, p_dev IN DATE) RETURN VARCHAR2 IS
    BEGIN
        RETURN 'status=' || p_status || '; recurso=' || p_recurso || '; solicitante=' || p_solic
            || '; prev=' || TO_CHAR(p_prev, 'DD/MM/YYYY') || '; devolucao=' || TO_CHAR(p_dev, 'DD/MM/YYYY HH24:MI');
    END resumo;
BEGIN
    IF INSERTING THEN
        v_operacao := 'INSERT';
        v_id       := :NEW.id_emprestimo;
        v_depois   := resumo(:NEW.st_emprestimo, :NEW.id_recurso, :NEW.id_solicitante,
                             :NEW.dt_prev_devolucao, :NEW.dt_devolucao);
    ELSIF UPDATING THEN
        v_operacao := 'UPDATE';
        v_id       := :NEW.id_emprestimo;
        v_antes    := resumo(:OLD.st_emprestimo, :OLD.id_recurso, :OLD.id_solicitante,
                             :OLD.dt_prev_devolucao, :OLD.dt_devolucao);
        v_depois   := resumo(:NEW.st_emprestimo, :NEW.id_recurso, :NEW.id_solicitante,
                             :NEW.dt_prev_devolucao, :NEW.dt_devolucao);
    ELSE
        v_operacao := 'DELETE';
        v_id       := :OLD.id_emprestimo;
        v_antes    := resumo(:OLD.st_emprestimo, :OLD.id_recurso, :OLD.id_solicitante,
                             :OLD.dt_prev_devolucao, :OLD.dt_devolucao);
    END IF;

    INSERT INTO sh_auditoria (id_auditoria, nm_tabela, tp_operacao, id_registro,
                              nm_usuario_bd, dt_evento, ds_antes, ds_depois)
    VALUES (sq_sh_auditoria.NEXTVAL, 'SH_EMPRESTIMO', v_operacao, v_id,
            USER, SYSDATE, v_antes, v_depois);

    -- Automacao: emprestimo cancelado libera o item na vitrine, mas so se
    -- ele estava reservado por causa deste emprestimo.
    IF UPDATING AND :NEW.st_emprestimo = 'CANCELADO' AND :OLD.st_emprestimo <> 'CANCELADO' THEN
        UPDATE sh_recurso
           SET ds_disponibilidade = 'DISPONIVEL',
               dt_atualizacao     = SYSDATE
         WHERE id_recurso         = :NEW.id_recurso
           AND ds_disponibilidade = 'RESERVADO';
    END IF;
END trg_sh_emprestimo_aud;
/

-- ---------------------------------------------------------------------
-- TRG_SH_USUARIO_AUD
-- Auditoria de seguranca: mudar o papel (USER/ADMIN), desativar a conta
-- ou marcar como verificado sao decisoes que precisam deixar rastro.
-- Observe que a senha (hash) NAO e lida aqui: a trilha nunca guarda
-- credencial. A trigger so dispara nessas tres colunas (UPDATE OF).
-- ---------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_sh_usuario_aud
AFTER UPDATE OF ds_papel, st_usuario, fl_verificado ON sh_usuario
FOR EACH ROW
WHEN (OLD.ds_papel <> NEW.ds_papel OR OLD.st_usuario <> NEW.st_usuario
      OR OLD.fl_verificado <> NEW.fl_verificado)
BEGIN
    INSERT INTO sh_auditoria (id_auditoria, nm_tabela, tp_operacao, id_registro,
                              nm_usuario_bd, dt_evento, ds_antes, ds_depois)
    VALUES (sq_sh_auditoria.NEXTVAL, 'SH_USUARIO', 'UPDATE', :NEW.id_usuario,
            USER, SYSDATE,
            'papel=' || :OLD.ds_papel || '; status=' || :OLD.st_usuario || '; verificado=' || :OLD.fl_verificado,
            'papel=' || :NEW.ds_papel || '; status=' || :NEW.st_usuario || '; verificado=' || :NEW.fl_verificado);
END trg_sh_usuario_aud;
/
