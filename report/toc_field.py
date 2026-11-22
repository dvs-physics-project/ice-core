"""Заворачивает строки содержания в поле Word «TOC» (обновляется по F9) и убирает служебные маркеры.

report.js помечает первую и последнюю строку содержания маркерами §TOCSTART§ и §TOCEND§;
здесь маркеры заменяются на начало и конец поля. Запуск: python3 toc_field.py build/raw.docx Отчёт.docx
"""
import re
import sys
import zipfile

FIELD_BEGIN = ('<w:r><w:fldChar w:fldCharType="begin"/></w:r>'
               '<w:r><w:instrText xml:space="preserve"> TOC \\o "1-2" \\h \\z \\u </w:instrText></w:r>'
               '<w:r><w:fldChar w:fldCharType="separate"/></w:r>')
FIELD_END = '<w:r><w:fldChar w:fldCharType="end"/></w:r>'

source, target = sys.argv[1], sys.argv[2]
archive = zipfile.ZipFile(source)
xml = archive.read('word/document.xml').decode('utf8')
xml = re.sub(r'<w:r>(?:(?!<w:r>).)*?§TOCSTART§</w:t></w:r>', lambda match: FIELD_BEGIN, xml, count=1)
xml = re.sub(r'<w:r>(?:(?!<w:r>).)*?§TOCEND§</w:t></w:r>', lambda match: FIELD_END, xml, count=1)
assert '§TOC' not in xml, 'в документе остался маркер содержания'

output = zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED)
for item in archive.infolist():
    data = xml.encode('utf8') if item.filename == 'word/document.xml' else archive.read(item.filename)
    if not item.filename.endswith('/'):
        output.writestr(item, data)
output.close()
print('поле содержания вставлено')
