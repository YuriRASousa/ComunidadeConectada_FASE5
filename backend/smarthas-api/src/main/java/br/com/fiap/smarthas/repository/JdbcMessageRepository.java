package br.com.fiap.smarthas.repository;

import br.com.fiap.smarthas.entity.Message;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Acesso a tabela SH_MENSAGEM.
 *
 * <p>No Firestore a conversa era filtrada em memoria depois de baixar os
 * documentos do usuario. Aqui o filtro vai para o WHERE, entao o volume que
 * trafega entre o banco e a aplicacao e so o da conversa pedida.</p>
 */
@Repository
public class JdbcMessageRepository {

    private final JdbcTemplate jdbc;

    private static final String COLUNAS = """
            id_mensagem, id_remetente, id_destinatario, id_recurso,
            ds_conteudo, dt_envio, fl_lida
            """;

    public JdbcMessageRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<Message> mapper = (rs, rowNum) -> Message.builder()
            .id(String.valueOf(rs.getLong("id_mensagem")))
            .senderId(String.valueOf(rs.getLong("id_remetente")))
            .receiverId(String.valueOf(rs.getLong("id_destinatario")))
            .resourceId(rs.getObject("id_recurso") != null
                    ? String.valueOf(rs.getLong("id_recurso")) : null)
            .content(rs.getString("ds_conteudo"))
            .timestamp(rs.getTimestamp("dt_envio"))
            .read("S".equals(rs.getString("fl_lida")))
            .build();

    private static Optional<Long> toId(String id) {
        try {
            return Optional.of(Long.parseLong(id));
        } catch (NumberFormatException | NullPointerException e) {
            return Optional.empty();
        }
    }

    public Message save(Message message) {
        if (message.getId() == null || message.getId().isBlank()) {
            Long id = jdbc.queryForObject("SELECT sq_sh_mensagem.NEXTVAL FROM dual", Long.class);

            jdbc.update("""
                    INSERT INTO sh_mensagem (
                        id_mensagem, id_remetente, id_destinatario, id_recurso,
                        ds_conteudo, dt_envio, fl_lida
                    ) VALUES (?, ?, ?, ?, ?, SYSDATE, ?)
                    """,
                    id, Long.parseLong(message.getSenderId()), Long.parseLong(message.getReceiverId()),
                    message.getResourceId() != null ? Long.parseLong(message.getResourceId()) : null,
                    message.getContent(),
                    Boolean.TRUE.equals(message.getRead()) ? "S" : "N");

            message.setId(String.valueOf(id));
        } else {
            jdbc.update("UPDATE sh_mensagem SET fl_lida = ? WHERE id_mensagem = ?",
                    Boolean.TRUE.equals(message.getRead()) ? "S" : "N",
                    Long.parseLong(message.getId()));
        }

        return findById(message.getId()).orElse(message);
    }

    public Optional<Message> findById(String id) {
        return toId(id).flatMap(numeric -> jdbc
                .query("SELECT " + COLUNAS + " FROM sh_mensagem WHERE id_mensagem = ?", mapper, numeric)
                .stream().findFirst());
    }

    public List<Message> findAllForUser(String userId) {
        return toId(userId)
                .map(numeric -> jdbc.query("SELECT " + COLUNAS + """
                         FROM sh_mensagem
                         WHERE id_remetente = ? OR id_destinatario = ?
                         ORDER BY dt_envio DESC
                        """, mapper, numeric, numeric))
                .orElseGet(List::of);
    }

    public List<Message> findConversation(String userId1, String userId2, String resourceId) {
        Optional<Long> id1 = toId(userId1);
        Optional<Long> id2 = toId(userId2);
        if (id1.isEmpty() || id2.isEmpty()) {
            return List.of();
        }

        if (resourceId == null || resourceId.isBlank()) {
            return jdbc.query("SELECT " + COLUNAS + """
                     FROM sh_mensagem
                     WHERE (id_remetente = ? AND id_destinatario = ?)
                        OR (id_remetente = ? AND id_destinatario = ?)
                     ORDER BY dt_envio
                    """, mapper, id1.get(), id2.get(), id2.get(), id1.get());
        }

        return toId(resourceId)
                .map(recurso -> jdbc.query("SELECT " + COLUNAS + """
                         FROM sh_mensagem
                         WHERE id_recurso = ?
                           AND ((id_remetente = ? AND id_destinatario = ?)
                             OR (id_remetente = ? AND id_destinatario = ?))
                         ORDER BY dt_envio
                        """, mapper, recurso, id1.get(), id2.get(), id2.get(), id1.get()))
                .orElseGet(List::of);
    }

    public List<Message> findByResourceId(String resourceId) {
        return toId(resourceId)
                .map(numeric -> jdbc.query("SELECT " + COLUNAS + """
                         FROM sh_mensagem WHERE id_recurso = ? ORDER BY dt_envio
                        """, mapper, numeric))
                .orElseGet(List::of);
    }

    /**
     * Usado quando um recurso e excluido: as mensagens ficam, mas perdem o
     * vinculo com o item, para o historico da conversa nao sumir junto.
     */
    public void saveAll(List<Message> messages) {
        for (Message message : messages) {
            toId(message.getId()).ifPresent(numeric ->
                    jdbc.update("UPDATE sh_mensagem SET id_recurso = NULL WHERE id_mensagem = ?", numeric));
        }
    }

    public long count() {
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM sh_mensagem", Long.class);
        return total != null ? total : 0L;
    }
}
