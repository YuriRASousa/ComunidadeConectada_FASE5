package br.com.fiap.smarthas.dto.emprestimo;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/** Devolucao, com avaliacao opcional de 1 a 5. */
public record DevolucaoRequest(
        @Min(value = 1, message = "A nota vai de 1 a 5")
        @Max(value = 5, message = "A nota vai de 1 a 5") Integer rating,
        @Size(max = 400, message = "Comentario muito longo") String comment
) {
}
