package br.com.fiap.smarthas.controller;

import br.com.fiap.smarthas.dto.resource.ResourceRequest;
import br.com.fiap.smarthas.dto.resource.ResourceResponse;
import br.com.fiap.smarthas.entity.enums.Availability;
import br.com.fiap.smarthas.entity.enums.Category;
import br.com.fiap.smarthas.entity.enums.ResourceType;
import br.com.fiap.smarthas.security.AuthUtils;
import br.com.fiap.smarthas.service.ResourceService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @GetMapping
    public ResponseEntity<Page<ResourceResponse>> search(
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) Availability availability,
            @RequestParam(required = false) String q,
            Pageable pageable) {
        return ResponseEntity.ok(resourceService.search(category, type, availability, q, pageable));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<ResourceResponse>> mine(Authentication authentication) {
        return ResponseEntity.ok(resourceService.getMine(AuthUtils.currentUserId(authentication)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(resourceService.getById(id));
    }

    @PostMapping
    public ResponseEntity<ResourceResponse> create(Authentication authentication, @Valid @RequestBody ResourceRequest request) {
        ResourceResponse created = resourceService.create(AuthUtils.currentUserId(authentication), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResourceResponse> update(Authentication authentication, @PathVariable String id,
                                                     @Valid @RequestBody ResourceRequest request) {
        return ResponseEntity.ok(resourceService.update(AuthUtils.currentUserId(authentication), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable String id) {
        resourceService.delete(AuthUtils.currentUserId(authentication), id);
        return ResponseEntity.noContent().build();
    }
}
