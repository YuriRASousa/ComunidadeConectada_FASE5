package br.com.fiap.smarthas.dto.emprestimo;

import java.time.Instant;

/** Emprestimo como o aplicativo e o painel enxergam. */
public record EmprestimoResponse(
        String id,
        String resourceId,
        String resourceTitle,
        String borrowerId,
        String borrowerName,
        String ownerName,
        Instant requestedAt,
        Instant dueAt,
        Instant returnedAt,
        String status,
        Integer daysLate
) {
}
