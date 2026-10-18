# -*- coding: utf-8 -*-
"""
Executa os scripts do banco Oracle do Smart HAS, na ordem certa, e confere
se tudo compilou.

E o "deploy do banco" do pipeline (GitHub Actions) e tambem funciona na
maquina do desenvolvedor, no lugar do SQL Developer.

Conexao (primeira fonte que existir):
  1. variaveis de ambiente ORACLE_USER, ORACLE_PASSWORD e ORACLE_DSN
     (formato host:porta/servico), usadas pelo pipeline;
  2. backend/smarthas-api/config/oracle.properties, o mesmo arquivo do backend.

Uso:
  python executar_scripts.py                 instala 01 a 07 (banco vazio)
  python executar_scripts.py --recriar       roda 99_drop.sql antes
  python executar_scripts.py --migrar        so migra da Fase 6 para a Fase 7
  python executar_scripts.py --remover-avulsas  elimina as rotinas soltas da Fase 6
  python executar_scripts.py --verificar     nao executa nada, so confere

Codigo de saida diferente de zero quando algum comando falha ou quando
sobra objeto invalido, o que faz o pipeline quebrar na hora.
"""
import argparse
import os
import re
import sys
import time
from pathlib import Path

import oracledb

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PASTA = Path(__file__).resolve().parent
CONFIG = PASTA.parent / "backend" / "smarthas-api" / "config" / "oracle.properties"

INSTALACAO = [
    "01_ddl.sql",
    "02_seed.sql",
    "03_pkg_log.sql",
    "04_pkg_calculos.sql",
    "05_pkg_emprestimo.sql",
    "06_pkg_admin.sql",
    "07_triggers.sql",
]

# Comandos de SQL*Plus que o driver nao entende; sao ignorados.
SQLPLUS = re.compile(
    r"^\s*(SET\s|SHOW\s+ERRORS|PROMPT|SPOOL|WHENEVER|COLUMN\s|EXIT|DEFINE|CLEAR\s)", re.I)
INICIO_BLOCO = re.compile(
    r"^\s*(CREATE\s+(OR\s+REPLACE\s+)?(EDITIONABLE\s+)?(PACKAGE|PROCEDURE|FUNCTION|TRIGGER|TYPE)\b|DECLARE\b|BEGIN\b)",
    re.I)


def ler_conexao():
    if os.getenv("ORACLE_USER") and os.getenv("ORACLE_PASSWORD") and os.getenv("ORACLE_DSN"):
        return os.environ["ORACLE_USER"], os.environ["ORACLE_PASSWORD"], os.environ["ORACLE_DSN"]
    props = {}
    for linha in CONFIG.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if linha and not linha.startswith("#") and "=" in linha:
            k, v = linha.split("=", 1)
            props[k.strip()] = v.strip()
    m = re.search(r"@(?://)?([^:/]+):(\d+)[:/](\w+)", props["spring.datasource.url"])
    return props["spring.datasource.username"], props["spring.datasource.password"], \
        f"{m.group(1)}:{m.group(2)}/{m.group(3)}"


def dividir(texto):
    """Quebra o arquivo em comandos. Bloco PL/SQL termina em '/' sozinho
    na linha; comando SQL comum termina em ';' no fim da linha."""
    comandos, atual, em_bloco = [], [], False
    for linha in texto.splitlines():
        corpo = linha.strip()
        if not atual:
            if not corpo or corpo.startswith("--") or SQLPLUS.match(linha):
                continue
            em_bloco = bool(INICIO_BLOCO.match(linha))
        if em_bloco:
            if corpo == "/":
                comandos.append("\n".join(atual).strip())
                atual, em_bloco = [], False
            else:
                atual.append(linha)
        else:
            if corpo.startswith("--"):
                continue
            atual.append(linha)
            if corpo.endswith(";"):
                comandos.append("\n".join(atual).strip().rstrip(";"))
                atual = []
    if atual:
        comandos.append("\n".join(atual).strip().rstrip(";"))
    return [c for c in comandos if c]


def executar_arquivo(cur, arquivo):
    inicio = time.time()
    comandos = dividir((PASTA / arquivo).read_text(encoding="utf-8"))
    for cmd in comandos:
        try:
            cur.execute(cmd)
            if cur.description:
                cur.fetchall()
        except oracledb.DatabaseError as e:
            primeira = cmd.strip().splitlines()[0][:90]
            print(f"  FALHOU: {primeira}\n  {e}")
            raise
    print(f"  ok  {arquivo:<24} {len(comandos):>3} comando(s)  {time.time() - inicio:5.1f}s")


def verificar(cur):
    """Falha se algum objeto do schema estiver invalido ou com erro de compilacao."""
    cur.execute("""SELECT object_type, object_name FROM user_objects
                    WHERE status <> 'VALID' ORDER BY 1, 2""")
    invalidos = cur.fetchall()
    cur.execute("""SELECT name, type, line, text FROM user_errors ORDER BY name, sequence""")
    erros = cur.fetchall()
    cur.execute("""SELECT object_type, COUNT(*) FROM user_objects
                    WHERE object_type IN ('TABLE','SEQUENCE','PACKAGE','PACKAGE BODY','TRIGGER','PROCEDURE','FUNCTION')
                    GROUP BY object_type ORDER BY 1""")
    print("\nObjetos no schema:")
    for tipo, qtd in cur.fetchall():
        print(f"  {tipo:<14} {qtd:>3}")
    if invalidos or erros:
        print("\nProblemas de compilacao:")
        for tipo, nome in invalidos:
            print(f"  INVALIDO  {tipo} {nome}")
        for nome, tipo, linha, texto in erros:
            print(f"  ERRO      {nome} ({tipo}) linha {linha}: {texto.strip()}")
        return False
    print("\nTodos os objetos estao VALID.")
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--recriar", action="store_true", help="roda 99_drop.sql antes")
    ap.add_argument("--migrar", action="store_true", help="aplica a migracao Fase 6 -> Fase 7")
    ap.add_argument("--remover-avulsas", action="store_true",
                    help="elimina as procedures/functions soltas da Fase 6")
    ap.add_argument("--verificar", action="store_true", help="so confere os objetos")
    args = ap.parse_args()

    usuario, senha, dsn = ler_conexao()
    print(f"Conectando como {usuario} em {dsn.split('/')[0]} ...")
    conn = oracledb.connect(user=usuario, password=senha, dsn=dsn)
    cur = conn.cursor()
    cur.execute("SELECT banner FROM v$version WHERE ROWNUM = 1")
    print(cur.fetchone()[0])

    try:
        if args.verificar:
            pass
        elif args.migrar:
            print("\nMigracao Fase 6 -> Fase 7:")
            executar_arquivo(cur, "migracao_f6_para_f7.sql")
            for arq in INSTALACAO[2:]:
                executar_arquivo(cur, arq)
        elif args.remover_avulsas:
            executar_arquivo(cur, "remover_rotinas_avulsas.sql")
        else:
            print("\nInstalacao:")
            if args.recriar:
                executar_arquivo(cur, "99_drop.sql")
            for arq in INSTALACAO:
                executar_arquivo(cur, arq)
        conn.commit()
    except oracledb.DatabaseError:
        conn.rollback()
        return 1

    return 0 if verificar(cur) else 1


if __name__ == "__main__":
    sys.exit(main())
