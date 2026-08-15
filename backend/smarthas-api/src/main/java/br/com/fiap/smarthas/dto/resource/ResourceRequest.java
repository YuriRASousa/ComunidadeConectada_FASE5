package br.com.fiap.smarthas.dto.resource;

import br.com.fiap.smarthas.entity.enums.Availability;
import br.com.fiap.smarthas.entity.enums.Category;
import br.com.fiap.smarthas.entity.enums.Condition;
import br.com.fiap.smarthas.entity.enums.ResourceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ResourceRequest(
        @NotBlank(message = "Título é obrigatório")
        String title,

        @NotBlank(message = "Descrição é obrigatória")
        String description,

        @NotNull(message = "Categoria é obrigatória")
        Category category,

        @NotNull(message = "Condição é obrigatória")
        Condition condition,

        @NotNull(message = "Tipo é obrigatório")
        ResourceType type,

        Availability availability,

        String imageUrl,

        Double latitude,

        Double longitude
) {
}
