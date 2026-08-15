package br.com.fiap.smarthas.security;

import br.com.fiap.smarthas.entity.User;
import br.com.fiap.smarthas.repository.FirestoreUserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Spring Security still wants a UserDetailsService#loadUserByUsername(String).
 * Since our JWT subject is the Firebase UID (not the email), "username" here
 * really means "UID" - Firebase Authentication is the actual identity
 * provider, this class only resolves the Firestore profile document.
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final FirestoreUserRepository userRepository;

    public CustomUserDetailsService(FirestoreUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String uid) throws UsernameNotFoundException {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + uid));
        return new UserPrincipal(user);
    }
}
