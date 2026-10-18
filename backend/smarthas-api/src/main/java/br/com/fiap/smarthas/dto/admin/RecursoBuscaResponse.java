package br.com.fiap.smarthas.dto.admin;

import java.math.BigDecimal;
import java.time.Instant;

/** Linha devolvida pela busca dinamica PKG_SH_ADMIN.BUSCA_RECURSOS. */
public record RecursoBuscaResponse(String id, String name, String category, String type,
                                   String availability, Instant createdAt, BigDecimal distanceKm) {
}
