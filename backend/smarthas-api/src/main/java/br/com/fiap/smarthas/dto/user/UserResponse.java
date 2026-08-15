package br.com.fiap.smarthas.dto.user;

import br.com.fiap.smarthas.entity.User;
import br.com.fiap.smarthas.entity.enums.Role;

import java.time.Instant;

public record UserResponse(
        String id,
        String name,
        String email,
        String address,
        String profileImageUrl,
        Double reputation,
        Integer totalTransactions,
        Boolean isVerified,
        Role role,
        Instant createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getAddress(),
                user.getProfileImageUrl(),
                user.getReputation(),
                user.getTotalTransactions(),
                user.getIsVerified(),
                user.getRole(),
                user.getCreatedAt() != null ? user.getCreatedAt().toInstant() : null
        );
    }
}
