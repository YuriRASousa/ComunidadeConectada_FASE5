package br.com.fiap.smarthas.service;

import br.com.fiap.smarthas.dto.admin.AdminStatsResponse;
import br.com.fiap.smarthas.dto.admin.AlertaResponse;
import br.com.fiap.smarthas.dto.admin.RecursoBuscaResponse;
import br.com.fiap.smarthas.dto.admin.ResumoUsuarioResponse;
import br.com.fiap.smarthas.dto.admin.RotinaResponse;
import br.com.fiap.smarthas.dto.admin.VolumetriaResponse;
import br.com.fiap.smarthas.dto.emprestimo.EmprestimoResponse;
import br.com.fiap.smarthas.entity.enums.Category;
import br.com.fiap.smarthas.exception.OracleErrors;
import br.com.fiap.smarthas.exception.ResourceNotFoundException;
import br.com.fiap.smarthas.repository.JdbcEmprestimoRepository;
import br.com.fiap.smarthas.repository.JdbcMessageRepository;
import br.com.fiap.smarthas.repository.JdbcPainelRepository;
import br.com.fiap.smarthas.repository.JdbcResourceRepository;
import br.com.fiap.smarthas.repository.JdbcUserRepository;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    private final JdbcUserRepository userRepository;
    private final JdbcResourceRepository resourceRepository;
    private final JdbcMessageRepository messageRepository;
    private final JdbcEmprestimoRepository emprestimoRepository;
    private final JdbcPainelRepository painelRepository;

    public AdminService(JdbcUserRepository userRepository, JdbcResourceRepository resourceRepository,
                        JdbcMessageRepository messageRepository, JdbcEmprestimoRepository emprestimoRepository,
                        JdbcPainelRepository painelRepository) {
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
        this.messageRepository = messageRepository;
        this.emprestimoRepository = emprestimoRepository;
        this.painelRepository = painelRepository;
    }

    public AdminStatsResponse getStats() {
        Map<String, Long> byCategory = new LinkedHashMap<>();
        for (Category category : Category.values()) {
            byCategory.put(category.name(), resourceRepository.countByCategory(category));
        }

        return new AdminStatsResponse(
                userRepository.count(),
                resourceRepository.count(),
                messageRepository.count(),
                byCategory
        );
    }

    public List<EmprestimoResponse> emprestimosEmAberto() {
        return executar(emprestimoRepository::findEmAberto);
    }

    public List<AlertaResponse> alertasAbertos() {
        return executar(painelRepository::alertasAbertos);
    }

    public void resolverAlerta(String idAlerta) {
        long id;
        try {
            id = Long.parseLong(idAlerta);
        } catch (NumberFormatException | NullPointerException e) {
            throw new IllegalArgumentException("Identificador de alerta inválido: " + idAlerta);
        }
        if (executar(() -> painelRepository.resolverAlerta(id)) == 0) {
            throw new ResourceNotFoundException("Alerta não encontrado: " + idAlerta);
        }
    }

    /**
     * Rotina de vigilancia. Percorre os emprestimos vencidos com CURSOR e abre
     * um alerta para cada um, sem repetir alerta ja existente.
     */
    public RotinaResponse detectarAtrasos() {
        int alertas = executar(emprestimoRepository::detectarAtrasos);
        return new RotinaResponse("PKG_SH_EMPRESTIMO.DETECTA_ATRASOS", alertas,
                alertas == 0 ? "Nenhum empréstimo vencido no momento"
                             : "Alertas de atraso abertos: " + alertas);
    }

    /**
     * Rotina de consolidacao. Recarrega SH_RESUMO_USUARIO_MES para a
     * competencia pedida, que e de onde o painel le os indicadores prontos.
     */
    public RotinaResponse gerarResumoMensal(Integer anoMes) {
        int competencia = anoMes != null ? anoMes : EmprestimoService.competenciaAtual();
        int linhas = executar(() -> emprestimoRepository.gerarResumoMensal(competencia));
        return new RotinaResponse("PKG_SH_ADMIN.GERA_RESUMO_MENSAL", linhas,
                "Resumo de " + competencia + " recarregado com " + linhas + " linhas");
    }

    public List<ResumoUsuarioResponse> resumoMensal(Integer anoMes) {
        int competencia = anoMes != null ? anoMes : EmprestimoService.competenciaAtual();
        return executar(() -> painelRepository.resumoDoMes(competencia));
    }

    /** SQL dinamico: mede o tamanho de todas as tabelas do projeto. */
    public RotinaResponse coletarVolumetria() {
        int tabelas = executar(painelRepository::coletarVolumetria);
        return new RotinaResponse("PKG_SH_ADMIN.PRC_VOLUMETRIA", tabelas,
                "Volumetria coletada para " + tabelas + " tabelas");
    }

    public List<VolumetriaResponse> volumetriaAtual() {
        return executar(painelRepository::volumetriaAtual);
    }

    /** SQL dinamico: filtros opcionais montados em tempo real no banco. */
    public List<RecursoBuscaResponse> buscarRecursos(Long categoria, String tipo, String disponibilidade,
                                                     String texto, Double lat, Double lon, Double raioKm,
                                                     String ordem) {
        return executar(() -> painelRepository.buscarRecursos(
                categoria, tipo, disponibilidade, texto, lat, lon, raioKm, ordem));
    }

    private <T> T executar(java.util.function.Supplier<T> chamada) {
        try {
            return chamada.get();
        } catch (DataAccessException e) {
            throw OracleErrors.translate(e);
        }
    }
}
