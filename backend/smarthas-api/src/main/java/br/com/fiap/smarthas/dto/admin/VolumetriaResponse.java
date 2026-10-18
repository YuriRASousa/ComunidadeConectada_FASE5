package br.com.fiap.smarthas.dto.admin;

import java.time.Instant;

/** Quantidade de linhas de uma tabela na ultima coleta de volumetria. */
public record VolumetriaResponse(String table, long rows, Instant collectedAt) {
}
