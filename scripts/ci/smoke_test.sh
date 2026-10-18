#!/usr/bin/env bash
# Teste de fumaca: a API empacotada, ligada a um Oracle recem-instalado,
# responde ponta a ponta (REST -> Spring -> JDBC -> PL/SQL).
# Uso: smoke_test.sh http://localhost:8080
set -uo pipefail
BASE="${1:-http://localhost:8080}"
FALHAS=0
PY=python3
for c in python3 python; do "$c" -c "" 2>/dev/null && PY=$c && break; done

# Le um campo de um JSON (ou o tamanho da lista, com "length") so com Python.
jget() {
  "$PY" -c "
import json, sys
d = json.load(sys.stdin)
c = sys.argv[1]
print(len(d) if c == 'length' else (d.get(c) if isinstance(d, dict) and d.get(c) is not None else ''))
" "$1"
}

ok()    { echo "OK    $1"; }
falha() { echo "FALHA $1"; FALHAS=$((FALHAS + 1)); }

echo "Aguardando a API em $BASE ..."
for i in $(seq 1 60); do
  if [ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/v3/api-docs")" = "200" ]; then
    ok "API no ar apos ${i} tentativa(s)"
    break
  fi
  [ "$i" = "60" ] && { falha "API nao subiu em 2 minutos"; tail -n 40 logs/api.log 2>/dev/null; exit 1; }
  sleep 2
done

# 1. Login com o administrador da carga inicial (BCrypt validado contra o Oracle)
LOGIN=$(curl -s -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"admin@smarthas.com","password":"admin123"}')
TOKEN=$(echo "$LOGIN" | jget token)
[ -n "$TOKEN" ] && ok "login do administrador devolveu token JWT" || { falha "login falhou: $LOGIN"; exit 1; }
AUTH="Authorization: Bearer $TOKEN"

# 2. Rota protegida sem token e recusada
CODIGO=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/admin/stats")
[ "$CODIGO" = "401" ] || [ "$CODIGO" = "403" ] && ok "rota admin sem token recusada ($CODIGO)" || falha "rota admin sem token respondeu $CODIGO"

# 3. Estatisticas lidas do Oracle
USUARIOS=$(curl -s -H "$AUTH" "$BASE/api/admin/stats" | jget totalUsers)
[ -n "$USUARIOS" ] && [ "$USUARIOS" -ge 1 ] 2>/dev/null && ok "estatisticas do painel ($USUARIOS usuarios)" || falha "estatisticas vazias"

# 4. Procedure de detectar atrasos dentro do pacote PKG_SH_EMPRESTIMO
ALERTAS=$(curl -s -X POST -H "$AUTH" "$BASE/api/admin/rotinas/detectar-atrasos" | jget affectedRows)
[ -n "$ALERTAS" ] && [ "$ALERTAS" -ge 0 ] 2>/dev/null && ok "PKG_SH_EMPRESTIMO.DETECTA_ATRASOS executou ($ALERTAS alerta(s) novos)" || falha "detecta_atrasos nao respondeu"

# 5. SQL dinamico: volumetria das tabelas
TABELAS=$(curl -s -X POST -H "$AUTH" "$BASE/api/admin/rotinas/volumetria" | jget affectedRows)
[ -n "$TABELAS" ] && [ "$TABELAS" -ge 9 ] 2>/dev/null && ok "PKG_SH_ADMIN.PRC_VOLUMETRIA leu $TABELAS tabelas" || falha "volumetria devolveu '$TABELAS'"

# 6. SQL dinamico: busca com filtros opcionais
ACHADOS=$(curl -s -H "$AUTH" "$BASE/api/admin/recursos/busca?tipo=EMPRESTIMO&ordem=NOME" | jget length)
[ "$ACHADOS" -ge 1 ] 2>/dev/null && ok "busca dinamica devolveu $ACHADOS recurso(s)" || falha "busca dinamica vazia"

# 7. SQL dinamico: tentativa de injecao na ordenacao e recusada
CODIGO=$(curl -s -o /dev/null -w '%{http_code}' -H "$AUTH" "$BASE/api/admin/recursos/busca?ordem=nm_recurso%3B%20DROP%20TABLE%20sh_recurso")
[ "$CODIGO" = "400" ] && ok "ordenacao maliciosa recusada (400)" || falha "ordenacao maliciosa respondeu $CODIGO"

echo "-----"
[ "$FALHAS" = "0" ] && echo "Todas as verificacoes passaram." || { echo "$FALHAS verificacao(oes) falharam."; exit 1; }
