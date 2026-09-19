import jsPDF from "jspdf";

export interface ExportColumn<T extends Record<string, unknown>> {
  key: keyof T & string;
  header: string;
}

function escapeCsvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildCsv<T extends Record<string, unknown>>(
  columns: ExportColumn<T>[],
  rows: T[],
) {
  const header = columns.map((column) => escapeCsvValue(column.header)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((column) => {
          const raw = row[column.key];
          const value = raw === undefined || raw === null ? "" : String(raw);
          return escapeCsvValue(value);
        })
        .join(","),
    )
    .join("\n");

  return [header, body].filter(Boolean).join("\n");
}

function buildHtmlTable<T extends Record<string, unknown>>(
  title: string,
  columns: ExportColumn<T>[],
  rows: T[],
) {
  const headerCells = columns.map((column) => `<th>${column.header}</th>`).join("");
  const bodyRows = rows
    .map((row) => {
      const cells = columns
        .map((column) => {
          const raw = row[column.key];
          const value = raw === undefined || raw === null ? "" : String(raw);
          return `<td>${value.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
      h1 { font-size: 18px; margin: 0 0 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
      th { background: #f8fafc; font-weight: 700; }
      tr:nth-child(even) td { background: #f8fafc; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    <table>
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </body>
</html>`;
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportTableAsCsv<T extends Record<string, unknown>>(
  filename: string,
  columns: ExportColumn<T>[],
  rows: T[],
) {
  downloadTextFile(filename, buildCsv(columns, rows), "text/csv;charset=utf-8");
}

export function exportTableAsExcel<T extends Record<string, unknown>>(
  filename: string,
  title: string,
  columns: ExportColumn<T>[],
  rows: T[],
) {
  const html = buildHtmlTable(title, columns, rows);
  downloadTextFile(
    filename.endsWith(".xls") ? filename : `${filename.replace(/\.[^.]+$/, "")}.xls`,
    html,
    "application/vnd.ms-excel;charset=utf-8",
  );
}

export function exportTableAsPdf<T extends Record<string, unknown>>(
  title: string,
  columns: ExportColumn<T>[],
  rows: T[],
  filename?: string,
) {
  if (typeof window === "undefined") return;

  const isWide = columns.length > 5;
  const orientation = isWide ? "landscape" : "portrait";
  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 10;
  const marginRight = 10;
  const marginTop = 12;
  const marginBottom = 12;
  const usableWidth = pageWidth - marginLeft - marginRight;

  // Header Title
  let y = marginTop;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(title, marginLeft, y);

  // Metadata
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  const dateStr = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(`Generated: ${dateStr}   |   Total Records: ${rows.length}`, marginLeft, y);

  y += 4;
  // Header divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.line(marginLeft, y, pageWidth - marginRight, y);

  y += 3;

  // Calculate dynamic column widths based on headers and row values
  const weights = columns.map((col) => {
    let maxLen = col.header.length;
    const sampleSize = Math.min(rows.length, 50);
    for (let i = 0; i < sampleSize; i++) {
      const val = rows[i][col.key];
      if (val !== undefined && val !== null) {
        maxLen = Math.max(maxLen, String(val).length);
      }
    }
    return Math.max(6, Math.min(maxLen, 24));
  });
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const colWidths = weights.map((w) => (w / totalWeight) * usableWidth);

  const headerHeight = 6.5;
  const rowHeight = 5.8;
  const fontSize = columns.length > 10 ? 6.5 : columns.length > 6 ? 7 : 7.5;

  const renderTableHeader = (currentY: number) => {
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(marginLeft, currentY, usableWidth, headerHeight, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(fontSize);
    doc.setTextColor(255, 255, 255);

    let curX = marginLeft;
    columns.forEach((col, idx) => {
      const colWidth = colWidths[idx];
      const headerLines = doc.splitTextToSize(col.header, colWidth - 2);
      const text = headerLines[0] || col.header;
      doc.text(text, curX + 1.2, currentY + 4.3);
      curX += colWidth;
    });

    return currentY + headerHeight;
  };

  y = renderTableHeader(y);

  // Render Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);

  rows.forEach((row, rowIndex) => {
    if (y + rowHeight > pageHeight - marginBottom) {
      doc.addPage();
      y = marginTop;
      y = renderTableHeader(y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize);
    }

    // Alternating row background
    if (rowIndex % 2 === 1) {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(marginLeft, y, usableWidth, rowHeight, "F");
    }

    // Row bottom border
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.setLineWidth(0.15);
    doc.line(marginLeft, y + rowHeight, pageWidth - marginRight, y + rowHeight);

    doc.setTextColor(30, 41, 59); // slate-800
    let curX = marginLeft;
    columns.forEach((col, idx) => {
      const colWidth = colWidths[idx];
      const raw = row[col.key];
      const val = raw === undefined || raw === null ? "—" : String(raw);
      const cellLines = doc.splitTextToSize(val, colWidth - 2);
      const text = cellLines[0] || "";
      doc.text(text, curX + 1.2, y + 3.8);
      curX += colWidth;
    });

    y += rowHeight;
  });

  // Footers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Page ${p} of ${totalPages}`,
      pageWidth - marginRight,
      pageHeight - 5,
      { align: "right" },
    );
    doc.text(
      "Hotel PMS — Human Resources",
      marginLeft,
      pageHeight - 5,
      { align: "left" },
    );
  }

  const safeFilename =
    filename || `${title.toLowerCase().replace(/[^a-z0-9_-]+/g, "_")}.pdf`;
  const finalFilename = safeFilename.endsWith(".pdf")
    ? safeFilename
    : `${safeFilename}.pdf`;
  doc.save(finalFilename);
}
