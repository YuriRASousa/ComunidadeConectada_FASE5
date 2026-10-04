-- =====================================================================
-- Smart HAS - Fase 6
-- 03_functions.sql - functions PL/SQL
--
-- Todas seguem o mesmo padrao: parametros somente IN, heranca de tipo
-- com %TYPE, comentarios explicando a regra e bloco EXCEPTION. Nenhuma
-- delas executa DML, justamente para poderem ser chamadas dentro de
-- comandos SELECT.
-- =====================================================================

-- ---------------------------------------------------------------------
-- FN_SH_REPUTACAO
-- Media das notas que o morador recebeu nas avaliacoes de emprestimo.
-- Morador sem avaliacao comeca com 5, que e a nota inicial do cadastro.
-- Uso: SELECT nm_usuario, fn_sh_reputacao(id_usuario) FROM sh_usuario;
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sh_reputacao (
    p_id_usuario IN sh_usuario.id_usuario%TYPE
) RETURN NUMBER
IS
    v_media       NUMBER(3,2);
    v_qt_notas    PLS_INTEGER;
BEGIN
    -- COUNT e AVG nunca levantam NO_DATA_FOUND, entao o teste de
    -- quantidade e o que separa "sem avaliacao" de "media baixa".
    SELECT COUNT(*), ROUND(AVG(nr_nota), 2)
      INTO v_qt_notas, v_media
      FROM sh_avaliacao
     WHERE id_avaliado = p_id_usuario;

    IF v_qt_notas = 0 THEN
        RETURN 5;
    END IF;

    RETURN v_media;
EXCEPTION
    WHEN OTHERS THEN
        -- Reputacao nunca deve derrubar uma consulta de listagem:
        -- em caso de erro devolve a nota neutra e deixa rastro no log.
        prc_sh_grava_log('FN_SH_REPUTACAO',
                         'Falha ao calcular reputacao do usuario ' || p_id_usuario ||
                         '. Erro: ' || SQLERRM);
        RETURN 5;
END fn_sh_reputacao;
/

-- ---------------------------------------------------------------------
-- FN_SH_INDICE_CIRCULARIDADE
-- Indicador principal do projeto: quantos emprestimos cada recurso
-- publicado pelo morador gerou no mes. Acima de 1 significa que o
-- acervo dele girou mais de uma vez, que e exatamente o objetivo da
-- plataforma: item parado voltando a circular.
--
-- p_nr_ano_mes no formato AAAAMM (por exemplo 202609).
-- Uso: SELECT fn_sh_indice_circularidade(2, 202609) FROM dual;
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sh_indice_circularidade (
    p_id_usuario IN sh_usuario.id_usuario%TYPE,
    p_nr_ano_mes IN NUMBER
) RETURN NUMBER
IS
    v_dt_inicio    DATE;
    v_dt_fim       DATE;
    v_qt_acervo    PLS_INTEGER := 0;
    v_qt_emprest   PLS_INTEGER := 0;
    v_indice       NUMBER(5,2) := 0;

    e_competencia_invalida EXCEPTION;
BEGIN
    IF p_nr_ano_mes IS NULL OR LENGTH(TO_CHAR(p_nr_ano_mes)) <> 6 THEN
        RAISE e_competencia_invalida;
    END IF;

    v_dt_inicio := TO_DATE(TO_CHAR(p_nr_ano_mes) || '01', 'YYYYMMDD');
    v_dt_fim    := LAST_DAY(v_dt_inicio) + 1;   -- limite superior exclusivo

    -- Acervo: tudo que o morador ja tinha publicado ate o fim do mes.
    SELECT COUNT(*)
      INTO v_qt_acervo
      FROM sh_recurso
     WHERE id_usuario  = p_id_usuario
       AND dt_cadastro < v_dt_fim;

    -- Giro: emprestimos dos recursos dele que comecaram dentro do mes.
    SELECT COUNT(*)
      INTO v_qt_emprest
      FROM sh_emprestimo e
           INNER JOIN sh_recurso r ON (r.id_recurso = e.id_recurso)
     WHERE r.id_usuario      = p_id_usuario
       AND e.dt_solicitacao >= v_dt_inicio
       AND e.dt_solicitacao  < v_dt_fim
       AND e.st_emprestimo  <> 'CANCELADO';

    IF v_qt_acervo = 0 THEN
        RETURN 0;   -- sem acervo nao existe circularidade a medir
    END IF;

    v_indice := ROUND(v_qt_emprest / v_qt_acervo, 2);
    RETURN v_indice;
EXCEPTION
    WHEN e_competencia_invalida THEN
        raise_application_error(-20101,
            'Competencia invalida em FN_SH_INDICE_CIRCULARIDADE. Use o formato AAAAMM.');
    WHEN ZERO_DIVIDE THEN
        RETURN 0;
    WHEN OTHERS THEN
        prc_sh_grava_log('FN_SH_INDICE_CIRCULARIDADE',
                         'Usuario ' || p_id_usuario || ', competencia ' || p_nr_ano_mes ||
                         '. Erro: ' || SQLERRM);
        RETURN 0;
END fn_sh_indice_circularidade;
/

-- ---------------------------------------------------------------------
-- FN_SH_FICHA_RECURSO
-- Devolve o recurso em uma linha ja formatada, do jeito que o app e o
-- painel exibem. Concentra a formatacao no banco para que aplicativo,
-- painel e relatorio mostrem exatamente o mesmo texto.
-- Uso: SELECT fn_sh_ficha_recurso(id_recurso) FROM sh_recurso;
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sh_ficha_recurso (
    p_id_recurso IN sh_recurso.id_recurso%TYPE
) RETURN VARCHAR2
IS
    v_ficha        VARCHAR2(600);
    v_nm_recurso   sh_recurso.nm_recurso%TYPE;
    v_categoria    sh_categoria.nm_categoria%TYPE;
    v_condicao     sh_recurso.ds_condicao%TYPE;
    v_tipo         sh_recurso.ds_tipo%TYPE;
    v_disp         sh_recurso.ds_disponibilidade%TYPE;
    v_dono         sh_usuario.nm_usuario%TYPE;
    v_id_dono      sh_usuario.id_usuario%TYPE;
    v_dt_cadastro  sh_recurso.dt_cadastro%TYPE;
BEGIN
    SELECT r.nm_recurso, c.nm_categoria, r.ds_condicao, r.ds_tipo,
           r.ds_disponibilidade, u.nm_usuario, u.id_usuario, r.dt_cadastro
      INTO v_nm_recurso, v_categoria, v_condicao, v_tipo,
           v_disp, v_dono, v_id_dono, v_dt_cadastro
      FROM sh_recurso r
           INNER JOIN sh_categoria c ON (c.id_categoria = r.id_categoria)
           INNER JOIN sh_usuario   u ON (u.id_usuario   = r.id_usuario)
     WHERE r.id_recurso = p_id_recurso;

    -- INITCAP deixa EMPRESTIMO como Emprestimo, que e como o app mostra.
    v_ficha := '#' || LPAD(TO_CHAR(p_id_recurso), 4, '0') || ' '
            || v_nm_recurso
            || ' | ' || INITCAP(v_categoria)
            || ' | estado ' || INITCAP(v_condicao)
            || ' | ' || INITCAP(v_tipo)
            || ' | ' || INITCAP(v_disp)
            || ' | oferecido por ' || v_dono
            || ' (' || TO_CHAR(fn_sh_reputacao(v_id_dono), 'FM9D00') || ' estrelas)'
            || ' | publicado em ' || TO_CHAR(v_dt_cadastro, 'DD/MM/YYYY');

    RETURN v_ficha;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 'Recurso ' || p_id_recurso || ' nao encontrado.';
    WHEN TOO_MANY_ROWS THEN
        -- So aconteceria com duplicidade de chave, que as constraints
        -- impedem. Fica registrado porque indicaria corrupcao de dados.
        prc_sh_grava_log('FN_SH_FICHA_RECURSO',
                         'Mais de um registro para o recurso ' || p_id_recurso);
        RETURN 'Recurso ' || p_id_recurso || ' com cadastro duplicado.';
    WHEN OTHERS THEN
        prc_sh_grava_log('FN_SH_FICHA_RECURSO',
                         'Recurso ' || p_id_recurso || '. Erro: ' || SQLERRM);
        RETURN 'Recurso ' || p_id_recurso || ' indisponivel para exibicao.';
END fn_sh_ficha_recurso;
/

-- ---------------------------------------------------------------------
-- FN_SH_DISTANCIA_KM
-- Distancia em quilometros entre duas coordenadas (formula de
-- Haversine). E o que ordena a lista do aplicativo por proximidade:
-- a retirada acontece a pe, entao o item mais perto vale mais.
-- Uso: SELECT nm_recurso, fn_sh_distancia_km(-23.5551, -46.6602, vl_latitude, vl_longitude) km
--        FROM sh_recurso ORDER BY 2;
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sh_distancia_km (
    p_lat_origem  IN NUMBER,
    p_lon_origem  IN NUMBER,
    p_lat_destino IN NUMBER,
    p_lon_destino IN NUMBER
) RETURN NUMBER DETERMINISTIC
IS
    c_raio_terra CONSTANT NUMBER := 6371;   -- km
    v_dlat       NUMBER;
    v_dlon       NUMBER;
    v_a          NUMBER;
BEGIN
    -- Coordenada ausente nao vira erro: o recurso apenas fica sem
    -- distancia calculada e o app o exibe no fim da lista.
    IF p_lat_origem IS NULL OR p_lon_origem IS NULL
       OR p_lat_destino IS NULL OR p_lon_destino IS NULL THEN
        RETURN NULL;
    END IF;

    v_dlat := (p_lat_destino - p_lat_origem) * ACOS(-1) / 180;
    v_dlon := (p_lon_destino - p_lon_origem) * ACOS(-1) / 180;

    v_a := POWER(SIN(v_dlat / 2), 2)
         + COS(p_lat_origem  * ACOS(-1) / 180)
         * COS(p_lat_destino * ACOS(-1) / 180)
         * POWER(SIN(v_dlon / 2), 2);

    RETURN ROUND(c_raio_terra * 2 * ATAN2(SQRT(v_a), SQRT(1 - v_a)), 2);
EXCEPTION
    WHEN OTHERS THEN
        -- Marcada como DETERMINISTIC, entao nao grava log nem faz DML:
        -- coordenada ruim apenas deixa o item sem distancia calculada.
        RETURN NULL;
END fn_sh_distancia_km;
/

SHOW ERRORS;
