package br.com.fiap.smarthas.dto.user;

public record UpdateUserRequest(
        String name,
        String address,
        String profileImageUrl
) {
}
