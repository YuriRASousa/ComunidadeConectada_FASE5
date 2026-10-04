package br.com.fiap.smarthas.service;

import br.com.fiap.smarthas.dto.emprestimo.DevolucaoRequest;
import br.com.fiap.smarthas.dto.emprestimo.EmprestimoRequest;
import br.com.fiap.smarthas.dto.emprestimo.EmprestimoResponse;
import br.com.fiap.smarthas.dto.emprestimo.ProcedimentoResultado;
import br.com.fiap.smarthas.exception.OracleErrors;
import br.com.fiap.smarthas.repository.JdbcEmprestimoRepository;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

/**
 * Camada de emprestimos, que e onde a Fase 6 se materializa: o service
 * praticamente nao tem regra. Ele valida o formato do que chegou pela API,
 * chama a procedure PL/SQL e traduz o erro do Oracle para a excecao do
 * backend.
 *
 * <p>A decisao de permitir ou recusar o emprestimo (dono pedindo o proprio
 * item, recurso indisponivel, item de doacao, usuario inativo) mora dentro de
 * PRC_SH_REGISTRA_EMPRESTIMO. Assim a mesma regra vale para o aplicativo, para
 * o painel e para qualquer carga feita direto no banco.</p>
 */
@Service
public class EmprestimoService {

    private final JdbcEmprestimoRepository emprestimoRepository;

    public EmprestimoService(JdbcEmprestimoRepository emprestimoRepository) {
        this.emprestimoRepository = emprestimoRepository;
    }

    /** REST -> Java -> JDBC -> PRC_SH_REGISTRA_EMPRESTIMO. */
    public ProcedimentoResultado solicitar(String userId, EmprestimoRequest request) {
        return executar(() -> emprestimoRepository.registrarEmprestimo(
                paraNumero(request.resourceId(), "recurso"),
                paraNumero(userId, "usuário"),
                request.daysOrDefault()));
    }

    /** REST -> Java -> JDBC -> PRC_SH_REGISTRA_DEVOLUCAO. */
    public ProcedimentoResultado devolver(String emprestimoId, DevolucaoRequest request) {
        return executar(() -> emprestimoRepository.registrarDevolucao(
                paraNumero(emprestimoId, "empréstimo"),
                request != null ? request.rating() : null,
                request != null ? request.comment() : null));
    }

    public List<EmprestimoResponse> meus(String userId) {
        return executar(() -> emprestimoRepository.findByUsuario(paraNumero(userId, "usuário")));
    }

    public List<EmprestimoResponse> emAberto() {
        return executar(emprestimoRepository::findEmAberto);
    }

    /** Indicador vindo de FN_SH_INDICE_CIRCULARIDADE. */
    public BigDecimal indiceCircularidade(String userId, Integer anoMes) {
        int competencia = anoMes != null ? anoMes : competenciaAtual();
        return executar(() -> emprestimoRepository.indiceCircularidade(
                paraNumero(userId, "usuário"), competencia));
    }

    /** Ficha formatada vinda de FN_SH_FICHA_RECURSO. */
    public String fichaRecurso(String resourceId) {
        return executar(() -> emprestimoRepository.fichaRecurso(paraNumero(resourceId, "recurso")));
    }

    public static int competenciaAtual() {
        YearMonth agora = YearMonth.now();
        return agora.getYear() * 100 + agora.getMonthValue();
    }

    private static long paraNumero(String id, String rotulo) {
        try {
            return Long.parseLong(id);
        } catch (NumberFormatException | NullPointerException e) {
            throw new IllegalArgumentException("Identificador de " + rotulo + " inválido: " + id);
        }
    }

    /**
     * Um unico ponto de traducao: qualquer RAISE_APPLICATION_ERROR levantado
     * pelas procedures chega aqui como DataAccessException e sai como
     * BusinessRuleException, com a mensagem escrita dentro do banco.
     */
    private <T> T executar(java.util.function.Supplier<T> chamada) {
        try {
            return chamada.get();
        } catch (DataAccessException e) {
            throw OracleErrors.translate(e);
        }
    }
}
