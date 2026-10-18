# -*- coding: utf-8 -*-
"""Le os relatorios XML do Surefire e imprime um resumo em Markdown,
que o pipeline anexa a aba de resumo do run (GITHUB_STEP_SUMMARY)."""
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

pasta = Path(sys.argv[1])
arquivos = sorted(pasta.glob("TEST-*.xml"))
linhas, total, falhas, erros, pulados = [], 0, 0, 0, 0

for arq in arquivos:
    raiz = ET.parse(arq).getroot()
    for caso in raiz.iter("testcase"):
        nome = caso.get("name")
        tempo = float(caso.get("time", "0"))
        if caso.find("failure") is not None:
            estado = "FALHOU"; falhas += 1
        elif caso.find("error") is not None:
            estado = "ERRO"; erros += 1
        elif caso.find("skipped") is not None:
            estado = "pulado"; pulados += 1
        else:
            estado = "ok"
        total += 1
        linhas.append((estado, nome, tempo))

print("### Testes do backend (Surefire)")
if not arquivos:
    print("\nNenhum relatorio encontrado. O build parou antes dos testes.")
    sys.exit(0)
print(f"\n**{total} testes**: {total - falhas - erros - pulados} aprovados, "
      f"{falhas} com falha, {erros} com erro, {pulados} pulados.\n")
print("| Resultado | Teste | Tempo |")
print("|---|---|---|")
for estado, nome, tempo in linhas:
    marca = {"ok": "aprovado", "pulado": "pulado"}.get(estado, "**" + estado + "**")
    print(f"| {marca} | {nome} | {tempo:.2f}s |")
