package br.com.fiap.smarthas.exception;

import org.springframework.dao.DataAccessException;

import java.sql.SQLException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Traducao dos erros de aplicacao do Oracle para excecoes do backend.
 *
 * <p>Uma procedure que recusa a operacao devolve algo como:</p>
 * <pre>
 * ORA-20205: O recurso 1 esta RESERVADO no momento.
 * ORA-06512: at "RM556163.PKG_SH_EMPRESTIMO", line 120
 * </pre>
 * <p>Sem tratamento, essa pilha inteira chegaria na tela do morador. Aqui
 * ficamos apenas com a primeira linha, que e a mensagem escrita para o
 * usuario final, e o codigo vira o status HTTP correspondente.</p>
 */
public final class OracleErrors {

    private static final Pattern ORA_APPLICATION_ERROR =
            Pattern.compile("ORA-(2[0-9]{4}):\\s*([^\\n\\r]+)");

    private OracleErrors() {
    }

    /**
     * Converte a excecao do Spring em {@link BusinessRuleException} quando ela
     * carrega um erro de aplicacao do Oracle. Caso contrario devolve a propria
     * excecao recebida, para nao mascarar falha de infraestrutura.
     */
    public static RuntimeException translate(DataAccessException ex) {
        Throwable causa = ex;
        while (causa != null) {
            if (causa instanceof SQLException sqlException) {
                Matcher matcher = ORA_APPLICATION_ERROR.matcher(String.valueOf(sqlException.getMessage()));
                if (matcher.find()) {
                    int codigo = Integer.parseInt(matcher.group(1));
                    return new BusinessRuleException(codigo, matcher.group(2).trim());
                }
            }
            causa = causa.getCause();
        }
        return ex;
    }
}
