package br.com.fiap.smarthas.dto.message;

import br.com.fiap.smarthas.entity.Message;

import java.time.Instant;

public record MessageResponse(
        String id,
        String senderId,
        String receiverId,
        String resourceId,
        String content,
        Instant timestamp,
        Boolean read
) {
    public static MessageResponse from(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getSenderId(),
                message.getReceiverId(),
                message.getResourceId(),
                message.getContent(),
                message.getTimestamp() != null ? message.getTimestamp().toInstant() : null,
                message.getRead()
        );
    }
}
