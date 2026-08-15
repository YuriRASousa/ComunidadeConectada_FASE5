package br.com.fiap.smarthas.dto.message;

import jakarta.validation.constraints.NotBlank;

public record SendMessageRequest(
        @NotBlank(message = "Destinatário é obrigatório")
        String receiverId,

        String resourceId,

        @NotBlank(message = "Conteúdo é obrigatório")
        String content
) {
}
