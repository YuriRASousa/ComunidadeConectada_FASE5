package br.com.fiap.smarthas.service;

import br.com.fiap.smarthas.dto.admin.AdminStatsResponse;
import br.com.fiap.smarthas.entity.enums.Category;
import br.com.fiap.smarthas.repository.FirestoreMessageRepository;
import br.com.fiap.smarthas.repository.FirestoreResourceRepository;
import br.com.fiap.smarthas.repository.FirestoreUserRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class AdminService {

    private final FirestoreUserRepository userRepository;
    private final FirestoreResourceRepository resourceRepository;
    private final FirestoreMessageRepository messageRepository;

    public AdminService(FirestoreUserRepository userRepository, FirestoreResourceRepository resourceRepository,
                         FirestoreMessageRepository messageRepository) {
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
        this.messageRepository = messageRepository;
    }

    public AdminStatsResponse getStats() {
        Map<String, Long> byCategory = new LinkedHashMap<>();
        for (Category category : Category.values()) {
            byCategory.put(category.name(), resourceRepository.countByCategory(category));
        }

        return new AdminStatsResponse(
                userRepository.count(),
                resourceRepository.count(),
                messageRepository.count(),
                byCategory
        );
    }
}
