package br.com.fiap.smarthas.service;

import br.com.fiap.smarthas.dto.user.PublicUserResponse;
import br.com.fiap.smarthas.dto.user.UpdateUserRequest;
import br.com.fiap.smarthas.dto.user.UserResponse;
import br.com.fiap.smarthas.entity.User;
import br.com.fiap.smarthas.exception.ResourceNotFoundException;
import br.com.fiap.smarthas.repository.FirestoreUserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final FirestoreUserRepository userRepository;

    public UserService(FirestoreUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getEntityById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado: " + id));
    }

    public UserResponse getMe(String userId) {
        return UserResponse.from(getEntityById(userId));
    }

    public PublicUserResponse getPublicProfile(String id) {
        return PublicUserResponse.from(getEntityById(id));
    }

    public UserResponse updateMe(String userId, UpdateUserRequest request) {
        User user = getEntityById(userId);
        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name());
        }
        if (request.address() != null && !request.address().isBlank()) {
            user.setAddress(request.address());
        }
        if (request.profileImageUrl() != null) {
            user.setProfileImageUrl(request.profileImageUrl());
        }
        return UserResponse.from(userRepository.save(user));
    }

    public Page<UserResponse> listUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(UserResponse::from);
    }

    public void deleteUser(String id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("Usuário não encontrado: " + id);
        }
        userRepository.deleteById(id);
    }
}
