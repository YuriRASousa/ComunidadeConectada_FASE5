package br.com.fiap.smarthas.entity;

import br.com.fiap.smarthas.entity.enums.Availability;
import br.com.fiap.smarthas.entity.enums.Category;
import br.com.fiap.smarthas.entity.enums.Condition;
import br.com.fiap.smarthas.entity.enums.ResourceType;
import com.google.cloud.firestore.annotation.Exclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

/**
 * Firestore document in the {@code resources} collection (auto-generated ID).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resource {

    @Exclude
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
