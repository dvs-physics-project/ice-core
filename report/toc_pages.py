"""Второй проход сборки: находит номера страниц разделов в PDF и пишет build/toc_pages.json.

Раздел ищется по первым 24 символам заголовка начиная со страницы, где начинается введение
(до неё — титул и само содержание). Номера попадают в содержание при повторной сборке;
в Word поле содержания можно обновить клавишей F9.
"""
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
pdf = sys.argv[1]
headings = [title for title, _ in json.load(open(os.path.join(HERE, 'toc_items.json'), encoding='utf8'))]
info = subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout
page_count = int(re.search(r'Pages:\s+(\d+)', info).group(1))


def page_text(page):
    text = subprocess.run(['pdftotext', '-f', str(page), '-l', str(page), pdf, '-'], capture_output=True, text=True).stdout
    return re.sub(r'\s+', ' ', text)


texts = [page_text(page) for page in range(1, page_count + 1)]
first_page = next(page for page in range(1, page_count + 1) if 'Актуальность.' in texts[page - 1])
pages = {}
for heading in headings:
    for page in range(first_page, page_count + 1):
        if heading[:24] in texts[page - 1]:
            pages[heading] = page
            break
missing = [heading for heading in headings if heading not in pages]
json.dump(pages, open(os.path.join(HERE, 'build', 'toc_pages.json'), 'w', encoding='utf8'), ensure_ascii=False)
print(f'{page_count} страниц; не найдено в тексте: {missing or "—"}')
