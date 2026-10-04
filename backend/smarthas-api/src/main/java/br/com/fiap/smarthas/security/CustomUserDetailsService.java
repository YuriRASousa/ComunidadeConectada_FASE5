package br.com.fiap.smarthas.security;

import br.com.fiap.smarthas.entity.User;
import br.com.fiap.smarthas.repository.JdbcUserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * O Spring Security continua pedindo um UserDetailsService#loadUserByUsername.
 * O assunto (subject) do nosso JWT e o identificador do usuario, que na Fase 6
 * passou a ser a chave primaria de SH_USUARIO em vez do UID do Firebase.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final JdbcUserRepository userRepository;

    public CustomUserDetailsService(JdbcUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String id) throws UsernameNotFoundException {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + id));
        return new UserPrincipal(user);
    }
}
