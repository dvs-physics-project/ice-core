/*
 * Оформление отчёта: Times New Roman 14, интервал 1,5, поля 3 / 1,5 / 2 / 2 см, абзацный отступ 1,25 см.
 *
 *   textRuns(text, base)   — строка с разметкой: **жирный**, _{нижний индекс}, ^{верхний индекс}
 *   paragraph(text, opt)   — абзац по ширине с отступом; whereText — пояснение «где …» без отступа
 *   formula(text)          — формула по центру с номером справа в скобках; lastFormulaNumber() — её номер
 *   heading1, heading2     — заголовки (раздел начинается с новой страницы)
 *   figure(file, caption, widthCm) — рисунок и подпись «Рисунок N – …» под ним
 *   table(caption, head, rows, widthsCm, opt) — таблица 12 пт с подписью «Таблица N – …» над ней;
 *                            ширины столбцов пропорциональны widthsCm и в сумме дают ширину текста
 *   bulletList, numberedList — списки с тире и с номерами «1)»
 *   styles, numbering, pageProps, footer — стили, нумерация списков, размеры страницы, номер страницы внизу
 *   flatten(items)         — развернуть рисунки и таблицы (у них несколько абзацев) в общий список
 */
const fs = require('fs');
const pngSize = (file) => {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};
const docx = require('docx');
const {
  Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle,
  ShadingType, TabStopType, PageBreak, Footer, PageNumber, LevelFormat, HeadingLevel, VerticalAlign,
} = docx;

const FONT = 'Times New Roman';
const TEXT_WIDTH = 11906 - 1701 - 851;
const LINE = 360;

function textRuns(text, base = {}) {
  const out = [];
  let i = 0, buf = '', bold = false, ital = false;
  const flush = (extra = {}) => {
    if (buf) out.push(new TextRun({ text: buf, font: FONT, bold: bold || base.bold, italics: ital || base.italics, size: base.size, ...extra }));
    buf = '';
  };
  while (i < text.length) {
    if (text.startsWith('**', i)) { flush(); bold = !bold; i += 2; continue; }
    if ((text[i] === '_' || text[i] === '^') && text[i + 1] === '{') {
      flush();
      const j = text.indexOf('}', i);
      buf = text.slice(i + 2, j);
      flush(text[i] === '_' ? { subScript: true } : { superScript: true });
      i = j + 1; continue;
    }
    buf += text[i]; i++;
  }
  flush();
  return out;
}

const paragraph = (text, opt = {}) => new Paragraph({
  alignment: opt.align || AlignmentType.JUSTIFIED,
  indent: { firstLine: opt.noIndent ? 0 : 709 },
  spacing: { line: LINE, lineRule: 'auto', before: opt.before || 0, after: opt.after || 0 },
  keepNext: opt.keepNext,
  children: textRuns(text, opt.run || {}),
});

const whereText = (text) => paragraph(text, { noIndent: true });

let counters = { f: 0, fig: 0, tab: 0 };
const resetNumbering = () => { counters = { f: 0, fig: 0, tab: 0 }; };

function formula(text, opt = {}) {
  counters.f += 1;
  const n = counters.f;
  const p = new Paragraph({
    tabStops: [{ type: TabStopType.CENTER, position: Math.round(TEXT_WIDTH / 2) }, { type: TabStopType.RIGHT, position: TEXT_WIDTH }],
    spacing: { line: LINE, lineRule: 'auto', before: 60, after: 60 },
    keepNext: opt.keepNext,
    children: [new TextRun({ text: '\t', font: FONT }), ...textRuns(text, { italics: false }), new TextRun({ text: `\t(${n})`, font: FONT })],
  });
  p.num = n;
  return p;
}
const lastFormulaNumber = () => counters.f;

const heading1 = (text, opt = {}) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  alignment: AlignmentType.CENTER,
  pageBreakBefore: opt.pageBreak !== false,
  spacing: { line: LINE, lineRule: 'auto', before: 0, after: 240 },
  keepNext: true,
  children: [new TextRun({ text, font: FONT, bold: true })],
});
const heading2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  alignment: AlignmentType.LEFT,
  indent: { firstLine: 709 },
  spacing: { line: LINE, lineRule: 'auto', before: 240, after: 120 },
  keepNext: true,
  children: [new TextRun({ text, font: FONT, bold: true })],
});

function figure(file, caption, widthCm = 15) {
  counters.fig += 1;
  const { w, h } = pngSize(file);
  const wpx = Math.round(widthCm / 2.54 * 96);
  const hpx = Math.round(wpx * h / w);
  return {
    n: counters.fig,
    items: [
      new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 0, line: 240, lineRule: 'auto' },
        children: [new ImageRun({ type: 'png', data: fs.readFileSync(file), transformation: { width: wpx, height: hpx }, altText: { title: caption, description: caption, name: caption } })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { line: LINE, lineRule: 'auto', before: 60, after: 200 },
        children: textRuns(`Рисунок ${counters.fig} – ${caption}`) }),
    ],
  };
}
const nextFigureNumber = () => counters.fig + 1;
const nextTableNumber = () => counters.tab + 1;

const border = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const borders = { top: border, bottom: border, left: border, right: border };
function table(caption, head, rows, widthsCm, opt = {}) {
  counters.tab += 1;
  const total = TEXT_WIDTH;
  let ws = widthsCm.map((c) => Math.round(c / 2.54 * 1440));
  const s = ws.reduce((a, b) => a + b, 0);
  ws = ws.map((x) => Math.round(x * total / s));
  ws[ws.length - 1] += total - ws.reduce((a, b) => a + b, 0);
  const cell = (t, i, header) => new TableCell({
    width: { size: ws[i], type: WidthType.DXA }, borders,
    verticalAlign: VerticalAlign.CENTER,
    shading: header ? { fill: 'EDEDED', type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: String(t).split('\n').map((line) => new Paragraph({
      alignment: (opt.leftCols || [0]).includes(i) && !header ? AlignmentType.LEFT : AlignmentType.CENTER,
      spacing: { line: 240, lineRule: 'auto' }, children: textRuns(line, { size: 24, bold: header }),
    })),
  });
  const table = new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: ws,
    rows: [new TableRow({ tableHeader: true, children: head.map((t, i) => cell(t, i, true)) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((t, i) => cell(t, i, false)) }))],
  });
  return {
    n: counters.tab,
    items: [new Paragraph({ keepNext: true, spacing: { line: LINE, lineRule: 'auto', before: 200, after: 60 }, children: textRuns(`Таблица ${counters.tab} – ${caption}`) }), table,
      new Paragraph({ spacing: { after: 120 }, children: [] })],
  };
}

const numbering = {
  config: [
    { reference: 'dash', levels: [{ level: 0, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 709 + 360, hanging: 360 } }, run: { font: FONT } } }] },
    ...Array.from({ length: 12 }, (_, k) => ({ reference: 'num' + k, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1)', alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 709 + 400, hanging: 400 } }, run: { font: FONT } } }] })),
  ],
};
let listCount = 0;
const bulletList = (items) => items.map((t) => new Paragraph({ numbering: { reference: 'dash', level: 0 }, alignment: AlignmentType.JUSTIFIED, spacing: { line: LINE, lineRule: 'auto' }, children: textRuns(t) }));
const numberedList = (items) => { const ref = 'num' + (listCount++); return items.map((t) => new Paragraph({ numbering: { reference: ref, level: 0 }, alignment: AlignmentType.JUSTIFIED, spacing: { line: LINE, lineRule: 'auto' }, children: textRuns(t) })); };

const styles = {
  default: { document: { run: { font: FONT, size: 28 }, paragraph: { spacing: { line: LINE, lineRule: 'auto' } } } },
  paragraphStyles: [
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { font: FONT, size: 28, bold: true, color: '000000' }, paragraph: { spacing: { before: 0, after: 240 }, keepNext: true, outlineLevel: 0 } },
    { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { font: FONT, size: 28, bold: true, color: '000000' }, paragraph: { spacing: { before: 240, after: 120 }, keepNext: true, outlineLevel: 1 } },
  ],
};

const pageProps = (titlePage = false) => ({
  page: { size: { width: 11906, height: 16838 }, margin: { left: 1701, right: 851, top: 1134, bottom: 1134 } },
  titlePage,
});
const footer = () => ({ default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 24 })] })] }),
  first: new Footer({ children: [new Paragraph({ children: [] })] }) });

const flatten = (arr) => arr.flatMap((x) => (x && x.items ? x.items : Array.isArray(x) ? x : [x]));

module.exports = { docx, paragraph, whereText, formula, lastFormulaNumber, heading1, heading2, figure, table, bulletList, numberedList, numbering, styles, pageProps, footer, flatten, textRuns, nextFigureNumber, nextTableNumber, resetNumbering, FONT, LINE, TEXT_WIDTH };
