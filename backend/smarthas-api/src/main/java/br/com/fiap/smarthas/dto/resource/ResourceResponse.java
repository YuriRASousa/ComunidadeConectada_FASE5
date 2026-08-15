package br.com.fiap.smarthas.dto.resource;

import br.com.fiap.smarthas.entity.Resource;
import br.com.fiap.smarthas.entity.enums.Availability;
import br.com.fiap.smarthas.entity.enums.Category;
import br.com.fiap.smarthas.entity.enums.Condition;
import br.com.fiap.smarthas.entity.enums.ResourceType;

import java.time.Instant;

public record ResourceResponse(
        String id,
        String title,
        String description,
        Category category,
        Condition condition,
        ResourceType type,
        Availability availability,
        String imageUrl,
        Double latitude,
        Double longitude,
        String offerantId,
        String offerantName,
        Instant createdAt,
        Instant updatedAt
) {
    public static ResourceResponse from(Resource resource) {
        return new ResourceResponse(
                resource.getId(),
                resource.getTitle(),
                resource.getDescription(),
                resource.getCategory(),
                resource.getCondition(),
                resource.getType(),
                resource.getAvailability(),
                resource.getImageUrl(),
                resource.getLatitude(),
                resource.getLongitude(),
                resource.getOfferantId(),
                resource.getOfferantName(),
                resource.getCreatedAt() != null ? resource.getCreatedAt().toInstant() : null,
                resource.getUpdatedAt() != null ? resource.getUpdatedAt().toInstant() : null
        );
    }
}
