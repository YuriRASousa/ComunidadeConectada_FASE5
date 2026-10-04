package br.com.fiap.smarthas.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

/**
 * Mensagem trocada entre dois moradores, linha da tabela SH_MENSAGEM.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    private String id;

    private String senderId;

    private String receiverId;

    private String resourceId;

    private String content;

    @Builder.Default
    private Date timestamp = new Date();

    @Builder.Default
    private Boolean read = false;
}
