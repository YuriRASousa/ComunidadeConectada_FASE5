package br.com.fiap.smarthas.repository;

import br.com.fiap.smarthas.entity.User;
import br.com.fiap.smarthas.entity.enums.Role;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Acesso a tabela SH_USUARIO.
 *
 * <p>Substitui o {@code FirestoreUserRepository} da Fase 5 mantendo exatamente
 * a mesma assinatura publica, para os services nao precisarem mudar. O id
 * continua sendo {@code String} na aplicacao (era o UID do Firebase, agora e o
 * NUMBER do Oracle convertido), o que preserva o contrato JSON consumido pelo
 * aplicativo React Native e pelo painel Angular.</p>
 */
@Repository
public class JdbcUserRepository {

    private final JdbcTemplate jdbc;

    private static final String COLUNAS = """
            id_usuario, nm_usuario, ds_email, ds_endereco, url_foto_perfil,
            vl_reputacao, qt_transacoes, fl_verificado, ds_papel, dt_cadastro
            """;

    public JdbcUserRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<User> mapper = (rs, rowNum) -> User.builder()
            .id(String.valueOf(rs.getLong("id_usuario")))
            .name(rs.getString("nm_usuario"))
            .email(rs.getString("ds_email"))
            .address(rs.getString("ds_endereco"))
            .profileImageUrl(rs.getString("url_foto_perfil"))
            .reputation(rs.getDouble("vl_reputacao"))
            .totalTransactions(rs.getInt("qt_transacoes"))
            .isVerified("S".equals(rs.getString("fl_verificado")))
            .role(Role.valueOf(rs.getString("ds_papel")))
            .createdAt(rs.getTimestamp("dt_cadastro"))
            .build();

    /** Converte o id textual da API no NUMBER do banco. Id invalido vira vazio. */
    private static Optional<Long> toId(String id) {
        try {
            return Optional.of(Long.parseLong(id));
        } catch (NumberFormatException | NullPointerException e) {
            return Optional.empty();
        }
    }

    public Optional<User> findById(String id) {
        return toId(id).flatMap(numeric -> jdbc
                .query("SELECT " + COLUNAS + " FROM sh_usuario WHERE id_usuario = ?", mapper, numeric)
                .stream().findFirst());
    }

    public Optional<User> findByEmail(String email) {
        return jdbc.query("SELECT " + COLUNAS + " FROM sh_usuario WHERE LOWER(ds_email) = LOWER(?)",
                        mapper, email)
                .stream().findFirst();
    }

    /** Hash BCrypt guardado na coluna DS_SENHA_HASH, usado apenas no login. */
    public Optional<String> findPasswordHashByEmail(String email) {
        try {
            return Optional.ofNullable(jdbc.queryForObject(
                    "SELECT ds_senha_hash FROM sh_usuario WHERE LOWER(ds_email) = LOWER(?)",
                    String.class, email));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public boolean existsByEmail(String email) {
        Integer total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM sh_usuario WHERE LOWER(ds_email) = LOWER(?)", Integer.class, email);
        return total != null && total > 0;
    }

    public boolean existsById(String id) {
        return toId(id).map(numeric -> {
            Integer total = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM sh_usuario WHERE id_usuario = ?", Integer.class, numeric);
            return total != null && total > 0;
        }).orElse(false);
    }

    /** Insere o usuario ja com o hash da senha e devolve o id gerado pela sequence. */
    public User insert(User user, String passwordHash) {
        Long id = jdbc.queryForObject("SELECT sq_sh_usuario.NEXTVAL FROM dual", Long.class);

        jdbc.update("""
                INSERT INTO sh_usuario (
                    id_usuario, nm_usuario, ds_email, ds_senha_hash, ds_endereco,
                    url_foto_perfil, vl_reputacao, qt_transacoes, fl_verificado,
                    ds_papel, dt_cadastro, st_usuario
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, SYSDATE, 'A')
                """,
                id, user.getName(), user.getEmail(), passwordHash, user.getAddress(),
                user.getProfileImageUrl(),
                user.getReputation() != null ? user.getReputation() : 5.0,
                user.getTotalTransactions() != null ? user.getTotalTransactions() : 0,
                Boolean.TRUE.equals(user.getIsVerified()) ? "S" : "N",
                user.getRole() != null ? user.getRole().name() : Role.USER.name());

        user.setId(String.valueOf(id));
        return findById(user.getId()).orElse(user);
    }

    /** Atualiza os campos que o proprio morador edita no perfil. */
    public User save(User user) {
        Long id = toId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Id de usuario invalido: " + user.getId()));

        jdbc.update("""
                UPDATE sh_usuario
                   SET nm_usuario      = ?,
                       ds_endereco     = ?,
                       url_foto_perfil = ?,
                       vl_reputacao    = ?,
                       qt_transacoes   = ?,
                       fl_verificado   = ?,
                       ds_papel        = ?
                 WHERE id_usuario = ?
                """,
                user.getName(), user.getAddress(), user.getProfileImageUrl(),
                user.getReputation(), user.getTotalTransactions(),
                Boolean.TRUE.equals(user.getIsVerified()) ? "S" : "N",
                user.getRole() != null ? user.getRole().name() : Role.USER.name(),
                id);

        return findById(user.getId()).orElse(user);
    }

    /**
     * Exclusao logica. As chaves estrangeiras de recursos, mensagens e
     * emprestimos impedem o DELETE fisico, e o historico precisa continuar
     * existindo para os indicadores do painel fecharem.
     */
    public void deleteById(String id) {
        toId(id).ifPresent(numeric ->
                jdbc.update("UPDATE sh_usuario SET st_usuario = 'I' WHERE id_usuario = ?", numeric));
    }

    public long count() {
        Long total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM sh_usuario WHERE st_usuario = 'A'", Long.class);
        return total != null ? total : 0L;
    }

    public Page<User> findAll(Pageable pageable) {
        Long total = jdbc.queryForObject(
                "SELECT COUNT(*) FROM sh_usuario WHERE st_usuario = 'A'", Long.class);

        List<User> pagina = jdbc.query("""
                SELECT %s FROM sh_usuario
                 WHERE st_usuario = 'A'
                 ORDER BY nm_usuario
                OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
                """.formatted(COLUNAS),
                mapper, pageable.getOffset(), pageable.getPageSize());

        return new PageImpl<>(pagina, pageable, total != null ? total : 0L);
    }
}
