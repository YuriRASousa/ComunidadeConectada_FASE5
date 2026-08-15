package br.com.fiap.smarthas.service;

import br.com.fiap.smarthas.dto.resource.ResourceRequest;
import br.com.fiap.smarthas.dto.resource.ResourceResponse;
import br.com.fiap.smarthas.entity.Resource;
import br.com.fiap.smarthas.entity.User;
import br.com.fiap.smarthas.entity.enums.Availability;
import br.com.fiap.smarthas.entity.enums.Category;
import br.com.fiap.smarthas.entity.enums.ResourceType;
import br.com.fiap.smarthas.entity.enums.Role;
import br.com.fiap.smarthas.exception.ForbiddenException;
import br.com.fiap.smarthas.exception.ResourceNotFoundException;
import br.com.fiap.smarthas.repository.FirestoreMessageRepository;
import br.com.fiap.smarthas.repository.FirestoreResourceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class ResourceService {

    private final FirestoreResourceRepository resourceRepository;
    private final UserService userService;
    private final FirestoreMessageRepository messageRepository;

    public ResourceService(FirestoreResourceRepository resourceRepository, UserService userService,
                            FirestoreMessageRepository messageRepository) {
        this.resourceRepository = resourceRepository;
        this.userService = userService;
        this.messageRepository = messageRepository;
    }

    public Page<ResourceResponse> search(Category category, ResourceType type, Availability availability,
                                          String q, Pageable pageable) {
        return resourceRepository.search(category, type, availability, q, pageable)
                .map(ResourceResponse::from);
    }

    public ResourceResponse getById(String id) {
        return ResourceResponse.from(getEntityById(id));
    }

    public Resource getEntityById(String id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recurso não encontrado: " + id));
    }

    public List<ResourceResponse> getMine(String userId) {
        User owner = userService.getEntityById(userId);
        return resourceRepository.findByOfferantId(owner.getId()).stream()
                .map(ResourceResponse::from)
                .toList();
    }

    public ResourceResponse create(String userId, ResourceRequest request) {
        User offerant = userService.getEntityById(userId);
        Resource resource = Resource.builder()
                .title(request.title())
                .description(request.description())
                .category(request.category())
                .condition(request.condition())
                .type(request.type())
                .availability(request.availability() != null ? request.availability() : Availability.DISPONIVEL)
                .imageUrl(request.imageUrl())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .offerantId(offerant.getId())
                .offerantName(offerant.getName())
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();
        return ResourceResponse.from(resourceRepository.save(resource));
    }

    public ResourceResponse update(String userId, String resourceId, ResourceRequest request) {
        Resource resource = getEntityById(resourceId);
        assertOwnerOrAdmin(userId, resource);

        resource.setTitle(request.title());
        resource.setDescription(request.description());
        resource.setCategory(request.category());
        resource.setCondition(request.condition());
        resource.setType(request.type());
        if (request.availability() != null) {
            resource.setAvailability(request.availability());
        }
        resource.setImageUrl(request.imageUrl());
        resource.setLatitude(request.latitude());
        resource.setLongitude(request.longitude());
        resource.setUpdatedAt(new Date());

        return ResourceResponse.from(resourceRepository.save(resource));
    }

    public void delete(String userId, String resourceId) {
        Resource resource = getEntityById(resourceId);
        assertOwnerOrAdmin(userId, resource);

        // Messages reference this resource optionally; detach them instead of
        // leaving a dangling resourceId, so message history survives.
        var relatedMessages = messageRepository.findByResourceId(resourceId);
        relatedMessages.forEach(m -> m.setResourceId(null));
        messageRepository.saveAll(relatedMessages);

        resourceRepository.delete(resource);
    }

    private void assertOwnerOrAdmin(String userId, Resource resource) {
        User requester = userService.getEntityById(userId);
        boolean isOwner = resource.getOfferantId().equals(userId);
        boolean isAdmin = requester.getRole() == Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("Você não tem permissão para modificar este recurso");
        }
    }
}
