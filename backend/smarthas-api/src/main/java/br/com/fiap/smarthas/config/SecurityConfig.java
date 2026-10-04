package br.com.fiap.smarthas.config;

import br.com.fiap.smarthas.security.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.Duration;
import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    /**
     * Origens autorizadas a chamar a API pelo navegador. Vem de
     * {@code smarthas.cors.allowed-origins}, com uma lista por ambiente:
     * o perfil {@code https} troca o esquema das mesmas origens.
     */
    private final List<String> origensPermitidas;

    /**
     * Strict-Transport-Security so entra quando o transporte e TLS. Em HTTP
     * o cabecalho e ignorado pelo navegador e daria uma falsa sensacao de
     * seguranca em quem le a resposta.
     */
    private final boolean hsts;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter,
                          @Value("${smarthas.cors.allowed-origins}") List<String> origensPermitidas,
                          @Value("${smarthas.security.hsts:false}") boolean hsts) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.origensPermitidas = origensPermitidas;
        this.hsts = hsts;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> {
                    headers.frameOptions(frame -> frame.sameOrigin());
                    if (hsts) {
                        headers.httpStrictTransportSecurity(h -> h
                                .includeSubDomains(true)
                                .maxAgeInSeconds(Duration.ofDays(365).toSeconds()));
                    } else {
                        headers.httpStrictTransportSecurity(HeadersConfigurer.HstsConfig::disable);
                    }
                })
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                        // specific authenticated routes MUST be declared before the broader
                        // permit-all wildcard/path-variable matchers below, since Spring Security
                        // uses first-match-wins on the ordered rule list.
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/resources/mine").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/users/me").authenticated()
                        .requestMatchers("/api/users", "/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/emprestimos/**").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/users/{id}").hasRole("ADMIN")
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/resources/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/users/{id}").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Com a saida do Firebase Authentication na Fase 6, a verificacao da senha
     * passou a ser feita aqui: o hash BCrypt fica em SH_USUARIO.DS_SENHA_HASH.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        // Lista fechada em vez de curinga. Com allowCredentials ligado, um
        // "*" aqui seria a configuracao mais permissiva possivel: qualquer
        // site aberto no navegador do morador poderia chamar a API em nome
        // dele. O aplicativo nativo nao manda cabecalho Origin, entao nao
        // passa por esta checagem e continua funcionando.
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(origensPermitidas);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
