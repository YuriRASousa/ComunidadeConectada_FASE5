package br.com.fiap.smarthas.repository;

import br.com.fiap.smarthas.dto.admin.AlertaResponse;
import br.com.fiap.smarthas.dto.admin.RecursoBuscaResponse;
import br.com.fiap.smarthas.dto.admin.ResumoUsuarioResponse;
import br.com.fiap.smarthas.dto.admin.VolumetriaResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.CallableStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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
    private final SimpleJdbcCall chamadaVolumetria;

    public JdbcPainelRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        this.chamadaVolumetria = new SimpleJdbcCall(jdbc)
                .withCatalogName("PKG_SH_ADMIN")
                .withProcedureName("PRC_VOLUMETRIA")
                .withoutProcedureColumnMetaDataAccess()
                .declareParameters(new SqlOutParameter("p_qt_tabelas", Types.NUMERIC));
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

    /** SQL dinamico no banco: fotografa o tamanho de cada tabela SH_. */
    public int coletarVolumetria() {
        Map<String, Object> retorno = chamadaVolumetria.execute(new MapSqlParameterSource());
        Number qt = (Number) retorno.get("p_qt_tabelas");
        return qt != null ? qt.intValue() : 0;
    }

    /** Ultima coleta de volumetria, da maior tabela para a menor. */
    public List<VolumetriaResponse> volumetriaAtual() {
        return jdbc.query("""
                SELECT nm_tabela, qt_linhas, dt_coleta
                  FROM sh_volumetria
                 WHERE dt_coleta = (SELECT MAX(dt_coleta) FROM sh_volumetria)
                 ORDER BY qt_linhas DESC, nm_tabela
                """, (rs, n) -> new VolumetriaResponse(
                rs.getString("nm_tabela"),
                rs.getLong("qt_linhas"),
                rs.getTimestamp("dt_coleta").toInstant()));
    }

    /**
     * Busca dinamica: a consulta e montada dentro do banco por
     * PKG_SH_ADMIN.BUSCA_RECURSOS (filtros opcionais, binds, ordenacao em
     * lista fechada). O Java so passa os parametros e le o cursor devolvido.
     */
    public List<RecursoBuscaResponse> buscarRecursos(Long idCategoria, String tipo, String disponibilidade,
                                                     String texto, Double lat, Double lon, Double raioKm,
                                                     String ordem) {
        return jdbc.execute((java.sql.Connection con) -> {
            try (CallableStatement cs = con.prepareCall(
                    "{ ? = call pkg_sh_admin.busca_recursos(?, ?, ?, ?, ?, ?, ?, ?) }")) {
                cs.registerOutParameter(1, Types.REF_CURSOR);
                setNumero(cs, 2, idCategoria);
                setTexto(cs, 3, tipo);
                setTexto(cs, 4, disponibilidade);
                setTexto(cs, 5, texto);
                setNumero(cs, 6, lat);
                setNumero(cs, 7, lon);
                setNumero(cs, 8, raioKm);
                setTexto(cs, 9, ordem);
                cs.execute();

                List<RecursoBuscaResponse> lista = new ArrayList<>();
                try (ResultSet rs = (ResultSet) cs.getObject(1)) {
                    while (rs.next()) {
                        BigDecimal km = rs.getBigDecimal("distancia_km");
                        lista.add(new RecursoBuscaResponse(
                                String.valueOf(rs.getLong("id_recurso")),
                                rs.getString("nm_recurso"),
                                rs.getString("nm_categoria"),
                                rs.getString("ds_tipo"),
                                rs.getString("ds_disponibilidade"),
                                rs.getTimestamp("dt_cadastro").toInstant(),
                                km));
                    }
                }
                return lista;
            }
        });
    }

    private static void setNumero(CallableStatement cs, int idx, Number valor) throws SQLException {
        if (valor == null) {
            cs.setNull(idx, Types.NUMERIC);
        } else {
            cs.setObject(idx, valor);
        }
    }

    private static void setTexto(CallableStatement cs, int idx, String valor) throws SQLException {
        if (valor == null || valor.isBlank()) {
            cs.setNull(idx, Types.VARCHAR);
        } else {
            cs.setString(idx, valor);
        }
    }
}
