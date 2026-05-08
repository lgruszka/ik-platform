#!/usr/bin/env bash
# Pre-flight check przed deployem na Vercel.
# Sprawdza po kolei:
#   1) typecheck (tsc --noEmit)
#   2) production build (next build)
#   3) statyczne assety krytyczne dla działania (obrazy DH, pyodide-worker)
#   4) smoke test przez next start + curl każdego routu (status 200, brak słów-kluczy
#      typu „Error" w odpowiedzi)
#
# Wyjście: 0 — wszystko OK, ≠0 — coś do poprawienia (z opisem).
#
# Użycie:
#   bash scripts/preflight.sh

set -uo pipefail
cd "$(dirname "$0")/.."

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; CYAN=$'\033[0;36m'; NC=$'\033[0m'
PASS="${GREEN}✓${NC}"
FAIL="${RED}✗${NC}"
WARN="${YELLOW}!${NC}"

failures=0
warnings=0

section() { printf "\n${CYAN}━━━ %s ━━━${NC}\n" "$1"; }
ok()      { printf "  %s %s\n" "$PASS" "$1"; }
fail()    { printf "  %s %s\n" "$FAIL" "$1"; failures=$((failures + 1)); }
warn()    { printf "  %s %s\n" "$WARN" "$1"; warnings=$((warnings + 1)); }

# ─── 1. Typecheck ──────────────────────────────────────────────────────────
section "1/4  TypeScript (strict)"
if npx tsc --noEmit 2>/tmp/preflight-tsc.log; then
  ok "tsc --noEmit przeszło bez błędów"
else
  fail "tsc znalazł błędy — patrz /tmp/preflight-tsc.log"
  tail -20 /tmp/preflight-tsc.log | sed 's/^/    /'
fi

# ─── 2. Production build ───────────────────────────────────────────────────
section "2/4  Production build (next build)"
if npm run build > /tmp/preflight-build.log 2>&1; then
  ok "next build skończył się sukcesem"
  # Wyświetl tablicę routów dla wglądu
  grep -E "^[├└]" /tmp/preflight-build.log | sed 's/^/    /' || true
else
  fail "next build padł — patrz /tmp/preflight-build.log"
  tail -30 /tmp/preflight-build.log | sed 's/^/    /'
  # Bez działającego build dalsze testy nie mają sensu
  exit 1
fi

# ─── 3. Statyczne assety ───────────────────────────────────────────────────
section "3/4  Krytyczne pliki statyczne"

required_files=(
  "public/images/dh/dh-transformation.svg"
  "public/images/dh/dh-step1.svg"
  "public/images/dh/dh-step2.svg"
  "public/images/dh/dh-step3.svg"
  "public/images/dh/dh-step4.svg"
  "public/images/dh/dh-classic-convention.png"
  "public/images/dh/dh-modified-convention.png"
  "public/pyodide-worker.js"
)
for f in "${required_files[@]}"; do
  if [[ -f "$f" ]]; then
    size=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f" 2>/dev/null || echo "?")
    ok "$(printf '%-55s %8s B' "$f" "$size")"
  else
    fail "BRAK: $f"
  fi
done

# Sprawdź czy są jakiekolwiek obrazy w innych podkatalogach (na wypadek gdyby
# sekcje moduów ich oczekiwały)
if [[ -d public/images ]]; then
  count=$(find public/images -type f 2>/dev/null | wc -l | tr -d ' ')
  ok "$(printf '%-55s %8s' 'public/images/* (łącznie plików)' "$count")"
fi

# ─── 4. Smoke test routów ──────────────────────────────────────────────────
section "4/4  Smoke test (next start + curl każdego modułu)"

# Wybierz wolny port (3000 może być zajęty)
PORT=3737
# Zabij ewentualnego zombie z poprzedniego runu
lsof -ti:$PORT 2>/dev/null | xargs kill -9 2>/dev/null || true

# Start production server
NODE_ENV=production npx next start -p $PORT > /tmp/preflight-server.log 2>&1 &
SERVER_PID=$!
trap "kill -9 $SERVER_PID 2>/dev/null || true; lsof -ti:$PORT 2>/dev/null | xargs kill -9 2>/dev/null || true" EXIT

# Czekaj aż serwer wstanie (max 30s)
for i in $(seq 1 30); do
  if curl -sf http://localhost:$PORT/ -o /dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -sf http://localhost:$PORT/ -o /dev/null 2>&1; then
  fail "next start nie wstał w 30s — patrz /tmp/preflight-server.log"
  tail -20 /tmp/preflight-server.log | sed 's/^/    /'
  exit 1
fi
ok "next start gotowy na :$PORT"

routes=(
  "/"
  "/modules/0-intro"
  "/modules/1-analytical-walkthrough"
  "/modules/2-analytical-playground"
  "/modules/3-jacobian"
  "/modules/4-optimization"
  "/modules/5-neural"
  "/modules/6-benchmark"
  "/modules/7-singularities"
  "/modules/8-orientations"
  "/modules/9-dynamics"
  "/modules/10-energy"
)

for r in "${routes[@]}"; do
  body_file="/tmp/preflight-route-$(echo "$r" | tr '/' '_').html"
  http_code=$(curl -s -o "$body_file" -w "%{http_code}" "http://localhost:$PORT$r")
  size=$(stat -f%z "$body_file" 2>/dev/null || stat -c%s "$body_file" 2>/dev/null || echo "?")
  if [[ "$http_code" != "200" ]]; then
    fail "$(printf '%-45s HTTP %s, %sB' "$r" "$http_code" "$size")"
    continue
  fi
  # Heurystyka — strona ze stack trace ma rozmiar zwykle <5kB
  if [[ "$size" -lt 3000 ]]; then
    warn "$(printf '%-45s HTTP 200, ale tylko %sB (podejrzanie małe)' "$r" "$size")"
    continue
  fi
  # Szukaj wskaźników nieobsłużonego runtime errora w SSR
  if grep -qE "Application error|Internal Server Error|Cannot read prop|undefined is not" "$body_file"; then
    fail "$(printf '%-45s HTTP 200, ale w body podejrzany komunikat błędu' "$r")"
    grep -oE "Application error[^<]*|Internal Server Error[^<]*|Cannot read prop[^<]*|undefined is not[^<]*" "$body_file" | head -2 | sed 's/^/      → /'
    continue
  fi
  ok "$(printf '%-45s HTTP 200, %s kB' "$r" "$((size / 1024))")"
done

# ─── Podsumowanie ──────────────────────────────────────────────────────────
echo
section "Podsumowanie"
if [[ $failures -eq 0 && $warnings -eq 0 ]]; then
  printf "  ${GREEN}Wszystko OK — gotowe do deployu na Vercel.${NC}\n"
  exit 0
elif [[ $failures -eq 0 ]]; then
  printf "  ${YELLOW}Build przechodzi, %d ostrzeżeń (warto zerknąć).${NC}\n" "$warnings"
  exit 0
else
  printf "  ${RED}Znaleziono %d błędów + %d ostrzeżeń. Napraw przed deployem.${NC}\n" "$failures" "$warnings"
  exit 1
fi
