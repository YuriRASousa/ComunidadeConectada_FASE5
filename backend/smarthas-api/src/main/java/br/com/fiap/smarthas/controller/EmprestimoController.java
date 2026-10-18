package br.com.fiap.smarthas.controller;

import br.com.fiap.smarthas.dto.emprestimo.DevolucaoRequest;
import br.com.fiap.smarthas.dto.emprestimo.EmprestimoRequest;
import br.com.fiap.smarthas.dto.emprestimo.EmprestimoResponse;
import br.com.fiap.smarthas.dto.emprestimo.ProcedimentoResultado;
import br.com.fiap.smarthas.security.AuthUtils;
import br.com.fiap.smarthas.service.EmprestimoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Porta de entrada dos emprestimos. Cada endpoint abaixo termina em uma
 * procedure ou function PL/SQL, que e o caminho pedido na Parte 3 da Fase 6:
 * requisicao REST, backend Java, JDBC e Oracle.
 */
@RestController
@RequestMapping("/api/emprestimos")
@Tag(name = "Emprestimos", description = "Emprestimos entre moradores, com as regras dentro do Oracle")
public class EmprestimoController {

    private final EmprestimoService emprestimoService;

    public EmprestimoController(EmprestimoService emprestimoService) {
        this.emprestimoService = emprestimoService;
    }

    @PostMapping
    @Operation(summary = "Solicita um emprestimo (executa PKG_SH_EMPRESTIMO.REGISTRA_EMPRESTIMO)")
    public ResponseEntity<ProcedimentoResultado> solicitar(Authentication authentication,
                                                           @Valid @RequestBody EmprestimoRequest request) {
        ProcedimentoResultado resultado =
                emprestimoService.solicitar(AuthUtils.currentUserId(authentication), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
    }

    @PostMapping("/{id}/devolucao")
    @Operation(summary = "Registra a devolucao (executa PKG_SH_EMPRESTIMO.REGISTRA_DEVOLUCAO)")
    public ResponseEntity<ProcedimentoResultado> devolver(@PathVariable String id,
                                                          @Valid @RequestBody(required = false) DevolucaoRequest request) {
        return ResponseEntity.ok(emprestimoService.devolver(id, request));
    }

    @GetMapping("/meus")
    @Operation(summary = "Emprestimos em que o morador aparece como dono ou solicitante")
    public ResponseEntity<List<EmprestimoResponse>> meus(Authentication authentication) {
        return ResponseEntity.ok(emprestimoService.meus(AuthUtils.currentUserId(authentication)));
    }

    @GetMapping("/indice-circularidade")
    @Operation(summary = "Indicador calculado por PKG_SH_CALCULOS.INDICE_CIRCULARIDADE")
    public ResponseEntity<Map<String, Object>> indice(Authentication authentication,
                                                      @RequestParam(required = false) Integer anoMes) {
        int competencia = anoMes != null ? anoMes : EmprestimoService.competenciaAtual();
        BigDecimal valor = emprestimoService.indiceCircularidade(
                AuthUtils.currentUserId(authentication), competencia);
        return ResponseEntity.ok(Map.of("anoMes", competencia, "indiceCircularidade", valor));
    }

    @GetMapping("/ficha/{resourceId}")
    @Operation(summary = "Ficha do item formatada por PKG_SH_CALCULOS.FICHA_RECURSO")
    public ResponseEntity<Map<String, String>> ficha(@PathVariable String resourceId) {
        return ResponseEntity.ok(Map.of("ficha", emprestimoService.fichaRecurso(resourceId)));
    }
}
