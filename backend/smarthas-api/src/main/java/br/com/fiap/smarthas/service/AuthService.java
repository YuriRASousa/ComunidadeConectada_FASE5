package br.com.fiap.smarthas.service;

import br.com.fiap.smarthas.dto.auth.AuthResponse;
import br.com.fiap.smarthas.dto.auth.LoginRequest;
import br.com.fiap.smarthas.dto.auth.RegisterRequest;
import br.com.fiap.smarthas.dto.user.UserResponse;
import br.com.fiap.smarthas.entity.User;
import br.com.fiap.smarthas.entity.enums.Role;
import br.com.fiap.smarthas.exception.ConflictException;
import br.com.fiap.smarthas.exception.UnauthorizedException;
import br.com.fiap.smarthas.repository.FirestoreUserRepository;
import br.com.fiap.smarthas.security.FirebaseAuthAdminClient;
import br.com.fiap.smarthas.security.JwtService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Date;
import java.util.Map;

@Service
public class AuthService {

    private final FirestoreUserRepository userRepository;
    private final JwtService jwtService;
    private final FirebaseAuthAdminClient firebaseAuthAdminClient;
    private final String webApiKey;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AuthService(FirestoreUserRepository userRepository, JwtService jwtService,
                        FirebaseAuthAdminClient firebaseAuthAdminClient,
                        @Value("${firebase.web-api-key}") String webApiKey) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.firebaseAuthAdminClient = firebaseAuthAdminClient;
        this.webApiKey = webApiKey;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Já existe um usuário cadastrado com este email");
        }

        String uid = firebaseAuthAdminClient.createUser(request.email(), request.password(), request.name());

        User user = User.builder()
                .id(uid)
                .name(request.name())
                .email(request.email())
                .address(request.address())
                .role(Role.USER)
                .reputation(5.0)
                .totalTransactions(0)
                .isVerified(false)
                .createdAt(new Date())
                .build();

        user = userRepository.save(user);

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return new AuthResponse(token, UserResponse.from(user));
    }

    public AuthResponse login(LoginRequest request) {
        String uid = verifyPasswordAndGetUid(request.email(), request.password());

        User user = userRepository.findById(uid)
                .orElseThrow(() -> new UnauthorizedException("Email ou senha inválidos"));

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return new AuthResponse(token, UserResponse.from(user));
    }

    /**
     * Firebase Admin SDK has no server-side password-verification API, so we
     * call the Identity Toolkit REST API directly (same trick the Firebase
     * client SDKs use under the hood). A 200 with a {@code localId} means the
     * credentials are valid - that localId IS the Firebase UID.
     */
    private String verifyPasswordAndGetUid(String email, String password) {
        try {
            String url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + webApiKey;
            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "email", email,
                    "password", password,
                    "returnSecureToken", true
            ));

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode body = objectMapper.readTree(response.body());
                return body.get("localId").asText();
            }

            // Firebase returns 400 with {"error":{"message":"INVALID_LOGIN_CREDENTIALS", ...}}
            // for wrong password / unknown email - map straight to our 401 shape.
            throw new UnauthorizedException("Email ou senha inválidos");
        } catch (IOException | InterruptedException e) {
            if (Thread.currentThread().isInterrupted()) {
                Thread.currentThread().interrupt();
            }
            throw new RuntimeException("Erro ao autenticar com o Firebase: " + e.getMessage(), e);
        }
    }
}
