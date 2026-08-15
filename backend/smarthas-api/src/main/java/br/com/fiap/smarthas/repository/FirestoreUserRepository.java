package br.com.fiap.smarthas.repository;

import br.com.fiap.smarthas.entity.User;
import br.com.fiap.smarthas.exception.FirestoreOperationException;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

/**
 * Thin repository-style wrapper around the Firestore {@code users} collection.
 * Document ID = Firebase Authentication UID.
 */
@Repository
public class FirestoreUserRepository {

    private static final String COLLECTION = "users";

    private final Firestore firestore;

    public FirestoreUserRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    public Optional<User> findById(String id) {
        if (id == null) {
            return Optional.empty();
        }
        try {
            DocumentSnapshot doc = firestore.collection(COLLECTION).document(id).get().get();
            if (!doc.exists()) {
                return Optional.empty();
            }
            return Optional.of(toEntity(doc));
        } catch (InterruptedException | ExecutionException e) {
            throw new FirestoreOperationException("Erro ao buscar usuário " + id, e);
        }
    }

    public Optional<User> findByEmail(String email) {
        try {
            var results = firestore.collection(COLLECTION)
                    .whereEqualTo("email", email)
                    .limit(1)
                    .get().get();
            if (results.isEmpty()) {
                return Optional.empty();
            }
            return Optional.of(toEntity(results.getDocuments().get(0)));
        } catch (InterruptedException | ExecutionException e) {
            throw new FirestoreOperationException("Erro ao buscar usuário pelo email " + email, e);
        }
    }

    public boolean existsByEmail(String email) {
        return findByEmail(email).isPresent();
    }

    public boolean existsById(String id) {
        return findById(id).isPresent();
    }

    public User save(User user) {
        if (user.getId() == null || user.getId().isBlank()) {
            throw new IllegalStateException("User.id (Firebase UID) é obrigatório para salvar no Firestore");
        }
        try {
            firestore.collection(COLLECTION).document(user.getId()).set(user).get();
            return user;
        } catch (InterruptedException | ExecutionException e) {
            throw new FirestoreOperationException("Erro ao salvar usuário " + user.getId(), e);
        }
    }

    public void deleteById(String id) {
        try {
            firestore.collection(COLLECTION).document(id).delete().get();
        } catch (InterruptedException | ExecutionException e) {
            throw new FirestoreOperationException("Erro ao remover usuário " + id, e);
        }
    }

    public long count() {
        try {
            return firestore.collection(COLLECTION).get().get().size();
        } catch (InterruptedException | ExecutionException e) {
            throw new FirestoreOperationException("Erro ao contar usuários", e);
        }
    }

    /** Firestore has no native OFFSET/LIMIT-friendly relational pagination for
     * this simple case, so (as documented for the resource search too) we just
     * fetch the whole (small, school-project sized) collection and paginate
     * in-memory. */
    public Page<User> findAll(Pageable pageable) {
        try {
            List<QueryDocumentSnapshot> docs = firestore.collection(COLLECTION).get().get().getDocuments();
            List<User> all = docs.stream().map(this::toEntity).toList();

            int start = (int) pageable.getOffset();
            if (start >= all.size()) {
                return new PageImpl<>(List.of(), pageable, all.size());
            }
            int end = Math.min(start + pageable.getPageSize(), all.size());
            return new PageImpl<>(all.subList(start, end), pageable, all.size());
        } catch (InterruptedException | ExecutionException e) {
            throw new FirestoreOperationException("Erro ao listar usuários", e);
        }
    }

    private User toEntity(DocumentSnapshot doc) {
        User user = doc.toObject(User.class);
        if (user != null) {
            user.setId(doc.getId());
        }
        return user;
    }
}
