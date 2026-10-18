package br.com.fiap.smarthas.controller;

import br.com.fiap.smarthas.dto.admin.AdminStatsResponse;
import br.com.fiap.smarthas.dto.admin.AlertaResponse;
import br.com.fiap.smarthas.dto.admin.RecursoBuscaResponse;
import br.com.fiap.smarthas.dto.admin.ResumoUsuarioResponse;
import br.com.fiap.smarthas.dto.admin.RotinaResponse;
import br.com.fiap.smarthas.dto.admin.VolumetriaResponse;
import br.com.fiap.smarthas.dto.emprestimo.EmprestimoResponse;
import br.com.fiap.smarthas.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Administração", description = "Painel do administrador e rotinas PL/SQL")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> stats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    @GetMapping("/emprestimos")
    @Operation(summary = "Emprestimos solicitados ou ativos, ordenados pelo vencimento")
    public ResponseEntity<List<EmprestimoResponse>> emprestimos() {
        return ResponseEntity.ok(adminService.emprestimosEmAberto());
    }

    @GetMapping("/alertas")
    @Operation(summary = "Alertas abertos pelas rotinas PL/SQL")
    public ResponseEntity<List<AlertaResponse>> alertas() {
        return ResponseEntity.ok(adminService.alertasAbertos());
    }

    @PostMapping("/alertas/{id}/resolver")
    public ResponseEntity<Void> resolverAlerta(@PathVariable String id) {
        adminService.resolverAlerta(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/rotinas/detectar-atrasos")
    @Operation(summary = "Executa PKG_SH_EMPRESTIMO.DETECTA_ATRASOS")
    public ResponseEntity<RotinaResponse> detectarAtrasos() {
        return ResponseEntity.ok(adminService.detectarAtrasos());
    }

    @PostMapping("/rotinas/resumo-mensal")
    @Operation(summary = "Executa PKG_SH_ADMIN.GERA_RESUMO_MENSAL para a competencia informada")
    public ResponseEntity<RotinaResponse> gerarResumo(@RequestParam(required = false) Integer anoMes) {
        return ResponseEntity.ok(adminService.gerarResumoMensal(anoMes));
    }

    @GetMapping("/resumo-mensal")
    @Operation(summary = "Le a tabela de resumo ja consolidada")
    public ResponseEntity<List<ResumoUsuarioResponse>> resumo(@RequestParam(required = false) Integer anoMes) {
        return ResponseEntity.ok(adminService.resumoMensal(anoMes));
    }

    @PostMapping("/rotinas/volumetria")
    @Operation(summary = "Executa PKG_SH_ADMIN.PRC_VOLUMETRIA (SQL dinamico)")
    public ResponseEntity<RotinaResponse> coletarVolumetria() {
        return ResponseEntity.ok(adminService.coletarVolumetria());
    }

    @GetMapping("/volumetria")
    @Operation(summary = "Tamanho de cada tabela na ultima coleta")
    public ResponseEntity<List<VolumetriaResponse>> volumetria() {
        return ResponseEntity.ok(adminService.volumetriaAtual());
    }

    @GetMapping("/recursos/busca")
    @Operation(summary = "Busca dinamica de recursos (PKG_SH_ADMIN.BUSCA_RECURSOS)",
            description = "Filtros opcionais montados em tempo real no banco. ordem: RECENTE, NOME ou DISTANCIA.")
    public ResponseEntity<List<RecursoBuscaResponse>> buscarRecursos(
            @RequestParam(required = false) Long categoria,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) String disponibilidade,
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon,
            @RequestParam(required = false) Double raioKm,
            @RequestParam(defaultValue = "RECENTE") String ordem) {
        return ResponseEntity.ok(adminService.buscarRecursos(
                categoria, tipo, disponibilidade, texto, lat, lon, raioKm, ordem));
    }
}
