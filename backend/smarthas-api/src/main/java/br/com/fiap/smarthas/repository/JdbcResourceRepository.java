package br.com.fiap.smarthas.repository;

import br.com.fiap.smarthas.entity.Resource;
import br.com.fiap.smarthas.entity.enums.Availability;
import br.com.fiap.smarthas.entity.enums.Category;
import br.com.fiap.smarthas.entity.enums.Condition;
import br.com.fiap.smarthas.entity.enums.ResourceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Acesso a tabela SH_RECURSO.
 *
 * <p>A categoria, que na Fase 5 era apenas um enum gravado como texto no
 * documento do Firestore, agora e chave estrangeira para SH_CATEGORIA. A
 * conversao acontece aqui, entao o restante da aplicacao continua trabalhando
 * com o enum {@link Category}.</p>
 */
@Repository
public class JdbcResourceRepository {

    private final JdbcTemplate jdbc;

    private static final String SELECT_BASE = """
            SELECT r.id_recurso, r.nm_recurso, r.ds_recurso, c.nm_categoria,
                   r.ds_condicao, r.ds_tipo, r.ds_disponibilidade, r.url_imagem,
                   r.vl_latitude, r.vl_longitude, r.id_usuario, u.nm_usuario,
                   r.dt_cadastro, r.dt_atualizacao
              FROM sh_recurso r
                   INNER JOIN sh_categoria c ON (c.id_categoria = r.id_categoria)
                   INNER JOIN sh_usuario   u ON (u.id_usuario   = r.id_usuario)
            """;

    public JdbcResourceRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<Resource> mapper = (rs, rowNum) -> Resource.builder()
            .id(String.valueOf(rs.getLong("id_recurso")))
            .title(rs.getString("nm_recurso"))
            .description(rs.getString("ds_recurso"))
            .category(Category.valueOf(rs.getString("nm_categoria")))
            .condition(Condition.valueOf(rs.getString("ds_condicao")))
            .type(ResourceType.valueOf(rs.getString("ds_tipo")))
            .availability(Availability.valueOf(rs.getString("ds_disponibilidade")))
            .imageUrl(rs.getString("url_imagem"))
            .latitude(rs.getObject("vl_latitude") != null ? rs.getDouble("vl_latitude") : null)
            .longitude(rs.getObject("vl_longitude") != null ? rs.getDouble("vl_longitude") : null)
            .offerantId(String.valueOf(rs.getLong("id_usuario")))
            .offerantName(rs.getString("nm_usuario"))
            .createdAt(rs.getTimestamp("dt_cadastro"))
            .updatedAt(rs.getTimestamp("dt_atualizacao"))
            .build();

    private static Optional<Long> toId(String id) {
        try {
            return Optional.of(Long.parseLong(id));
        } catch (NumberFormatException | NullPointerException e) {
            return Optional.empty();
        }
    }

    /**
     * Busca da vitrine, com os mesmos filtros opcionais da Fase 5. O SQL e
     * montado por partes para nao aplicar condicao de filtro que o usuario
     * nao pediu.
     */
    public Page<Resource> search(Category category, ResourceType type, Availability availability,
                                 String q, Pageable pageable) {
        StringBuilder where = new StringBuilder(" WHERE 1 = 1");
        List<Object> parametros = new ArrayList<>();

        if (category != null) {
            where.append(" AND c.nm_categoria = ?");
            parametros.add(category.name());
        }
        if (type != null) {
            where.append(" AND r.ds_tipo = ?");
            parametros.add(type.name());
        }
        if (availability != null) {
            where.append(" AND r.ds_disponibilidade = ?");
            parametros.add(availability.name());
        }
        if (q != null && !q.isBlank()) {
            where.append(" AND (UPPER(r.nm_recurso) LIKE UPPER(?) OR UPPER(r.ds_recurso) LIKE UPPER(?))");
            parametros.add("%" + q.trim() + "%");
            parametros.add("%" + q.trim() + "%");
        }

        String sqlTotal = """
                SELECT COUNT(*)
                  FROM sh_recurso r
                       INNER JOIN sh_categoria c ON (c.id_categoria = r.id_categoria)
                """ + where;
        Long total = jdbc.queryForObject(sqlTotal, Long.class, parametros.toArray());

        List<Object> parametrosPagina = new ArrayList<>(parametros);
        parametrosPagina.add(pageable.getOffset());
        parametrosPagina.add(pageable.getPageSize());

        String sqlPagina = SELECT_BASE + where
                + " ORDER BY r.dt_cadastro DESC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY";

        List<Resource> pagina = jdbc.query(sqlPagina, mapper, parametrosPagina.toArray());
        return new PageImpl<>(pagina, pageable, total != null ? total : 0L);
    }

    public Optional<Resource> findById(String id) {
        return toId(id).flatMap(numeric -> jdbc
                .query(SELECT_BASE + " WHERE r.id_recurso = ?", mapper, numeric)
                .stream().findFirst());
    }

    public List<Resource> findByOfferantId(String offerantId) {
        return toId(offerantId)
                .map(numeric -> jdbc.query(
                        SELECT_BASE + " WHERE r.id_usuario = ? ORDER BY r.dt_cadastro DESC",
                        mapper, numeric))
                .orElseGet(List::of);
    }

    /** Insere quando o recurso ainda nao tem id, atualiza quando ja tem. */
    public Resource save(Resource resource) {
        Long idCategoria = jdbc.queryForObject(
                "SELECT id_categoria FROM sh_categoria WHERE nm_categoria = ?",
                Long.class, resource.getCategory().name());

        if (resource.getId() == null || resource.getId().isBlank()) {
            Long id = jdbc.queryForObject("SELECT sq_sh_recurso.NEXTVAL FROM dual", Long.class);

            jdbc.update("""
                    INSERT INTO sh_recurso (
                        id_recurso, id_usuario, id_categoria, nm_recurso, ds_recurso,
                        ds_condicao, ds_tipo, ds_disponibilidade, url_imagem,
                        vl_latitude, vl_longitude, dt_cadastro, dt_atualizacao
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, SYSDATE, SYSDATE)
                    """,
                    id, Long.parseLong(resource.getOfferantId()), idCategoria,
                    resource.getTitle(), resource.getDescription(),
                    resource.getCondition().name(), resource.getType().name(),
                    resource.getAvailability().name(), resource.getImageUrl(),
                    resource.getLatitude(), resource.getLongitude());

            resource.setId(String.valueOf(id));
        } else {
            jdbc.update("""
                    UPDATE sh_recurso
                       SET id_categoria       = ?,
                           nm_recurso         = ?,
                           ds_recurso         = ?,
                           ds_condicao        = ?,
                           ds_tipo            = ?,
                           ds_disponibilidade = ?,
                           url_imagem         = ?,
                           vl_latitude        = ?,
                           vl_longitude       = ?,
                           dt_atualizacao     = SYSDATE
                     WHERE id_recurso = ?
                    """,
                    idCategoria, resource.getTitle(), resource.getDescription(),
                    resource.getCondition().name(), resource.getType().name(),
                    resource.getAvailability().name(), resource.getImageUrl(),
                    resource.getLatitude(), resource.getLongitude(),
                    Long.parseLong(resource.getId()));
        }

        return findById(resource.getId()).orElse(resource);
    }

    public void delete(Resource resource) {
        toId(resource.getId()).ifPresent(numeric ->
                jdbc.update("DELETE FROM sh_recurso WHERE id_recurso = ?", numeric));
    }

    public long count() {
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM sh_recurso", Long.class);
        return total != null ? total : 0L;
    }

    public long countByCategory(Category category) {
        Long total = jdbc.queryForObject("""
                SELECT COUNT(*)
                  FROM sh_recurso r
                       INNER JOIN sh_categoria c ON (c.id_categoria = r.id_categoria)
                 WHERE c.nm_categoria = ?
                """, Long.class, category.name());
        return total != null ? total : 0L;
    }

    /**
     * Vitrine ordenada por proximidade. Usa a function FN_SH_DISTANCIA_KM,
     * entao a regra de distancia fica no banco e vale igual para o aplicativo
     * e para o painel.
     */
    public List<Resource> findNearby(double latitude, double longitude, int limite) {
        return jdbc.query(SELECT_BASE + """
                 WHERE r.ds_disponibilidade = 'DISPONIVEL'
                 ORDER BY fn_sh_distancia_km(?, ?, r.vl_latitude, r.vl_longitude) NULLS LAST
                FETCH FIRST ? ROWS ONLY
                """, mapper, latitude, longitude, limite);
    }
}
