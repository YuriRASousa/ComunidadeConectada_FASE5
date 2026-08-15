package br.com.fiap.smarthas.service;

import br.com.fiap.smarthas.dto.message.ConversationResponse;
import br.com.fiap.smarthas.dto.message.MessageResponse;
import br.com.fiap.smarthas.dto.message.SendMessageRequest;
import br.com.fiap.smarthas.dto.user.PublicUserResponse;
import br.com.fiap.smarthas.entity.Message;
import br.com.fiap.smarthas.entity.User;
import br.com.fiap.smarthas.exception.ForbiddenException;
import br.com.fiap.smarthas.exception.ResourceNotFoundException;
import br.com.fiap.smarthas.repository.FirestoreMessageRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class MessageService {

    private final FirestoreMessageRepository messageRepository;
    private final UserService userService;
    private final ResourceService resourceService;

    public MessageService(FirestoreMessageRepository messageRepository, UserService userService, ResourceService resourceService) {
        this.messageRepository = messageRepository;
        this.userService = userService;
        this.resourceService = resourceService;
    }

    public MessageResponse send(String senderId, SendMessageRequest request) {
        userService.getEntityById(senderId);
        userService.getEntityById(request.receiverId());
        if (request.resourceId() != null) {
            resourceService.getEntityById(request.resourceId());
        }

        Message message = Message.builder()
                .senderId(senderId)
                .receiverId(request.receiverId())
                .resourceId(request.resourceId())
                .content(request.content())
                .timestamp(new Date())
                .read(false)
                .build();

        return MessageResponse.from(messageRepository.save(message));
    }

    public List<MessageResponse> getConversation(String userId, String otherUserId, String resourceId) {
        // ensure both users exist
        userService.getEntityById(userId);
        userService.getEntityById(otherUserId);
        return messageRepository.findConversation(userId, otherUserId, resourceId).stream()
                .map(MessageResponse::from)
                .toList();
    }

    public List<ConversationResponse> getConversations(String userId) {
        List<Message> all = messageRepository.findAllForUser(userId);

        Map<String, List<Message>> byOtherUser = new LinkedHashMap<>();
        for (Message m : all) {
            String otherId = m.getSenderId().equals(userId) ? m.getReceiverId() : m.getSenderId();
            byOtherUser.computeIfAbsent(otherId, k -> new java.util.ArrayList<>()).add(m);
        }

        return byOtherUser.entrySet().stream()
                .map(entry -> {
                    String otherId = entry.getKey();
                    List<Message> msgs = entry.getValue();
                    Message last = msgs.stream()
                            .max(Comparator.comparing(Message::getTimestamp))
                            .orElseThrow();
                    long unread = msgs.stream()
                            .filter(m -> m.getReceiverId().equals(userId) && !Boolean.TRUE.equals(m.getRead()))
                            .count();
                    User other = userService.getEntityById(otherId);
                    return new ConversationResponse(
                            PublicUserResponse.from(other),
                            MessageResponse.from(last),
                            unread
                    );
                })
                .sorted((a, b) -> b.lastMessage().timestamp().compareTo(a.lastMessage().timestamp()))
                .toList();
    }

    public MessageResponse markAsRead(String userId, String messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Mensagem não encontrada: " + messageId));

        if (!message.getReceiverId().equals(userId)) {
            throw new ForbiddenException("Você não tem permissão para marcar esta mensagem como lida");
        }

        message.setRead(true);
        return MessageResponse.from(messageRepository.save(message));
    }
}
