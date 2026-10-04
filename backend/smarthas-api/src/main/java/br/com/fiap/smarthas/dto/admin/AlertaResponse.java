package br.com.fiap.smarthas.dto.admin;

import java.time.Instant;

/** Alerta aberto pelas rotinas PL/SQL, exibido no painel do administrador. */
public record AlertaResponse(
        String id,
        String type,
        String referenceId,
        String severity,
        String message,
        Instant createdAt,
        boolean resolved
) {
}
