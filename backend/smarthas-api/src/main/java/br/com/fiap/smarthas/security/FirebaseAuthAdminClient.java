package br.com.fiap.smarthas.security;

import br.com.fiap.smarthas.exception.ConflictException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Talks to the Identity Toolkit Admin REST API (accounts.create /
 * accounts.lookup) directly with {@code java.net.http.HttpClient}, instead
 * of using {@code firebase-admin}'s {@code FirebaseAuth#createUser} /
 * {@code #getUserByEmail}.
 *
 * Why: on this machine, firebase-admin's internal google-http-client-based
 * transport reliably fails every single call to
 * identitytoolkit.googleapis.com with
 * {@code java.util.zip.ZipException: Not in GZIP format} - the response
 * claims {@code Content-Encoding: gzip} but the bytes that actually arrive
 * aren't valid gzip, which is the textbook symptom of a local
 * TLS-inspecting proxy/antivirus that transparently decompresses HTTPS
 * bodies without stripping the encoding header. It reproduced 100% of the
 * time across two full app restarts and 6 retries per call, so it isn't
 * transient - it's this JVM's HTTP stack on this host. Our own
 * {@code java.net.http.HttpClient} calls (already used in AuthService for
 * password verification via signInWithPassword) never request gzip and
 * never hit the bug, so admin user creation/lookup is done the same way
 * here, authenticated with an OAuth2 access token minted from the same
 * service account credentials used for Firestore/FirebaseApp.
 */
@Component
public class FirebaseAuthAdminClient {

    private final GoogleCredentials credentials;
    private final String projectId;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public FirebaseAuthAdminClient(GoogleCredentials credentials, @Value("${firebase.project-id}") String projectId) {
        this.credentials = credentials;
        this.projectId = projectId;
    }

    /** Creates a Firebase Authentication user and returns its UID. */
    public String createUser(String email, String password, String displayName) {
        String url = "https://identitytoolkit.googleapis.com/v1/projects/" + projectId + "/accounts";
        String body = writeJson(Map.of(
                "email", email,
                "password", password,
                "displayName", displayName
        ));

        HttpResponse<String> response = send(url, body);
        if (response.statusCode() == 200) {
            return readJson(response.body()).get("localId").asText();
        }

        String errorCode = extractErrorMessage(response.body());
        if ("EMAIL_EXISTS".equals(errorCode)) {
            throw new ConflictException("Já existe um usuário cadastrado com este email");
        }
        throw new RuntimeException("Erro ao criar usuário no Firebase Authentication: " + errorCode);
    }

    /** Looks up a user's UID by email, if one exists. */
    public Optional<String> findUidByEmail(String email) {
        String url = "https://identitytoolkit.googleapis.com/v1/projects/" + projectId + "/accounts:lookup";
        String body = writeJson(Map.of("email", List.of(email)));

        HttpResponse<String> response = send(url, body);
        if (response.statusCode() != 200) {
            return Optional.empty();
        }
        JsonNode node = readJson(response.body());
        JsonNode users = node.get("users");
        if (users == null || !users.isArray() || users.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(users.get(0).get("localId").asText());
    }

    private HttpResponse<String> send(String url, String jsonBody) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + accessToken())
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();
            return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException | InterruptedException e) {
            if (Thread.currentThread().isInterrupted()) {
                Thread.currentThread().interrupt();
            }
            throw new RuntimeException("Erro ao chamar a API do Firebase Authentication: " + e.getMessage(), e);
        }
    }

    private String accessToken() throws IOException {
        AccessToken token = credentials.getAccessToken();
        if (token == null || token.getExpirationTime() == null
                || token.getExpirationTime().getTime() < System.currentTimeMillis() + 60_000) {
            credentials.refresh();
            token = credentials.getAccessToken();
        }
        return token.getTokenValue();
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao serializar requisição para o Firebase", e);
        }
    }

    private JsonNode readJson(String value) {
        try {
            return objectMapper.readTree(value);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao interpretar resposta do Firebase", e);
        }
    }

    private String extractErrorMessage(String body) {
        try {
            JsonNode error = readJson(body).get("error");
            if (error != null && error.get("message") != null) {
                return error.get("message").asText();
            }
        } catch (Exception ignored) {
            // fall through
        }
        return "erro desconhecido";
    }
}
