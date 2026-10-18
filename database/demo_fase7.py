# -*- coding: utf-8 -*-
"""
Demonstracao da Fase 7 no banco Oracle, para o video.

Mostra, cada passo esperando Enter:
  1. os quatro pacotes e as tres triggers compilados;
  2. uma function de pacote dentro de um SELECT;
  3. as triggers trabalhando num emprestimo de verdade (pedido, devolucao,
     tentativa de voltar o status) e a trilha que ficou em SH_AUDITORIA;
  4. SQL dinamico: volumetria das tabelas e busca com filtros opcionais;
  5. a mesma busca recusando uma tentativa de SQL injection.

No fim apaga o que criou (emprestimo, avaliacao, auditoria, volumetria) e
devolve o banco ao estado de antes, entao pode ser rodado varias vezes.

Uso:   python demo_fase7.py          (modo gravacao, espera Enter)
       python demo_fase7.py --auto   (roda tudo de uma vez, para testar)
"""
import sys

import oracledb

from demo_consultas import (AMARELO, AZUL, CINZA, FIM, NEGRITO, VERDE, ler_config,
                            passo, roda, tabela, espera)

RECURSO, DONO, PEDINTE = 13, 8, 2   # kit de chaves da Leticia, pedido pela Marina


def erro_esperado(cur, sql, binds=None):
    try:
        cur.execute(sql, binds or {})
        cur.fetchall() if cur.description else None
        print(f"  {AMARELO}(nao recusou)\033[0m")
    except oracledb.DatabaseError as e:
        msg = str(e).splitlines()[0]
        print(f"  {VERDE}Recusado pelo banco:{FIM} {msg}")


def limpa(conn, cur, id_emp):
    if id_emp:
        cur.execute("DELETE FROM sh_avaliacao WHERE id_emprestimo = :i", i=id_emp)
        cur.execute("DELETE FROM sh_alerta WHERE id_referencia = :i", i=id_emp)
        cur.execute("DELETE FROM sh_emprestimo WHERE id_emprestimo = :i", i=id_emp)
        cur.execute("DELETE FROM sh_auditoria WHERE nm_tabela = 'SH_EMPRESTIMO' AND id_registro = :i", i=id_emp)
        cur.execute("UPDATE sh_usuario SET qt_transacoes = GREATEST(qt_transacoes - 1, 0) "
                    "WHERE id_usuario IN (:a, :b)", a=DONO, b=PEDINTE)
        cur.execute("UPDATE sh_recurso SET ds_disponibilidade = 'DISPONIVEL' WHERE id_recurso = :r", r=RECURSO)
        cur.execute("BEGIN pkg_sh_emprestimo.atualiza_reputacao(:d); END;", d=DONO)
    cur.execute("DELETE FROM sh_volumetria")
    conn.commit()


def main():
    auto = "--auto" in sys.argv
    usuario, senha, dsn = ler_config()
    conn = oracledb.connect(user=usuario, password=senha, dsn=dsn)
    cur = conn.cursor()
    id_emp = None

    print(f"\n{NEGRITO}Smart HAS | Fase 7 no Oracle{FIM}")
    print(f"{CINZA}conectado como {usuario}{FIM}")
    espera("Enter para comecar")
    try:
        # 1 ---------------------------------------------------------------
        passo(1, "Pacotes e triggers no schema",
              "As procedures e functions soltas da Fase 6 agora vivem em pacotes.",
              """SELECT object_name, object_type, status
  FROM user_objects
 WHERE object_type IN ('PACKAGE','PACKAGE BODY','TRIGGER')
 ORDER BY object_type, object_name;""")
        c, l = roda(cur, """SELECT object_name, object_type, status FROM user_objects
                            WHERE object_type IN ('PACKAGE','PACKAGE BODY','TRIGGER')
                            ORDER BY object_type, object_name""")
        tabela(["objeto", "tipo", "status"], l)

        # 2 ---------------------------------------------------------------
        passo(2, "Function de pacote dentro de um SELECT",
              "Chamada pelo nome do pacote: PKG_SH_CALCULOS.REPUTACAO.",
              """SELECT nm_usuario,
       pkg_sh_calculos.reputacao(id_usuario) AS reputacao
  FROM sh_usuario WHERE st_usuario = 'A' ORDER BY 2 DESC;""")
        c, l = roda(cur, """SELECT nm_usuario, pkg_sh_calculos.reputacao(id_usuario)
                            FROM sh_usuario WHERE st_usuario = 'A' ORDER BY 2 DESC""")
        tabela(["morador", "reputacao"], l)

        # 3 ---------------------------------------------------------------
        passo(3, "Triggers: pedido e devolucao viram trilha de auditoria",
              "O emprestimo passa pela procedure do pacote; as triggers registram sozinhas.",
              f"""-- Marina pede o kit de chaves (recurso {RECURSO}) e devolve com nota 5
PKG_SH_EMPRESTIMO.REGISTRA_EMPRESTIMO({RECURSO}, {PEDINTE}, 5, ...);
PKG_SH_EMPRESTIMO.REGISTRA_DEVOLUCAO(id, 5, 'Tudo certo', ...);

SELECT tp_operacao, ds_antes, ds_depois FROM sh_auditoria ...;""")
        out_id = cur.var(int)
        out_msg = cur.var(str)
        cur.execute("BEGIN pkg_sh_emprestimo.registra_emprestimo(:r, :s, 5, :id, :m); END;",
                    r=RECURSO, s=PEDINTE, id=out_id, m=out_msg)
        id_emp = int(out_id.getvalue())
        print(f"  {VERDE}{out_msg.getvalue()}{FIM}")
        out_ret = cur.var(str)
        cur.execute("BEGIN pkg_sh_emprestimo.registra_devolucao(:i, 5, 'Tudo certo', :m); END;",
                    i=id_emp, m=out_ret)
        print(f"  {VERDE}{out_ret.getvalue()}{FIM}\n")
        c, l = roda(cur, """SELECT TO_CHAR(dt_evento,'HH24:MI:SS'), tp_operacao,
                                   NVL(SUBSTR(ds_antes,1,38),'-'), SUBSTR(ds_depois,1,38)
                              FROM sh_auditoria
                             WHERE nm_tabela = 'SH_EMPRESTIMO' AND id_registro = :i
                             ORDER BY id_auditoria""", {"i": id_emp})
        tabela(["hora", "operacao", "antes", "depois"], l)

        # 4 ---------------------------------------------------------------
        passo(4, "Trigger de regra: estado final nao volta atras",
              "O emprestimo ja foi DEVOLVIDO. Tentar reabrir esbarra na TRG_SH_EMPRESTIMO_BU.",
              f"UPDATE sh_emprestimo SET st_emprestimo = 'ATIVO' WHERE id_emprestimo = {id_emp};")
        erro_esperado(cur, "UPDATE sh_emprestimo SET st_emprestimo = 'ATIVO' WHERE id_emprestimo = :i",
                      {"i": id_emp})
        conn.rollback()

        # 5 ---------------------------------------------------------------
        passo(5, "SQL dinamico 1: volumetria de todas as tabelas",
              "O nome da tabela so existe em tempo de execucao: EXECUTE IMMEDIATE.",
              """BEGIN pkg_sh_admin.prc_volumetria(:n); END;

SELECT nm_tabela, qt_linhas FROM sh_volumetria ORDER BY qt_linhas DESC;""")
        n = cur.var(int)
        cur.execute("BEGIN pkg_sh_admin.prc_volumetria(:n); END;", n=n)
        print(f"  {VERDE}{int(n.getvalue())} tabelas medidas{FIM}\n")
        c, l = roda(cur, "SELECT nm_tabela, qt_linhas FROM sh_volumetria ORDER BY qt_linhas DESC, nm_tabela")
        tabela(["tabela", "linhas"], l)

        # 6 ---------------------------------------------------------------
        passo(6, "SQL dinamico 2: busca com filtros opcionais",
              "So os filtros informados entram no WHERE; valores vao por bind variable.",
              """pkg_sh_admin.busca_recursos(
    p_ds_tipo => 'EMPRESTIMO', p_lat => -23.5561, p_lon => -46.6603,
    p_raio_km => 3, p_ordem => 'DISTANCIA')""")
        ref = cur.callfunc("pkg_sh_admin.busca_recursos", oracledb.DB_TYPE_CURSOR,
                           keyword_parameters={"p_ds_tipo": "EMPRESTIMO", "p_lat": -23.5561,
                                               "p_lon": -46.6603, "p_raio_km": 3,
                                               "p_ordem": "DISTANCIA"})
        linhas = ref.fetchall()
        tabela(["id", "recurso", "categoria", "tipo", "situacao", "cadastro", "km"],
               [(r[0], r[1], r[2], r[3], r[4], r[5].strftime("%d/%m/%Y"), r[6]) for r in linhas[:8]])

        # 7 ---------------------------------------------------------------
        passo(7, "O mesmo SQL dinamico recusando injecao",
              "Nome de tabela fora do dicionario e ordenacao fora da lista fechada sao barrados.",
              """pkg_sh_admin.contagem_linhas('SH_USUARIO; DROP TABLE sh_usuario');
pkg_sh_admin.busca_recursos(p_ordem => 'nm_recurso; DROP TABLE sh_recurso');""")
        erro_esperado(cur, "SELECT pkg_sh_admin.contagem_linhas('SH_USUARIO; DROP TABLE sh_usuario') FROM dual")
        erro_esperado(cur, "DECLARE c SYS_REFCURSOR; BEGIN "
                           "c := pkg_sh_admin.busca_recursos(p_ordem => 'nm_recurso; DROP TABLE sh_recurso'); END;")
        cur.execute("SELECT COUNT(*) FROM sh_usuario")
        print(f"  {CINZA}A tabela continua la: {cur.fetchone()[0]} moradores.{FIM}")
    finally:
        limpa(conn, cur, id_emp)
        print(f"\n{VERDE}{NEGRITO}Fim da demonstracao. O banco voltou ao estado de antes.{FIM}\n")
        conn.close()


if __name__ == "__main__":
    main()
