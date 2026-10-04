package br.com.fiap.smarthas.dto.admin;

/** Retorno das rotinas de vigilancia e consolidacao disparadas pelo painel. */
public record RotinaResponse(String routine, int affectedRows, String message) {
}
