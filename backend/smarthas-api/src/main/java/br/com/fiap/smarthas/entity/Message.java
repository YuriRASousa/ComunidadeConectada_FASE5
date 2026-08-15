package br.com.fiap.smarthas.entity;

import com.google.cloud.firestore.annotation.Exclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

/**
 * Firestore document in the {@code messages} collection (auto-generated ID).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Exclude
    private String id;

    private String senderId;

    private String receiverId;

    private String resourceId;

    private String content;

    @Builder.Default
    private Date timestamp = new Date();

    @Builder.Default
    private Boolean read = false;
}
