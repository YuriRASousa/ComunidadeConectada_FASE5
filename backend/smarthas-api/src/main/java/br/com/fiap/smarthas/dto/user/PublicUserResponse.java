package br.com.fiap.smarthas.dto.user;

import br.com.fiap.smarthas.entity.User;
import br.com.fiap.smarthas.entity.enums.Role;

import java.time.Instant;

public record PublicUserResponse(
        String id,
        String name,
        String profileImageUrl,
        Double reputation,
        Integer totalTransactions,
        Boolean isVerified,
        Role role,
        Instant createdAt
) {
    public static PublicUserResponse from(User user) {
        return new PublicUserResponse(
                user.getId(),
                user.getName(),
                user.getProfileImageUrl(),
                user.getReputation(),
                user.getTotalTransactions(),
                user.getIsVerified(),
                user.getRole(),
                user.getCreatedAt() != null ? user.getCreatedAt().toInstant() : null
        );
    }
}
