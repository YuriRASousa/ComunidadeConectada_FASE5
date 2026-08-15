package br.com.fiap.smarthas.entity;

import br.com.fiap.smarthas.entity.enums.Role;
import com.google.cloud.firestore.annotation.Exclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

/**
 * Firestore document in the {@code users} collection.
 * Document ID = Firebase Authentication UID (kept out of the stored fields
 * via {@link Exclude}, populated manually after each read).
 * The password itself is never stored here - Firebase Authentication owns it.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Exclude
    private String id;

    private String name;

    private String email;

    private String address;

    private String profileImageUrl;

    @Builder.Default
    private Double reputation = 5.0;

    @Builder.Default
    private Integer totalTransactions = 0;

    @Builder.Default
    private Boolean isVerified = false;

    @Builder.Default
    private Role role = Role.USER;

    @Builder.Default
    private Date createdAt = new Date();
}
