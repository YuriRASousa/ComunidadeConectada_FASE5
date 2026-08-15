package br.com.fiap.smarthas.exception;

/** Wraps checked exceptions (InterruptedException/ExecutionException) thrown by
 * Firestore/Firebase Admin SDK's ApiFuture#get() calls into an unchecked one,
 * so the Firestore-backed repositories can keep the same synchronous method
 * shapes the JPA repositories used to have. */
public class FirestoreOperationException extends RuntimeException {
    public FirestoreOperationException(String message, Throwable cause) {
        super(message, cause);
    }
}
