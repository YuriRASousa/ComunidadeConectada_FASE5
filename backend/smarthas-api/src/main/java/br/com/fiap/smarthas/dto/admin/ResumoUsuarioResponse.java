package br.com.fiap.smarthas.dto.admin;

import java.math.BigDecimal;

/**
 * Linha da tabela de resumo SH_RESUMO_USUARIO_MES.
 *
 * <p>O painel le numero pronto: quem calcula e a procedure de consolidacao,
 * nao a consulta da tela.</p>
 */
public record ResumoUsuarioResponse(
        String userId,
        String userName,
        int yearMonth,
        int publishedResources,
        int lentOut,
        int borrowed,
        int lateReturns,
        BigDecimal circularityIndex,
        BigDecimal reputation
) {
}
