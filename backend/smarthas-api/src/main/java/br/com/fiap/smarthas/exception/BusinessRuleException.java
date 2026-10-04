package br.com.fiap.smarthas.exception;

/**
 * Regra de negocio recusada pelo banco.
 *
 * <p>As procedures PL/SQL sinalizam recusa com RAISE_APPLICATION_ERROR na
 * faixa -20000 a -20999. O {@link OracleErrors} traduz esse erro para esta
 * excecao, ja com a mensagem limpa que a interface exibe.</p>
 */
public class BusinessRuleException extends RuntimeException {

    private final int oracleCode;

    public BusinessRuleException(int oracleCode, String message) {
        super(message);
        this.oracleCode = oracleCode;
    }

    public int getOracleCode() {
        return oracleCode;
    }
}
