package br.com.fiap.smarthas.service;

import br.com.fiap.smarthas.dto.auth.AuthResponse;
import br.com.fiap.smarthas.dto.auth.LoginRequest;
import br.com.fiap.smarthas.dto.auth.RegisterRequest;
import br.com.fiap.smarthas.dto.user.UserResponse;
import br.com.fiap.smarthas.entity.User;
import br.com.fiap.smarthas.entity.enums.Role;
import br.com.fiap.smarthas.exception.ConflictException;
import br.com.fiap.smarthas.exception.UnauthorizedException;
import br.com.fiap.smarthas.repository.JdbcUserRepository;
import br.com.fiap.smarthas.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;

/**
 * Cadastro e login dos moradores.
 *
 * <p>Na Fase 5 a senha era responsabilidade do Firebase Authentication: o
 * backend chamava a API do Identity Toolkit para criar o usuario e para
 * conferir a senha no login. Na Fase 6 o Firebase saiu do projeto e a
 * identidade passou a viver no Oracle: a senha e gravada como hash BCrypt na
 * coluna SH_USUARIO.DS_SENHA_HASH e a conferencia acontece aqui mesmo.</p>
 *
 * <p>O token JWT continua sendo o mesmo de antes, entao o aplicativo React
 * Native e o painel Angular nao precisaram de nenhuma alteracao.</p>
 */
@Service
public class AuthService {

    private final JdbcUserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(JdbcUserRepository userRepository, JwtService jwtService,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Já existe um usuário cadastrado com este email");
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .address(request.address())
                .role(Role.USER)
                .reputation(5.0)
                .totalTransactions(0)
                .isVerified(false)
                .createdAt(new Date())
                .build();

        user = userRepository.insert(user, passwordEncoder.encode(request.password()));

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return new AuthResponse(token, UserResponse.from(user));
    }

    public AuthResponse login(LoginRequest request) {
        String hash = userRepository.findPasswordHashByEmail(request.email())
                .orElseThrow(() -> new UnauthorizedException("Email ou senha inválidos"));

        if (!passwordEncoder.matches(request.password(), hash)) {
            throw new UnauthorizedException("Email ou senha inválidos");
        }

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new UnauthorizedException("Email ou senha inválidos"));

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole().name());
        return new AuthResponse(token, UserResponse.from(user));
    }
}
