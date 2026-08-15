package br.com.fiap.smarthas.controller;

import br.com.fiap.smarthas.dto.message.ConversationResponse;
import br.com.fiap.smarthas.dto.message.MessageResponse;
import br.com.fiap.smarthas.dto.message.SendMessageRequest;
import br.com.fiap.smarthas.security.AuthUtils;
import br.com.fiap.smarthas.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> conversations(Authentication authentication) {
        return ResponseEntity.ok(messageService.getConversations(AuthUtils.currentUserId(authentication)));
    }

    @GetMapping("/conversation/{userId}")
    public ResponseEntity<List<MessageResponse>> conversation(Authentication authentication,
                                                                @PathVariable String userId,
                                                                @RequestParam(required = false) String resourceId) {
        String currentUserId = AuthUtils.currentUserId(authentication);
        return ResponseEntity.ok(messageService.getConversation(currentUserId, userId, resourceId));
    }

    @PostMapping
    public ResponseEntity<MessageResponse> send(Authentication authentication, @Valid @RequestBody SendMessageRequest request) {
        MessageResponse response = messageService.send(AuthUtils.currentUserId(authentication), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<MessageResponse> markAsRead(Authentication authentication, @PathVariable String id) {
        return ResponseEntity.ok(messageService.markAsRead(AuthUtils.currentUserId(authentication), id));
    }
}
