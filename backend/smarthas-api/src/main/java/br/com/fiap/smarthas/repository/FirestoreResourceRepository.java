package br.com.fiap.smarthas.repository;

import br.com.fiap.smarthas.entity.Resource;
import br.com.fiap.smarthas.entity.enums.Availability;
import br.com.fiap.smarthas.entity.enums.Category;
import br.com.fiap.smarthas.entity.enums.ResourceType;
import br.com.fiap.smarthas.exception.FirestoreOperationException;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

/**
 * Thin repository-style wrapper around the Firestore {@code resources}
 * collection (auto-generated document IDs).
 *
 * Pragmatic choice: Firestore doesn't support free-text search or OR'd
 * substring matching natively, and this is a small school-project dataset,
 * so {@code q} (and pagination on top of it) is applied in-memory after the
 * exact-match filters ({@code category}/{@code type}/{@code availability})
 * are pushed down as Firestore {@code whereEqualTo} clauses.
 */
@Repository
public class FirestoreResourceRepository {

    private static final String COLLECTION = "resources";

    private final Firestore firestore;

    public FirestoreResourceRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    public Page<Resource> search(Category category, ResourceType type, Availability availability,
                                  String q, Pageable pageable) {
        try {
            Query query = firestore.collection(COLLECTION);
            if (category != null) {
                query = query.whereEqualTo("category", category.name());
            }
            if (type != null) {
                query = query.whereEqualTo("type", type.name());
            }
            if (availability != null) {
                query = query.whereEqualTo("availability", availability.name());
            }

            List<QueryDocumentSnapshot> docs = query.get().get().getDocuments();
            List<Resource> matched = docs.stream()
                    .map(this::toEntity)
                    .filter(r -> matchesQuery(r, q))
                    .toList();

            int start = (int) pageable.getOffset();
            if (start >= matched.size()) {
                return new PageImpl<>(List.of(), pageable, matched.size());
            }
            int end = Math.min(start + pageable.getPageSize(), matched.size());
            return new PageImpl<>(matched.subList(start, end), pageable, matched.size());
        } catch (InterruptedException | ExecutionException e) {
            throw new FirestoreOperationException("Erro ao buscar recursos", e);
        }
    }

    private boolean matchesQuery(Resource r, String q) {
        if (q == null || q.isBlank()) {
            return true;
        }
        String needle = q.toLowerCase();
        return (r.getTitle() != null && r.getTitle().toLowerCase().contains(needle))
                || (r.getDescription() != null && r.getDescription().toLowerCase().contains(needle));
    }

    public Optional<Resource> findById(String id) {
        try {
            DocumentSnapshot doc = firestore.collection(COLLECTION).document(id).get().get();
            if (!doc.exists()) {
                return Optional.empty();
            }
            return Optional.of(toEntity(doc));
        } catch (InterruptedException | ExecutionException e) {
            throw new FirestoreOperationException("Erro ao buscar recurso " + id, e);
        }
    }

    public List<Resource> findByOfferantId(String offerantId) {
        try {
            return firestore.collection(COLLECTION)
                    .whereEqualTo("offerantId", offerantId)
                    .get().get().getDocuments().stream()
                    .map(this::toEntity)
                    .toList();
        } catch (InterruptedException | ExecutionException e) {
            throw new FirestoreOperationException("Erro ao buscar recursos do usuário " + offerantId, e);
        }
    }

    public Resource save(Resource resource) {
        try {
            if (resource.getId() == null || resource.getId().isBlank()) {
                var docRef = firestore.collection(COLLECTION).document();
                resource.setId(docRef.getId());
                docRef.set(resource).get();
            } else {
                firestore.collection(COLLECTION).document(resource.getId()).set(resource).get();
            }
            return resource;
        } catch (InterruptedException | ExecutionException e) {
            throw new FirestoreOperationException("Erro ao salvar recurso", e);
        }
    }

    public void delete(Resource resource) {
        try {
            firestore.collection(COLLECTION).document(resource.getId()).delete().get();
        } catch (InterruptedException | ExecutionException e) {
            throw new FirestoreOperationException("Erro ao remover recurso " + resource.getId(), e);
        }
    }

    public long count() {
        try {
            return firestore.collection(COLLECTION).get().get().size();
        } catch (InterruptedException | ExecutionException e) {
            throw new FirestoreOperationException("Erro ao contar recursos", e);
        }
    }

    public long countByCategory(Category category) {
        try {
            return firestore.collection(COLLECTION)
                    .whereEqualTo("category", category.name())
                    .get().get().size();
        } catch (InterruptedException | ExecutionException e) {
            throw new FirestoreOperationException("Erro ao contar recursos por categoria", e);
        }
    }

    private Resource toEntity(DocumentSnapshot doc) {
        Resource resource = doc.toObject(Resource.class);
        if (resource != null) {
            resource.setId(doc.getId());
        }
        return resource;
    }
}
