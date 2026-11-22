#!/usr/bin/env bash
# Сборка отчёта: report.js → поле содержания → PDF → номера страниц → повторная сборка.
# Нужны: Node 18+, пакет docx, LibreOffice (soffice; другой путь — через SOFFICE), poppler-utils (pdfinfo, pdftotext).
set -euo pipefail
cd "$(dirname "$0")"
OUT="Отчёт_проект_ДВС.docx"
mkdir -p build
build() {
  node report.js
  python3 toc_field.py build/raw.docx "$OUT"
  zip -qd "$OUT" '*/' >/dev/null 2>&1 || true
  ${SOFFICE:-soffice} --headless --convert-to pdf --outdir build "$OUT" >/dev/null 2>&1
}
rm -f build/toc_pages.json
build
python3 toc_pages.py "build/${OUT%.docx}.pdf"
build
python3 toc_pages.py "build/${OUT%.docx}.pdf"
echo "report/$OUT готов ($(pdfinfo "build/${OUT%.docx}.pdf" | awk '/Pages/ {print $2}') страниц)"
