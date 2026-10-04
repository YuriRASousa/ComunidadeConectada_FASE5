package br.com.fiap.smarthas.entity;

import br.com.fiap.smarthas.entity.enums.Availability;
import br.com.fiap.smarthas.entity.enums.Category;
import br.com.fiap.smarthas.entity.enums.Condition;
import br.com.fiap.smarthas.entity.enums.ResourceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

/**
 * Item oferecido a comunidade, correspondente a uma linha de SH_RECURSO.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resource {

    private String id;

    private String title;

    private String description;

    private Category category;

    private Condition condition;

    private ResourceType type;

    @Builder.Default
    private Availability availability = Availability.DISPONIVEL;

    private String imageUrl;

    private Double latitude;

    private Double longitude;

    private String offerantId;

    private String offerantName;

    @Builder.Default
    private Date createdAt = new Date();

    @Builder.Default
    private Date updatedAt = new Date();
}
