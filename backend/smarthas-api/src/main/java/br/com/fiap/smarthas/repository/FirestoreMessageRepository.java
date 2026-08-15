package br.com.fiap.smarthas.repository;

import br.com.fiap.smarthas.entity.Message;
import br.com.fiap.smarthas.exception.FirestoreOperationException;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

/**
 * Thin repository-style wrapper around the Firestore {@code messages}
 * collection (auto-generated document IDs). Firestore queries can't OR two
 * equality clauses across different fields, so "all messages for a user"
 * and "conversation between two users" are each built from two
 * single-field queries merged/sorted in-memory.
 */
@Repository
public class FirestoreMessageRepository {

    private static final String COLLECTION = "messages";

    private final Firestore firestore;

    public FirestoreMessageRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    public Message save(Message message) {
        try {
            if (message.getId() == null || message.getId().isBlank()) {
                var docRef = firestore.collection(COLLECTION).document();
                message.setId(docRef.getId());
                docRef.set(message).get();
            } else {
                firestore.collection(COLLECTION).document(message.getId()).set(message).get();
            }
            return message;
        } catch (InterruptedException | ExecutionException e) {
            throw new FirestoreOperationException("Erro ao salvar mensagem", e);
        }
    }

    public Optional<Message> findById(String id) {
        try {
            DocumentSnapshot doc = firestore.collection(COLLECTION).document(id).get().get();
            if (!doc.exists()) {
                return Optional.empty();
            }
            return Optional.of(toEntity(doc));
        } catch (InterruptedException | ExecutionException e) {
            throw new FirestoreOperationException("Erro ao buscar mensagem " + id, e);
        }
    }

    public List<Message> findAllForUser(String userId) {
        try {
            List<QueryDocumentSnapshot> sent = firestore.collection(COLLECTION)
                    .whereEqualTo("senderId", userId).get().get().getDocuments();
            List<QueryDocumentSnapshot> received = firestore.collection(COLLECTION)
                    .whereEqualTo("receiverId", userId).get().get().getDocuments();

            Map<String, Message> byId = new LinkedHashMap<>();
            for (QueryDocumentSnapshot doc : sent) {
                Message m = toEntity(doc);
                byId.put(m.getId(), m);
            }
            for (QueryDocumentSnapshot doc : received) {
                Message m = toEntity(doc);
                byId.put(m.getId(), m);
            }
            List<Message> all = new ArrayList<>(byId.values());
            all.sort(Comparator.comparing(Message::getTimestamp));
            return all;
        } catch (InterruptedException | ExecutionException e) {
            throw new FirestoreOperationException("Erro ao buscar mensagens do usuário " + userId, e);
        }
    }

    public List<Message> findConversation(String userId1, String userId2, String resourceId) {
        try {
            List<QueryDocumentSnapshot> aToB = firestore.collection(COLLECTION)
                    .whereEqualTo("senderId", userId1).whereEqualTo("receiverId", userId2)
                    .get().get().getDocuments();
            List<QueryDocumentSnapshot> bToA = firestore.collection(COLLECTION)
                    .whereEqualTo("senderId", userId2).whereEqualTo("receiverId", userId1)
                    .get().get().getDocuments();

            Map<String, Message> byId = new LinkedHashMap<>();
            for (QueryDocumentSnapshot doc : aToB) {
                Message m = toEntity(doc);
                byId.put(m.getId(), m);
            }
            for (QueryDocumentSnapshot doc : bToA) {
                Message m = toEntity(doc);
                byId.put(m.getId(), m);
            }

            List<Message> conversation = new ArrayList<>(byId.values());
            if (resourceId != null) {
                conversation = conversation.stream()
                        .filter(m -> resourceId.equals(m.getResourceId()))
                        .toList();
            }
            conversation = new ArrayList<>(conversation);
            conversation.sort(Comparator.comparing(Message::getTimestamp));
            return conversation;
        } catch (InterruptedException | ExecutionException e) {
            throw new FirestoreOperationException("Erro ao buscar conversa", e);
        }
    }

    public List<Message> findByResourceId(String resourceId) {
        try {
            return firestore.collection(COLLECTION)
                    .whereEqualTo("resourceId", resourceId)
                    .get().get().getDocuments().stream()
                    .map(this::toEntity)
                    .toList();
        } catch (InterruptedException | ExecutionException e) {
            throw new FirestoreOperationException("Erro ao buscar mensagens do recurso " + resourceId, e);
        }
    }

    public void saveAll(List<Message> messages) {
        for (Message message : messages) {
            save(message);
        }
    }

    public long count() {
        try {
            return firestore.collection(COLLECTION).get().get().size();
        } catch (InterruptedException | ExecutionException e) {
            throw new FirestoreOperationException("Erro ao contar mensagens", e);
        }
    }

    private Message toEntity(DocumentSnapshot doc) {
        Message message = doc.toObject(Message.class);
        if (message != null) {
            message.setId(doc.getId());
        }
        return message;
    }
}
