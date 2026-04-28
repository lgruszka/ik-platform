#!/usr/bin/env bash
# Generuje PDF-y z plików Markdown w docs/.
# Używa pandoc + xelatex dla pełnej obsługi UTF-8 (znaki polskie, greckie,
# matematyczne). Wyniki trafiają do docs/pdf/.
#
# Wymagania:
#   - pandoc >= 2.x           (https://pandoc.org/installing.html)
#   - xelatex (w TeX Live lub BasicTeX)
# Instalacja:
#   macOS:    brew install pandoc basictex
#             sudo tlmgr update --self && sudo tlmgr install collection-fontsrecommended
#   Ubuntu:   sudo apt install pandoc texlive-xetex texlive-fonts-recommended
#   Arch:     sudo pacman -S pandoc texlive-xetex texlive-fontsrecommended

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCS_DIR="$ROOT_DIR/docs"
OUT_DIR="$DOCS_DIR/pdf"

mkdir -p "$OUT_DIR"

# Sprawdź dostępność narzędzi
missing=()
command -v pandoc >/dev/null 2>&1 || missing+=("pandoc")
command -v xelatex >/dev/null 2>&1 || missing+=("xelatex")

if [ ${#missing[@]} -ne 0 ]; then
  echo "Brak narzędzi: ${missing[*]}"
  echo ""
  echo "Instalacja:"
  echo "  macOS:   brew install pandoc basictex"
  echo "           sudo tlmgr update --self"
  echo "           sudo tlmgr install collection-fontsrecommended xecjk"
  echo "  Ubuntu:  sudo apt install pandoc texlive-xetex texlive-fonts-recommended"
  echo "  Arch:    sudo pacman -S pandoc texlive-xetex texlive-fontsrecommended"
  exit 1
fi

# Opcje wspólne dla wszystkich dokumentów
COMMON_OPTS=(
  --pdf-engine=xelatex
  --toc
  --toc-depth=3
  --number-sections
  -V lang=pl
  -V geometry:margin=2cm
  -V fontsize=10pt
  -V colorlinks=true
  -V linkcolor=RoyalBlue
  -V urlcolor=RoyalBlue
  -V mainfont="Helvetica Neue"
  -V monofont="Menlo"
  -V documentclass=article
  --highlight-style=tango
)

cd "$DOCS_DIR"

echo "Generowanie PDF-ów z docs/*.md → docs/pdf/"
echo ""

fail_count=0
for md in *.md; do
  [ -f "$md" ] || continue
  name="$(basename "$md" .md)"
  out="$OUT_DIR/$name.pdf"
  printf "  → %-40s " "$name.pdf"
  if pandoc "$md" -o "$out" "${COMMON_OPTS[@]}" 2>/tmp/pandoc-err-$$.log; then
    size="$(du -h "$out" | cut -f1)"
    printf "OK (%s)\n" "$size"
  else
    printf "BŁĄD\n"
    sed 's/^/      /' /tmp/pandoc-err-$$.log
    fail_count=$((fail_count + 1))
  fi
done
rm -f /tmp/pandoc-err-$$.log

echo ""
if [ "$fail_count" -eq 0 ]; then
  echo "Zakończono pomyślnie. Wyniki w: $OUT_DIR"
else
  echo "Zakończono z $fail_count błędami."
  exit 1
fi
