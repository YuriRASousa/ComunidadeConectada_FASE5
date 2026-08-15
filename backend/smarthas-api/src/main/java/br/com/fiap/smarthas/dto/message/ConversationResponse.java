package br.com.fiap.smarthas.dto.message;

import br.com.fiap.smarthas.dto.user.PublicUserResponse;

public record ConversationResponse(
        PublicUserResponse otherUser,
        MessageResponse lastMessage,
        long unreadCount
) {
}
