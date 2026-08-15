package br.com.fiap.smarthas.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.List;

/**
 * Initializes the Firebase Admin SDK (FirebaseApp / Firestore / FirebaseAuth)
 * from the service account credentials shipped at
 * {@code config/firebase-service-account.json} (path relative to the
 * process working directory - i.e. run the app from backend/smarthas-api).
 *
 * Firestore is accessed through the Admin SDK's gRPC-based client
 * ({@link #firestore}) as designed. Firebase *Authentication* admin
 * operations (create/lookup user), however, are done via direct REST calls
 * in {@link br.com.fiap.smarthas.security.FirebaseAuthAdminClient} instead
 * of {@code firebase-admin}'s own HTTP client - see that class's Javadoc for
 * why. The {@link GoogleCredentials} bean here is shared by both paths.
 */
@Configuration
public class FirebaseConfig {

    @Bean
    public GoogleCredentials googleCredentials(@Value("${firebase.credentials-path}") String credentialsPath) throws IOException {
        try (FileInputStream serviceAccount = new FileInputStream(credentialsPath)) {
            return GoogleCredentials.fromStream(serviceAccount)
                    .createScoped(List.of("https://www.googleapis.com/auth/cloud-platform"));
        }
    }

    @Bean
    public FirebaseApp firebaseApp(GoogleCredentials googleCredentials) {
        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }
        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(googleCredentials)
                .build();
        return FirebaseApp.initializeApp(options);
    }

    @Bean
    public Firestore firestore(FirebaseApp firebaseApp) {
        return FirestoreClient.getFirestore(firebaseApp);
    }

    @Bean
    public FirebaseAuth firebaseAuth(FirebaseApp firebaseApp) {
        return FirebaseAuth.getInstance(firebaseApp);
    }
}
