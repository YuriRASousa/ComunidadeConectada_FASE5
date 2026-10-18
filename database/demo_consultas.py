# -*- coding: utf-8 -*-
"""
Demonstracao do banco Oracle do Smart HAS, para o video da Fase 6.

Faz o papel de uma janela de SQL: cada consulta aparece escrita na tela e so
roda quando voce aperta Enter, entao da para falar no seu ritmo.

As credenciais vem de backend/smarthas-api/config/oracle.properties (o mesmo
arquivo que o backend usa), nada fica escrito aqui.

Uso:   python demo_consultas.py          (modo gravacao, espera Enter)
       python demo_consultas.py --auto   (roda tudo de uma vez, para testar)
"""
import os
import re
import sys

import oracledb

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
os.system("")  # habilita cores ANSI no terminal do Windows

AUTO = "--auto" in sys.argv

AZUL, VERDE, AMARELO, CINZA, NEGRITO, FIM = "\033[96m", "\033[92m", "\033[93m", "\033[90m", "\033[1m", "\033[0m"

CONFIG = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                      "..", "backend", "smarthas-api", "config", "oracle.properties")


def ler_config():
    props = {}
    with open(CONFIG, encoding="utf-8") as f:
        for linha in f:
            linha = linha.strip()
            if linha and not linha.startswith("#") and "=" in linha:
                k, v = linha.split("=", 1)
                props[k.strip()] = v.strip()
    url = props["spring.datasource.url"]  # jdbc:oracle:thin:@host:porta:SID
    m = re.search(r"@([^:]+):(\d+):(\w+)", url)
    dsn = f"{m.group(1)}:{m.group(2)}/{m.group(3)}"
    return props["spring.datasource.username"], props["spring.datasource.password"], dsn


def tabela(colunas, linhas):
    if not linhas:
        print(f"  {CINZA}(nenhuma linha){FIM}")
        return
    texto = [[("" if v is None else str(v)) for v in l] for l in linhas]
    larg = [max(len(c), *(len(l[i]) for l in texto)) for i, c in enumerate(colunas)]
    larg = [min(w, 56) for w in larg]
    corte = lambda s, w: s if len(s) <= w else s[: w - 1] + "…"
    print("  " + AZUL + "  ".join(c.ljust(larg[i]) for i, c in enumerate(colunas)) + FIM)
    print("  " + CINZA + "  ".join("-" * w for w in larg) + FIM)
    for l in texto:
        print("  " + "  ".join(corte(v, larg[i]).ljust(larg[i]) for i, v in enumerate(l)))
    print(f"  {CINZA}{len(linhas)} linha(s){FIM}")


def espera(msg="Enter para executar"):
    if not AUTO:
        input(f"\n  {CINZA}{msg}...{FIM}")


def passo(numero, titulo, nota, sql):
    print("\n" + "=" * 86)
    print(f"{NEGRITO}{AMARELO}{numero}. {titulo}{FIM}")
    print(f"{CINZA}{nota}{FIM}\n")
    for linha in sql.strip("\n").splitlines():
        print(f"  {VERDE}{linha}{FIM}")
    espera()


def roda(cur, sql, binds=None):
    cur.execute(sql, binds or {})
    cols = [d[0].lower() for d in cur.description]
    return cols, cur.fetchall()


def main():
    usuario, senha, dsn = ler_config()
    conn = oracledb.connect(user=usuario, password=senha, dsn=dsn)
    cur = conn.cursor()
    cur.execute("SELECT SYS_CONTEXT('USERENV','DB_NAME'), banner FROM v$version WHERE ROWNUM = 1")
    db, banner = cur.fetchone()

    print(f"\n{NEGRITO}Smart HAS | Banco Oracle da FIAP{FIM}")
    print(f"{CINZA}{banner}{FIM}")
    print(f"{CINZA}conectado como {usuario} em {dsn.split('/')[0]} (instancia {db}){FIM}")
    espera("Enter para comecar")

    # 1 -------------------------------------------------------------------
    passo(1, "As nove tabelas do modelo",
          "Nada de documento solto: tudo relacional, com chave e restricao.",
          """SELECT table_name AS tabela FROM user_tables ORDER BY table_name;

SELECT object_type, COUNT(*) AS qtd
  FROM user_objects GROUP BY object_type ORDER BY 1;""")
    c, l = roda(cur, "SELECT table_name FROM user_tables ORDER BY table_name")
    tabela(["tabela"], l)
    print()
    c, l = roda(cur, "SELECT object_type, COUNT(*) FROM user_objects GROUP BY object_type ORDER BY 1")
    tabela(["object_type", "qtd"], l)

    # 2 -------------------------------------------------------------------
    passo(2, "Functions dentro de um SELECT",
          "Reputacao e indice de circularidade calculados pelo banco, por morador.",
          """SELECT nm_usuario,
       pkg_sh_calculos.reputacao(id_usuario)                        AS reputacao,
       pkg_sh_calculos.indice_circularidade(id_usuario,
           TO_NUMBER(TO_CHAR(SYSDATE,'YYYYMM')))          AS circularidade
  FROM sh_usuario WHERE st_usuario = 'A'
 ORDER BY 3 DESC, 1;""")
    c, l = roda(cur, """
        SELECT nm_usuario,
               pkg_sh_calculos.reputacao(id_usuario),
               pkg_sh_calculos.indice_circularidade(id_usuario, TO_NUMBER(TO_CHAR(SYSDATE,'YYYYMM')))
          FROM sh_usuario WHERE st_usuario = 'A' ORDER BY 3 DESC, 1""")
    tabela(["nm_usuario", "reputacao", "circularidade"], l)

    # 3 -------------------------------------------------------------------
    passo(3, "Function de dados formatados",
          "A ficha que o aplicativo mostra na tela do item vem pronta do banco.",
          """SELECT pkg_sh_calculos.ficha_recurso(id_recurso) AS ficha
  FROM sh_recurso WHERE ds_disponibilidade = 'DISPONIVEL'
 FETCH FIRST 3 ROWS ONLY;""")
    c, l = roda(cur, """SELECT pkg_sh_calculos.ficha_recurso(id_recurso) FROM sh_recurso
                        WHERE ds_disponibilidade = 'DISPONIVEL' FETCH FIRST 3 ROWS ONLY""")
    tabela(["ficha"], l)

    # 4 -------------------------------------------------------------------
    passo(4, "Os emprestimos mais recentes",
          "Quando o app pede um item, a procedure PKG_SH_EMPRESTIMO.REGISTRA_EMPRESTIMO grava a linha aqui.",
          """SELECT e.id_emprestimo, r.nm_recurso, u.nm_usuario AS solicitante,
       e.st_emprestimo, TO_CHAR(e.dt_prev_devolucao,'DD/MM/YYYY') AS devolver_ate
  FROM sh_emprestimo e
       JOIN sh_recurso r ON r.id_recurso = e.id_recurso
       JOIN sh_usuario u ON u.id_usuario = e.id_solicitante
 ORDER BY e.id_emprestimo DESC FETCH FIRST 5 ROWS ONLY;""")
    c, l = roda(cur, """
        SELECT e.id_emprestimo, r.nm_recurso, u.nm_usuario, e.st_emprestimo,
               TO_CHAR(e.dt_prev_devolucao,'DD/MM/YYYY')
          FROM sh_emprestimo e
               JOIN sh_recurso r ON r.id_recurso = e.id_recurso
               JOIN sh_usuario u ON u.id_usuario = e.id_solicitante
         ORDER BY e.id_emprestimo DESC FETCH FIRST 5 ROWS ONLY""")
    tabela(["id", "recurso", "solicitante", "status", "devolver_ate"], l)

    # 5 -------------------------------------------------------------------
    passo(5, "Alertas abertos pela rotina de atrasos",
          "PKG_SH_EMPRESTIMO.DETECTA_ATRASOS percorreu os vencidos com cursor e gravou aqui.",
          """SELECT ds_severidade, ds_mensagem
  FROM sh_alerta WHERE fl_resolvido = 'N'
 ORDER BY DECODE(ds_severidade,'ALTA',1,'MEDIA',2,3);""")
    c, l = roda(cur, """SELECT ds_severidade, ds_mensagem FROM sh_alerta WHERE fl_resolvido = 'N'
                        ORDER BY DECODE(ds_severidade,'ALTA',1,'MEDIA',2,3)""")
    tabela(["severidade", "mensagem"], l)

    # 6 -------------------------------------------------------------------
    passo(6, "A trilha das rotinas (transacao autonoma)",
          "O log sobrevive mesmo quando a operacao principal da ROLLBACK.",
          """SELECT TO_CHAR(dt_log,'HH24:MI:SS') AS hora, nm_origem, ds_mensagem
  FROM sh_log_sistema ORDER BY id_log DESC FETCH FIRST 6 ROWS ONLY;""")
    c, l = roda(cur, """SELECT TO_CHAR(dt_log,'HH24:MI:SS'), nm_origem, ds_mensagem
                        FROM sh_log_sistema ORDER BY id_log DESC FETCH FIRST 6 ROWS ONLY""")
    tabela(["hora", "origem", "mensagem"], l)

    print(f"\n{VERDE}{NEGRITO}Fim da demonstracao do banco.{FIM}\n")
    conn.close()


if __name__ == "__main__":
    main()
