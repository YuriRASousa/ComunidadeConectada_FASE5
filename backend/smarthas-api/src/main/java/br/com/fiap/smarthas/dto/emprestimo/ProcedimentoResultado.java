package br.com.fiap.smarthas.dto.emprestimo;

/**
 * Retorno das procedures PL/SQL: o id afetado e a mensagem ja formatada
 * dentro do banco, que a interface mostra sem reescrever texto.
 */
public record ProcedimentoResultado(String id, String message) {
}
