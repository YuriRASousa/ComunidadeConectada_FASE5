package br.com.fiap.smarthas.security;

import org.springframework.security.core.Authentication;

public final class AuthUtils {

    private AuthUtils() {
    }

    public static String currentUserId(Authentication authentication) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        return principal.getId();
    }
}
