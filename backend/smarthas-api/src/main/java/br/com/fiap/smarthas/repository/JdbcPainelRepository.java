package br.com.fiap.smarthas.repository;

import br.com.fiap.smarthas.dto.admin.AlertaResponse;
import br.com.fiap.smarthas.dto.admin.ResumoUsuarioResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Leituras do painel do administrador que saem das tabelas alimentadas pelas
 * rotinas PL/SQL: SH_ALERTA e SH_RESUMO_USUARIO_MES.
 *
 * <p>Nenhuma agregacao acontece aqui. A tela so le o que a procedure ja
 * gravou, que e exatamente o ganho de manter a regra dentro do banco.</p>
 */
@Repository
public class JdbcPainelRepository {

    private final JdbcTemplate jdbc;

    public JdbcPainelRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<AlertaResponse> alertaMapper = (rs, rowNum) -> new AlertaResponse(
            String.valueOf(rs.getLong("id_alerta")),
            rs.getString("ds_tipo"),
            rs.getObject("id_referencia") != null ? String.valueOf(rs.getLong("id_referencia")) : null,
            rs.getString("ds_severidade"),
            rs.getString("ds_mensagem"),
            rs.getTimestamp("dt_alerta") != null ? rs.getTimestamp("dt_alerta").toInstant() : null,
            "S".equals(rs.getString("fl_resolvido")));

    private final RowMapper<ResumoUsuarioResponse> resumoMapper = (rs, rowNum) -> new ResumoUsuarioResponse(
            String.valueOf(rs.getLong("id_usuario")),
            rs.getString("nm_usuario"),
            rs.getInt("nr_ano_mes"),
            rs.getInt("qt_recursos_publicados"),
            rs.getInt("qt_emprestimos_concedidos"),
            rs.getInt("qt_emprestimos_tomados"),
            rs.getInt("qt_devolucoes_atraso"),
            rs.getBigDecimal("vl_indice_circularidade"),
            rs.getBigDecimal("vl_reputacao"));

    public List<AlertaResponse> alertasAbertos() {
        return jdbc.query("""
                SELECT id_alerta, ds_tipo, id_referencia, ds_severidade,
                       ds_mensagem, dt_alerta, fl_resolvido
                  FROM sh_alerta
                 WHERE fl_resolvido = 'N'
                 ORDER BY DECODE(ds_severidade, 'ALTA', 1, 'MEDIA', 2, 3), dt_alerta DESC
                """, alertaMapper);
    }

    public int resolverAlerta(long idAlerta) {
        return jdbc.update("UPDATE sh_alerta SET fl_resolvido = 'S' WHERE id_alerta = ?", idAlerta);
    }

    public List<ResumoUsuarioResponse> resumoDoMes(int anoMes) {
        return jdbc.query("""
                SELECT id_usuario, nm_usuario, nr_ano_mes, qt_recursos_publicados,
                       qt_emprestimos_concedidos, qt_emprestimos_tomados,
                       qt_devolucoes_atraso, vl_indice_circularidade, vl_reputacao
                  FROM sh_resumo_usuario_mes
                 WHERE nr_ano_mes = ?
                 ORDER BY vl_indice_circularidade DESC, nm_usuario
                """, resumoMapper, anoMes);
    }
}
