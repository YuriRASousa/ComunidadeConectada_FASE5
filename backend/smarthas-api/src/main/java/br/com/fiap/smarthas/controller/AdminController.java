package br.com.fiap.smarthas.controller;

import br.com.fiap.smarthas.dto.admin.AdminStatsResponse;
import br.com.fiap.smarthas.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> stats() {
        return ResponseEntity.ok(adminService.getStats());
    }
}
