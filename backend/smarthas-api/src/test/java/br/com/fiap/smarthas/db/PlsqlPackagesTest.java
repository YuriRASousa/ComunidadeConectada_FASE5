package br.com.fiap.smarthas.db;

import br.com.fiap.smarthas.dto.admin.RecursoBuscaResponse;
import br.com.fiap.smarthas.dto.emprestimo.ProcedimentoResultado;
import br.com.fiap.smarthas.repository.JdbcEmprestimoRepository;
import br.com.fiap.smarthas.repository.JdbcPainelRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Testes de integracao das camadas PL/SQL contra um Oracle de verdade.
 *
 * <p>Rodam so quando SMARTHAS_DB_TESTS=true, ou seja, no pipeline (que sobe
 * um Oracle Free como servico) ou na maquina de quem tem o schema instalado.
 * Cada teste cria os proprios dados com ids da sequence e apaga tudo no
 * final, entao a carga do banco nao e alterada.</p>
 */
@SpringBootTest
@EnabledIfEnvironmentVariable(named = "SMARTHAS_DB_TESTS", matches = "true")
class PlsqlPackagesTest {

    @Autowired
    JdbcTemplate jdbc;
    @Autowired
    JdbcEmprestimoRepository emprestimos;
    @Autowired
    JdbcPainelRepository painel;

    private final List<Long> usuarios = new ArrayList<>();
    private final List<Long> recursos = new ArrayList<>();
    private final List<Long> emprestimosCriados = new ArrayList<>();

    @BeforeEach
    void zera() {
        usuarios.clear();
        recursos.clear();
        emprestimosCriados.clear();
    }

    @AfterEach
    void limpa() {
        for (Long e : emprestimosCriados) {
            jdbc.update("DELETE FROM sh_avaliacao WHERE id_emprestimo = ?", e);
            jdbc.update("DELETE FROM sh_alerta WHERE id_referencia = ?", e);
            // Gatilho de status nao impede DELETE; a trilha do teste tambem sai
            jdbc.update("DELETE FROM sh_emprestimo WHERE id_emprestimo = ?", e);
            jdbc.update("DELETE FROM sh_auditoria WHERE nm_tabela = 'SH_EMPRESTIMO' AND id_registro = ?", e);
        }
        for (Long r : recursos) {
            jdbc.update("DELETE FROM sh_recurso WHERE id_recurso = ?", r);
        }
        for (Long u : usuarios) {
            jdbc.update("DELETE FROM sh_auditoria WHERE nm_tabela = 'SH_USUARIO' AND id_registro = ?", u);
            jdbc.update("DELETE FROM sh_usuario WHERE id_usuario = ?", u);
        }
    }

    // ----------------------------------------------------------------
    // Fixtures
    // ----------------------------------------------------------------
    private long novoUsuario() {
        long id = jdbc.queryForObject("SELECT sq_sh_usuario.NEXTVAL FROM dual", Long.class);
        jdbc.update("""
                INSERT INTO sh_usuario (id_usuario, nm_usuario, ds_email, ds_senha_hash)
                VALUES (?, ?, ?, 'hash-de-teste')
                """, id, "Teste " + id, "teste-" + UUID.randomUUID() + "@smarthas.test");
        usuarios.add(id);
        return id;
    }

    private long novoRecurso(long dono, double lat, double lon) {
        long id = jdbc.queryForObject("SELECT sq_sh_recurso.NEXTVAL FROM dual", Long.class);
        jdbc.update("""
                INSERT INTO sh_recurso (id_recurso, id_usuario, id_categoria, nm_recurso,
                                        ds_condicao, ds_tipo, vl_latitude, vl_longitude)
                VALUES (?, ?, (SELECT MIN(id_categoria) FROM sh_categoria), ?, 'BOM', 'EMPRESTIMO', ?, ?)
                """, id, dono, "Item de teste " + id, lat, lon);
        recursos.add(id);
        return id;
    }

    private long pedeEmprestimo(long recurso, long solicitante) {
        ProcedimentoResultado r = emprestimos.registrarEmprestimo(recurso, solicitante, 7);
        long id = Long.parseLong(r.id());
        emprestimosCriados.add(id);
        return id;
    }

    private String erroDe(Runnable acao) {
        Throwable t = assertThrows(RuntimeException.class, acao::run);
        StringBuilder msg = new StringBuilder();
        for (Throwable c = t; c != null; c = c.getCause()) {
            msg.append(c.getMessage()).append(' ');
        }
        return msg.toString();
    }

    // ----------------------------------------------------------------
    // Estrutura
    // ----------------------------------------------------------------
    @Test
    @DisplayName("Os quatro pacotes e as tres triggers existem e estao validos")
    void objetosEstaoValidos() {
        Integer invalidos = jdbc.queryForObject(
                "SELECT COUNT(*) FROM user_objects WHERE status <> 'VALID'", Integer.class);
        assertEquals(0, invalidos, "objetos invalidos no schema");

        Integer pacotes = jdbc.queryForObject("""
                SELECT COUNT(*) FROM user_objects
                 WHERE object_type = 'PACKAGE BODY'
                   AND object_name IN ('PKG_SH_LOG','PKG_SH_CALCULOS','PKG_SH_EMPRESTIMO','PKG_SH_ADMIN')
                """, Integer.class);
        assertEquals(4, pacotes);

        Integer triggers = jdbc.queryForObject("""
                SELECT COUNT(*) FROM user_triggers
                 WHERE trigger_name IN ('TRG_SH_EMPRESTIMO_BU','TRG_SH_EMPRESTIMO_AUD','TRG_SH_USUARIO_AUD')
                   AND status = 'ENABLED'
                """, Integer.class);
        assertEquals(3, triggers);
    }

    // ----------------------------------------------------------------
    // PKG_SH_CALCULOS
    // ----------------------------------------------------------------
    @Test
    @DisplayName("Reputacao: quem nao foi avaliado comeca com 5")
    void reputacaoInicial() {
        long u = novoUsuario();
        BigDecimal r = jdbc.queryForObject("SELECT pkg_sh_calculos.reputacao(?) FROM dual", BigDecimal.class, u);
        assertEquals(0, new BigDecimal("5").compareTo(r));
    }

    @Test
    @DisplayName("Distancia de Haversine entre Sao Paulo e Rio fica perto de 360 km")
    void distanciaHaversine() {
        BigDecimal km = jdbc.queryForObject(
                "SELECT pkg_sh_calculos.distancia_km(-23.5505, -46.6333, -22.9068, -43.1729) FROM dual",
                BigDecimal.class);
        assertTrue(km.doubleValue() > 350 && km.doubleValue() < 370, "distancia = " + km);

        BigDecimal semCoordenada = jdbc.queryForObject(
                "SELECT pkg_sh_calculos.distancia_km(NULL, -46.6, -22.9, -43.1) FROM dual", BigDecimal.class);
        assertEquals(null, semCoordenada);
    }

    @Test
    @DisplayName("Competencia invalida e recusada com ORA-20101")
    void competenciaInvalida() {
        String erro = erroDe(() -> jdbc.queryForObject(
                "SELECT pkg_sh_calculos.indice_circularidade(1, 2026) FROM dual", BigDecimal.class));
        assertTrue(erro.contains("ORA-20101"), erro);
    }

    // ----------------------------------------------------------------
    // PKG_SH_EMPRESTIMO + triggers
    // ----------------------------------------------------------------
    @Test
    @DisplayName("Ciclo completo: pedido, reserva, devolucao com nota e reputacao")
    void cicloDeEmprestimo() {
        long dono = novoUsuario();
        long pedinte = novoUsuario();
        long recurso = novoRecurso(dono, -23.55, -46.66);

        long emp = pedeEmprestimo(recurso, pedinte);
        assertEquals("RESERVADO", jdbc.queryForObject(
                "SELECT ds_disponibilidade FROM sh_recurso WHERE id_recurso = ?", String.class, recurso));

        ProcedimentoResultado devolucao = emprestimos.registrarDevolucao(emp, 4, "Tudo certo");
        assertTrue(devolucao.message().contains("no prazo"), devolucao.message());

        assertEquals("DISPONIVEL", jdbc.queryForObject(
                "SELECT ds_disponibilidade FROM sh_recurso WHERE id_recurso = ?", String.class, recurso));
        BigDecimal rep = jdbc.queryForObject(
                "SELECT vl_reputacao FROM sh_usuario WHERE id_usuario = ?", BigDecimal.class, dono);
        assertEquals(0, new BigDecimal("4").compareTo(rep), "reputacao = " + rep);
    }

    @Test
    @DisplayName("Regras de negocio da procedure: dono, item reservado e usuario inexistente")
    void regrasDaProcedure() {
        long dono = novoUsuario();
        long pedinte = novoUsuario();
        long outro = novoUsuario();
        long recurso = novoRecurso(dono, -23.55, -46.66);

        assertTrue(erroDe(() -> emprestimos.registrarEmprestimo(recurso, dono, 7)).contains("ORA-20203"));

        pedeEmprestimo(recurso, pedinte);
        assertTrue(erroDe(() -> emprestimos.registrarEmprestimo(recurso, outro, 7)).contains("ORA-20205"));
        assertTrue(erroDe(() -> emprestimos.registrarEmprestimo(-1, outro, 7)).contains("ORA-20201"));
    }

    @Test
    @DisplayName("Trigger de auditoria registra INSERT e UPDATE do emprestimo")
    void triggerAuditaEmprestimo() {
        long dono = novoUsuario();
        long pedinte = novoUsuario();
        long recurso = novoRecurso(dono, -23.55, -46.66);
        long emp = pedeEmprestimo(recurso, pedinte);
        emprestimos.registrarDevolucao(emp, null, null);

        List<String> ops = jdbc.queryForList("""
                SELECT tp_operacao FROM sh_auditoria
                 WHERE nm_tabela = 'SH_EMPRESTIMO' AND id_registro = ?
                 ORDER BY id_auditoria
                """, String.class, emp);
        assertEquals(List.of("INSERT", "UPDATE"), ops);

        String depois = jdbc.queryForObject("""
                SELECT ds_depois FROM sh_auditoria
                 WHERE nm_tabela = 'SH_EMPRESTIMO' AND id_registro = ? AND tp_operacao = 'UPDATE'
                """, String.class, emp);
        assertTrue(depois.contains("status=DEVOLVIDO"), depois);
    }

    @Test
    @DisplayName("Trigger de status: estado final nao volta atras (ORA-20301)")
    void triggerImpedeVoltarStatus() {
        long dono = novoUsuario();
        long pedinte = novoUsuario();
        long recurso = novoRecurso(dono, -23.55, -46.66);
        long emp = pedeEmprestimo(recurso, pedinte);
        emprestimos.registrarDevolucao(emp, null, null);

        String erro = erroDe(() -> jdbc.update(
                "UPDATE sh_emprestimo SET st_emprestimo = 'ATIVO' WHERE id_emprestimo = ?", emp));
        assertTrue(erro.contains("ORA-20301"), erro);
    }

    @Test
    @DisplayName("Trigger de status: ATIVO preenche a retirada e CANCELADO libera o item")
    void triggerAutomatizaDatasELiberacao() {
        long dono = novoUsuario();
        long pedinte = novoUsuario();
        long recurso = novoRecurso(dono, -23.55, -46.66);
        long emp = pedeEmprestimo(recurso, pedinte);

        jdbc.update("UPDATE sh_emprestimo SET st_emprestimo = 'ATIVO' WHERE id_emprestimo = ?", emp);
        assertNotNull(jdbc.queryForObject(
                "SELECT dt_retirada FROM sh_emprestimo WHERE id_emprestimo = ?", java.sql.Timestamp.class, emp));

        String erro = erroDe(() -> jdbc.update(
                "UPDATE sh_emprestimo SET st_emprestimo = 'SOLICITADO' WHERE id_emprestimo = ?", emp));
        assertTrue(erro.contains("ORA-20302"), erro);

        jdbc.update("UPDATE sh_emprestimo SET st_emprestimo = 'CANCELADO' WHERE id_emprestimo = ?", emp);
        assertEquals("DISPONIVEL", jdbc.queryForObject(
                "SELECT ds_disponibilidade FROM sh_recurso WHERE id_recurso = ?", String.class, recurso));
    }

    @Test
    @DisplayName("Trigger de usuario audita mudanca de papel e nunca guarda o hash")
    void triggerAuditaPapelDoUsuario() {
        long u = novoUsuario();
        jdbc.update("UPDATE sh_usuario SET ds_papel = 'ADMIN' WHERE id_usuario = ?", u);
        // trocar so a senha nao deve gerar linha
        jdbc.update("UPDATE sh_usuario SET ds_senha_hash = 'outro-hash' WHERE id_usuario = ?", u);

        List<String> linhas = jdbc.queryForList("""
                SELECT ds_antes || ' -> ' || ds_depois FROM sh_auditoria
                 WHERE nm_tabela = 'SH_USUARIO' AND id_registro = ?
                """, String.class, u);
        assertEquals(1, linhas.size());
        assertTrue(linhas.get(0).contains("papel=USER") && linhas.get(0).contains("papel=ADMIN"), linhas.get(0));
        assertFalse(linhas.get(0).toLowerCase().contains("hash"));
    }

    // ----------------------------------------------------------------
    // SQL dinamico (PKG_SH_ADMIN)
    // ----------------------------------------------------------------
    @Test
    @DisplayName("CONTAGEM_LINHAS aceita tabela do schema e recusa injecao")
    void contagemDinamica() {
        Integer usuariosNoBanco = jdbc.queryForObject("SELECT COUNT(*) FROM sh_usuario", Integer.class);
        Integer viaPlsql = jdbc.queryForObject(
                "SELECT pkg_sh_admin.contagem_linhas('sh_usuario') FROM dual", Integer.class);
        assertEquals(usuariosNoBanco, viaPlsql);

        for (String malicioso : new String[]{
                "SH_USUARIO WHERE 1=1", "SH_USUARIO; DROP TABLE sh_usuario", "dual", "\"SH_USUARIO\" --"}) {
            String erro = erroDe(() -> jdbc.queryForObject(
                    "SELECT pkg_sh_admin.contagem_linhas(?) FROM dual", Integer.class, malicioso));
            assertTrue(erro.contains("ORA-20401"), malicioso + " -> " + erro);
        }
        assertTrue(jdbc.queryForObject("SELECT COUNT(*) FROM sh_usuario", Integer.class) > 0);
    }

    @Test
    @DisplayName("PRC_VOLUMETRIA fotografa todas as tabelas SH_")
    void volumetria() {
        int tabelas = painel.coletarVolumetria();
        Integer esperado = jdbc.queryForObject(
                "SELECT COUNT(*) FROM user_tables WHERE table_name LIKE 'SH\\_%' ESCAPE '\\'", Integer.class);
        assertEquals(esperado, tabelas);
        assertEquals(tabelas, painel.volumetriaAtual().size());
        try {
            assertTrue(painel.volumetriaAtual().stream().anyMatch(v -> v.table().equals("SH_USUARIO") && v.rows() > 0));
        } finally {
            jdbc.update("DELETE FROM sh_volumetria WHERE dt_coleta = (SELECT MAX(dt_coleta) FROM sh_volumetria)");
        }
    }

    @Test
    @DisplayName("BUSCA_RECURSOS aplica so os filtros informados")
    void buscaDinamicaComFiltros() {
        long dono = novoUsuario();
        long perto = novoRecurso(dono, -23.5500, -46.6600);
        long longe = novoRecurso(dono, -22.9000, -43.2000);
        String nomePerto = "Item de teste " + perto;

        List<RecursoBuscaResponse> porTexto = painel.buscarRecursos(
                null, null, null, nomePerto.toLowerCase(), null, null, null, "NOME");
        assertEquals(1, porTexto.size());
        assertEquals(String.valueOf(perto), porTexto.get(0).id());

        // Sem filtro nenhum: traz tudo, incluindo os dois itens criados
        List<RecursoBuscaResponse> todos = painel.buscarRecursos(
                null, null, null, null, null, null, null, "RECENTE");
        assertTrue(todos.stream().anyMatch(r -> r.id().equals(String.valueOf(longe))));

        // Raio de 50 km a partir de Sao Paulo: so o item proximo
        List<RecursoBuscaResponse> noRaio = painel.buscarRecursos(
                null, null, null, "Item de teste", -23.55, -46.66, 50.0, "DISTANCIA");
        assertTrue(noRaio.stream().anyMatch(r -> r.id().equals(String.valueOf(perto))));
        assertFalse(noRaio.stream().anyMatch(r -> r.id().equals(String.valueOf(longe))));
        assertTrue(noRaio.get(0).distanceKm().doubleValue() < 50);
    }

    @Test
    @DisplayName("BUSCA_RECURSOS trata o texto como valor e recusa ordenacao fora da lista")
    void buscaDinamicaResisteAInjecao() {
        List<RecursoBuscaResponse> r = painel.buscarRecursos(
                null, null, null, "x' OR '1'='1", null, null, null, "NOME");
        assertTrue(r.isEmpty(), "o texto deveria virar valor de LIKE, nao parte do comando");

        String erro = erroDe(() -> painel.buscarRecursos(
                null, null, null, null, null, null, null, "nm_recurso; DROP TABLE sh_recurso"));
        assertTrue(erro.contains("ORA-20402"), erro);
        assertTrue(jdbc.queryForObject("SELECT COUNT(*) FROM sh_recurso", Integer.class) > 0);
    }
}
