export type XlsxCell = string | number | boolean | null | undefined;

export type XlsxSheet = {
  name: string;
  /** Bold heading in the first row. */
  title?: string;
  /** Label/value lines printed under the title (e.g. date range, generated at). */
  meta?: [string, XlsxCell][];
  /** Column headers — bold, shaded, and frozen while scrolling. */
  header?: string[];
  rows: XlsxCell[][];
};

const STYLE = { normal: 0, header: 1, title: 2, label: 3 } as const;

const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

function escapeXml(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function columnName(index: number) {
  let name = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function cellXml(ref: string, value: XlsxCell, style: number) {
  const s = style ? ` s="${style}"` : "";
  if (value === null || value === undefined || value === "") {
    return style ? `<c r="${ref}"${s}/>` : "";
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${ref}"${s}><v>${value}</v></c>`;
  }
  if (typeof value === "boolean") {
    return `<c r="${ref}"${s} t="b"><v>${value ? 1 : 0}</v></c>`;
  }
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(value))}</t></is></c>`;
}

function sheetXml(sheet: XlsxSheet) {
  const rows: { cells: XlsxCell[]; style: (col: number) => number }[] = [];

  if (sheet.title) rows.push({ cells: [sheet.title], style: () => STYLE.title });
  for (const [label, value] of sheet.meta ?? []) {
    rows.push({ cells: [label, value], style: (c) => (c === 0 ? STYLE.label : STYLE.normal) });
  }
  if (rows.length) rows.push({ cells: [], style: () => STYLE.normal });

  let headerRowNumber = 0;
  if (sheet.header?.length) {
    rows.push({ cells: sheet.header, style: () => STYLE.header });
    headerRowNumber = rows.length;
  }
  for (const r of sheet.rows) rows.push({ cells: r, style: () => STYLE.normal });

  const columnCount = Math.max(1, sheet.header?.length ?? 0, ...sheet.rows.map((r) => r.length));
  const widths = Array.from({ length: columnCount }, (_, col) => {
    const lengths = [
      sheet.header?.[col] ?? "",
      ...sheet.rows.map((r) => r[col]),
      ...(col === 0 ? (sheet.meta ?? []).map((m) => m[0]) : []),
      ...(col === 1 ? (sheet.meta ?? []).map((m) => m[1]) : []),
    ].map((v) => (v === null || v === undefined ? 0 : String(v).length));
    return Math.min(60, Math.max(10, ...lengths) + 2);
  });

  const sheetData = rows
    .map((row, i) => {
      const rowNumber = i + 1;
      const cells = row.cells
        .map((value, col) => cellXml(`${columnName(col)}${rowNumber}`, value, row.style(col)))
        .join("");
      return `<row r="${rowNumber}">${cells}</row>`;
    })
    .join("");

  const pane = headerRowNumber
    ? `<pane ySplit="${headerRowNumber}" topLeftCell="A${headerRowNumber + 1}" activePane="bottomLeft" state="frozen"/>`
    : "";
  const cols = widths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join("");
  const autoFilter =
    headerRowNumber && sheet.rows.length
      ? `<autoFilter ref="A${headerRowNumber}:${columnName(columnCount - 1)}${headerRowNumber + sheet.rows.length}"/>`
      : "";

  return (
    XML_HEAD +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetViews><sheetView workbookViewId="0">${pane}</sheetView></sheetViews>` +
    `<cols>${cols}</cols>` +
    `<sheetData>${sheetData}</sheetData>` +
    autoFilter +
    "</worksheet>"
  );
}

const STYLES_XML =
  XML_HEAD +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="3">' +
  '<font><sz val="11"/><name val="Calibri"/></font>' +
  '<font><b/><sz val="11"/><name val="Calibri"/></font>' +
  '<font><b/><sz val="14"/><name val="Calibri"/></font>' +
  "</fonts>" +
  '<fills count="3">' +
  '<fill><patternFill patternType="none"/></fill>' +
  '<fill><patternFill patternType="gray125"/></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/><bgColor indexed="64"/></patternFill></fill>' +
  "</fills>" +
  '<borders count="2">' +
  "<border><left/><right/><top/><bottom/><diagonal/></border>" +
  '<border><left/><right/><top/><bottom style="thin"><color rgb="FF94A3B8"/></bottom><diagonal/></border>' +
  "</borders>" +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="4">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
  '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
  '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
  "</cellXfs>" +
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
  "</styleSheet>";

function safeSheetName(name: string, used: Set<string>) {
  const base = (name.replace(/[[\]:*?/\\]/g, " ").trim() || "Sheet").slice(0, 31);
  let candidate = base;
  let n = 2;
  while (used.has(candidate.toLowerCase())) {
    const suffix = ` (${n++})`;
    candidate = base.slice(0, 31 - suffix.length) + suffix;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

/* ---------- minimal ZIP (store, no compression) ---------- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function zip(files: { name: string; content: string }[]) {
  const encoder = new TextEncoder();
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint16(8, 0, true);
    local.setUint16(10, dosTime, true);
    local.setUint16(12, dosDate, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true);
    chunks.push(new Uint8Array(local.buffer), name, data);

    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint16(8, 0x0800, true);
    entry.setUint16(10, 0, true);
    entry.setUint16(12, dosTime, true);
    entry.setUint16(14, dosDate, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, data.length, true);
    entry.setUint32(24, data.length, true);
    entry.setUint16(28, name.length, true);
    entry.setUint32(42, offset, true);
    central.push(new Uint8Array(entry.buffer), name);

    offset += 30 + name.length + data.length;
  }

  const centralSize = central.reduce((s, c) => s + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  return new Blob([...chunks, ...central, new Uint8Array(end.buffer)] as BlobPart[], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function buildXlsx(sheets: XlsxSheet[]): Blob {
  const used = new Set<string>();
  const named = sheets.map((s) => ({ ...s, name: safeSheetName(s.name, used) }));

  const files = [
    {
      name: "[Content_Types].xml",
      content:
        XML_HEAD +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        named
          .map(
            (_, i) =>
              `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
          )
          .join("") +
        "</Types>",
    },
    {
      name: "_rels/.rels",
      content:
        XML_HEAD +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        "</Relationships>",
    },
    {
      name: "xl/workbook.xml",
      content:
        XML_HEAD +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        "<sheets>" +
        named
          .map((s, i) => `<sheet name="${escapeXml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
          .join("") +
        "</sheets>" +
        (named.some((s) => s.header?.length && s.rows.length)
          ? "<definedNames>" +
            named
              .map((s, i) => {
                if (!s.header?.length || !s.rows.length) return "";
                const headerRow =
                  (s.title ? 1 : 0) + (s.meta?.length ?? 0) + (s.title || s.meta?.length ? 1 : 0) + 1;
                const lastCol = columnName(Math.max(s.header.length, ...s.rows.map((r) => r.length)) - 1);
                return `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${escapeXml(s.name.replace(/'/g, "''"))}'!$A$${headerRow}:$${lastCol}$${headerRow + s.rows.length}</definedName>`;
              })
              .join("") +
            "</definedNames>"
          : "") +
        "</workbook>",
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content:
        XML_HEAD +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        named
          .map(
            (_, i) =>
              `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
          )
          .join("") +
        `<Relationship Id="rId${named.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        "</Relationships>",
    },
    { name: "xl/styles.xml", content: STYLES_XML },
    ...named.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, content: sheetXml(s) })),
  ];

  return zip(files);
}

export function downloadXlsx(filename: string, sheets: XlsxSheet[]) {
  const blob = buildXlsx(sheets);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.toLowerCase().endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugifyFilename(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "export";
}
