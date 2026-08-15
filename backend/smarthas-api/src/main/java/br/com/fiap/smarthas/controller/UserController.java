package br.com.fiap.smarthas.controller;

import br.com.fiap.smarthas.dto.user.PublicUserResponse;
import br.com.fiap.smarthas.dto.user.UpdateUserRequest;
import br.com.fiap.smarthas.dto.user.UserResponse;
import br.com.fiap.smarthas.security.AuthUtils;
import br.com.fiap.smarthas.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Authentication authentication) {
        return ResponseEntity.ok(userService.getMe(AuthUtils.currentUserId(authentication)));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateMe(Authentication authentication, @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateMe(AuthUtils.currentUserId(authentication), request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PublicUserResponse> getPublicProfile(@PathVariable String id) {
        return ResponseEntity.ok(userService.getPublicProfile(id));
    }

    @GetMapping
    public ResponseEntity<Page<UserResponse>> listUsers(Pageable pageable) {
        return ResponseEntity.ok(userService.listUsers(pageable));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
