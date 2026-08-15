package br.com.fiap.smarthas.dto.auth;

import br.com.fiap.smarthas.dto.user.UserResponse;

public record AuthResponse(
        String token,
        UserResponse user
) {
}
