package br.com.fiap.smarthas.entity;

import br.com.fiap.smarthas.entity.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

/**
 * Morador da comunidade, correspondente a uma linha da tabela SH_USUARIO.
 *
 * <p>O id continua sendo texto na aplicacao para nao quebrar o contrato JSON
 * usado pelo aplicativo e pelo painel; no banco ele e o NUMBER da sequence
 * SQ_SH_USUARIO. O hash da senha fica apenas no banco e nunca sobe para esta
 * classe, entao nao ha risco de ele vazar em uma resposta da API.</p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    private String id;

    private String name;

    private String email;

    private String address;

    private String profileImageUrl;

    @Builder.Default
    private Double reputation = 5.0;

    @Builder.Default
    private Integer totalTransactions = 0;

    @Builder.Default
    private Boolean isVerified = false;

    @Builder.Default
    private Role role = Role.USER;

    @Builder.Default
    private Date createdAt = new Date();
}
