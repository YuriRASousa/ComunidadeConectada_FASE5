package br.com.fiap.smarthas.repository;

import br.com.fiap.smarthas.dto.emprestimo.EmprestimoResponse;
import br.com.fiap.smarthas.dto.emprestimo.ProcedimentoResultado;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Types;
import java.util.List;
import java.util.Map;

/**
 * Ponte entre o backend Java e as procedures PL/SQL do Smart HAS.
 *
 * <p>Este e o ponto onde a Fase 6 encosta nas duas pontas: o aplicativo faz
 * uma chamada REST, o Spring cai aqui e a regra de negocio roda dentro do
 * Oracle. O Java nao decide se o emprestimo pode acontecer; ele so passa os
 * parametros e traduz o erro que a procedure devolve.</p>
 *
 * <p>Os parametros sao declarados na mao em vez de dependerem da leitura de
 * metadados do dicionario, que exige privilegios extras no schema do aluno.</p>
 */
@Repository
public class JdbcEmprestimoRepository {

    private final JdbcTemplate jdbc;
    private final SimpleJdbcCall chamadaRegistraEmprestimo;
    private final SimpleJdbcCall chamadaRegistraDevolucao;
    private final SimpleJdbcCall chamadaDetectaAtrasos;
    private final SimpleJdbcCall chamadaGeraResumo;

    public JdbcEmprestimoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;

        this.chamadaRegistraEmprestimo = new SimpleJdbcCall(jdbc)
                .withProcedureName("PRC_SH_REGISTRA_EMPRESTIMO")
                .withoutProcedureColumnMetaDataAccess()
                .declareParameters(
                        new SqlParameter("p_id_recurso", Types.NUMERIC),
                        new SqlParameter("p_id_solicitante", Types.NUMERIC),
                        new SqlParameter("p_qt_dias", Types.NUMERIC),
                        new SqlOutParameter("p_id_emprestimo", Types.NUMERIC),
                        new SqlOutParameter("p_ds_retorno", Types.VARCHAR));

        this.chamadaRegistraDevolucao = new SimpleJdbcCall(jdbc)
                .withProcedureName("PRC_SH_REGISTRA_DEVOLUCAO")
                .withoutProcedureColumnMetaDataAccess()
                .declareParameters(
                        new SqlParameter("p_id_emprestimo", Types.NUMERIC),
                        new SqlParameter("p_nr_nota", Types.NUMERIC),
                        new SqlParameter("p_ds_comentario", Types.VARCHAR),
                        new SqlOutParameter("p_ds_retorno", Types.VARCHAR));

        this.chamadaDetectaAtrasos = new SimpleJdbcCall(jdbc)
                .withProcedureName("PRC_SH_DETECTA_ATRASOS")
                .withoutProcedureColumnMetaDataAccess()
                .declareParameters(new SqlOutParameter("p_qt_alertas", Types.NUMERIC));

        this.chamadaGeraResumo = new SimpleJdbcCall(jdbc)
                .withProcedureName("PRC_SH_GERA_RESUMO_MENSAL")
                .withoutProcedureColumnMetaDataAccess()
                .declareParameters(
                        new SqlParameter("p_nr_ano_mes", Types.NUMERIC),
                        new SqlOutParameter("p_qt_linhas", Types.NUMERIC));
    }

    private final RowMapper<EmprestimoResponse> mapper = (rs, rowNum) -> new EmprestimoResponse(
            String.valueOf(rs.getLong("id_emprestimo")),
            String.valueOf(rs.getLong("id_recurso")),
            rs.getString("nm_recurso"),
            String.valueOf(rs.getLong("id_solicitante")),
            rs.getString("nm_solicitante"),
            rs.getString("nm_dono"),
            rs.getTimestamp("dt_solicitacao") != null ? rs.getTimestamp("dt_solicitacao").toInstant() : null,
            rs.getTimestamp("dt_prev_devolucao") != null ? rs.getTimestamp("dt_prev_devolucao").toInstant() : null,
            rs.getTimestamp("dt_devolucao") != null ? rs.getTimestamp("dt_devolucao").toInstant() : null,
            rs.getString("st_emprestimo"),
            rs.getInt("qt_dias_atraso"));

    private static final String SELECT_BASE = """
            SELECT e.id_emprestimo, e.id_recurso, r.nm_recurso, e.id_solicitante,
                   s.nm_usuario AS nm_solicitante, d.nm_usuario AS nm_dono,
                   e.dt_solicitacao, e.dt_prev_devolucao, e.dt_devolucao, e.st_emprestimo,
                   GREATEST(TRUNC(NVL(e.dt_devolucao, SYSDATE)) - TRUNC(e.dt_prev_devolucao), 0) AS qt_dias_atraso
              FROM sh_emprestimo e
                   INNER JOIN sh_recurso r ON (r.id_recurso = e.id_recurso)
                   INNER JOIN sh_usuario  s ON (s.id_usuario = e.id_solicitante)
                   INNER JOIN sh_usuario  d ON (d.id_usuario = r.id_usuario)
            """;

    /** Chama PRC_SH_REGISTRA_EMPRESTIMO. Toda validacao acontece no banco. */
    public ProcedimentoResultado registrarEmprestimo(long idRecurso, long idSolicitante, int dias) {
        Map<String, Object> retorno = chamadaRegistraEmprestimo.execute(new MapSqlParameterSource()
                .addValue("p_id_recurso", idRecurso)
                .addValue("p_id_solicitante", idSolicitante)
                .addValue("p_qt_dias", dias));

        Number id = (Number) retorno.get("p_id_emprestimo");
        return new ProcedimentoResultado(
                id != null ? String.valueOf(id.longValue()) : null,
                (String) retorno.get("p_ds_retorno"));
    }

    /** Chama PRC_SH_REGISTRA_DEVOLUCAO, com avaliacao opcional. */
    public ProcedimentoResultado registrarDevolucao(long idEmprestimo, Integer nota, String comentario) {
        Map<String, Object> retorno = chamadaRegistraDevolucao.execute(new MapSqlParameterSource()
                .addValue("p_id_emprestimo", idEmprestimo)
                .addValue("p_nr_nota", nota)
                .addValue("p_ds_comentario", comentario));

        return new ProcedimentoResultado(
                String.valueOf(idEmprestimo),
                (String) retorno.get("p_ds_retorno"));
    }

    /** Rotina de vigilancia: abre alerta para cada emprestimo vencido. */
    public int detectarAtrasos() {
        Map<String, Object> retorno = chamadaDetectaAtrasos.execute(new MapSqlParameterSource());
        Number qt = (Number) retorno.get("p_qt_alertas");
        return qt != null ? qt.intValue() : 0;
    }

    /** Rotina de consolidacao mensal, recarrega SH_RESUMO_USUARIO_MES. */
    public int gerarResumoMensal(int anoMes) {
        Map<String, Object> retorno = chamadaGeraResumo.execute(new MapSqlParameterSource()
                .addValue("p_nr_ano_mes", anoMes));
        Number qt = (Number) retorno.get("p_qt_linhas");
        return qt != null ? qt.intValue() : 0;
    }

    public List<EmprestimoResponse> findByUsuario(long idUsuario) {
        return jdbc.query(SELECT_BASE + """
                 WHERE e.id_solicitante = ? OR r.id_usuario = ?
                 ORDER BY e.dt_solicitacao DESC
                """, mapper, idUsuario, idUsuario);
    }

    public List<EmprestimoResponse> findEmAberto() {
        return jdbc.query(SELECT_BASE + """
                 WHERE e.st_emprestimo IN ('SOLICITADO', 'ATIVO')
                 ORDER BY e.dt_prev_devolucao
                """, mapper);
    }

    /** Indicador calculado pela function, exposto ao painel. */
    public BigDecimal indiceCircularidade(long idUsuario, int anoMes) {
        return jdbc.queryForObject(
                "SELECT fn_sh_indice_circularidade(?, ?) FROM dual",
                BigDecimal.class, idUsuario, anoMes);
    }

    /** Ficha formatada pela function, usada na tela de detalhe do item. */
    public String fichaRecurso(long idRecurso) {
        return jdbc.queryForObject(
                "SELECT fn_sh_ficha_recurso(?) FROM dual", String.class, idRecurso);
    }
}
