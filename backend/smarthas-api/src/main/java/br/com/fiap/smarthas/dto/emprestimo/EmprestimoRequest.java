package br.com.fiap.smarthas.dto.emprestimo;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

/** Pedido de emprestimo disparado pela tela de detalhe do recurso. */
public record EmprestimoRequest(
        @NotBlank(message = "Informe o recurso") String resourceId,
        @Min(value = 1, message = "O prazo minimo e de 1 dia")
        @Max(value = 90, message = "O prazo maximo e de 90 dias") Integer days
) {
    public int daysOrDefault() {
        return days != null ? days : 7;
    }
}
