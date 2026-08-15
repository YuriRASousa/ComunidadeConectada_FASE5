package br.com.fiap.smarthas.config;

import br.com.fiap.smarthas.entity.Resource;
import br.com.fiap.smarthas.entity.User;
import br.com.fiap.smarthas.entity.enums.Availability;
import br.com.fiap.smarthas.entity.enums.Category;
import br.com.fiap.smarthas.entity.enums.Condition;
import br.com.fiap.smarthas.entity.enums.ResourceType;
import br.com.fiap.smarthas.entity.enums.Role;
import br.com.fiap.smarthas.repository.FirestoreResourceRepository;
import br.com.fiap.smarthas.repository.FirestoreUserRepository;
import br.com.fiap.smarthas.security.FirebaseAuthAdminClient;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Date;

/**
 * Seeds demo data into Firestore + Firebase Authentication on first run.
 * "Should I seed?" is decided by the Firestore {@code users} collection
 * being empty (not Firebase Auth), because a previous partial run could have
 * already created some of these accounts in Firebase Auth without writing
 * their Firestore profile doc yet - {@link #ensureUser} looks each one up by
 * email first and reuses it instead of blowing up on "already exists".
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final FirebaseAuthAdminClient firebaseAuthAdminClient;
    private final FirestoreUserRepository userRepository;
    private final FirestoreResourceRepository resourceRepository;

    public DataSeeder(FirebaseAuthAdminClient firebaseAuthAdminClient, FirestoreUserRepository userRepository,
                       FirestoreResourceRepository resourceRepository) {
        this.firebaseAuthAdminClient = firebaseAuthAdminClient;
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        User admin = ensureUser("admin@smarthas.com", "admin123", "Administrador", "Sede Smart HAS",
                Role.ADMIN, 5.0, 0, true);
        User yuri = ensureUser("yuri@exemplo.com", "123456", "Yuri Ribeiro",
                "Av. Paulista, 1000, São Paulo - SP", Role.USER, 4.9, 12, true);
        User joao = ensureUser("joao.silva@exemplo.com", "123456", "João Silva",
                "Rua Augusta, 500, São Paulo - SP", Role.USER, 4.7, 8, true);
        User maria = ensureUser("maria.oliveira@exemplo.com", "123456", "Maria Oliveira",
                "Rua Oscar Freire, 200, São Paulo - SP", Role.USER, 4.8, 15, true);
        User carlos = ensureUser("carlos.souza@exemplo.com", "123456", "Carlos Souza",
                "Alameda Santos, 800, São Paulo - SP", Role.USER, 4.6, 5, false);

        resourceRepository.save(Resource.builder()
                .title("Furadeira Bosch")
                .description("Furadeira de impacto em perfeito estado, acompanha brocas.")
                .category(Category.FERRAMENTAS)
                .condition(Condition.EXCELENTE)
                .type(ResourceType.EMPRESTIMO)
                .availability(Availability.DISPONIVEL)
                .latitude(-23.5631)
                .longitude(-46.6544)
                .offerantId(joao.getId())
                .offerantName(joao.getName())
                .createdAt(new Date())
                .updatedAt(new Date())
                .build());

        resourceRepository.save(Resource.builder()
                .title("Cadeira de Rodas")
                .description("Cadeira de rodas dobrável, semi-nova.")
                .category(Category.SAUDE)
                .condition(Condition.BOM)
                .type(ResourceType.EMPRESTIMO)
                .availability(Availability.DISPONIVEL)
                .latitude(-23.5689)
                .longitude(-46.6642)
                .offerantId(maria.getId())
                .offerantName(maria.getName())
                .createdAt(new Date())
                .updatedAt(new Date())
                .build());

        resourceRepository.save(Resource.builder()
                .title("Livro: Dom Casmurro")
                .description("Clássico da literatura brasileira em ótimo estado.")
                .category(Category.EDUCACAO)
                .condition(Condition.EXCELENTE)
                .type(ResourceType.TROCA)
                .availability(Availability.DISPONIVEL)
                .latitude(-23.5505)
                .longitude(-46.6333)
                .offerantId(carlos.getId())
                .offerantName(carlos.getName())
                .createdAt(new Date())
                .updatedAt(new Date())
                .build());

        System.out.println("Seed data criada: " + userRepository.count() + " usuários, "
                + resourceRepository.count() + " recursos.");
    }

    private User ensureUser(String email, String password, String name, String address, Role role,
                             double reputation, int totalTransactions, boolean verified) {
        String uid = firebaseAuthAdminClient.findUidByEmail(email)
                .orElseGet(() -> firebaseAuthAdminClient.createUser(email, password, name));

        return userRepository.findById(uid).orElseGet(() -> userRepository.save(User.builder()
                .id(uid)
                .name(name)
                .email(email)
                .address(address)
                .role(role)
                .reputation(reputation)
                .totalTransactions(totalTransactions)
                .isVerified(verified)
                .createdAt(new Date())
                .build()));
    }
}
