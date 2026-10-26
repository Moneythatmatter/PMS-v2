"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, ExternalLink, QrCode } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { buildTableQrUrl, GuestTableApi } from "@/services/front-office/guest-portal";

let tokenCache: Promise<Record<string, string>> | null = null;

function fetchTableTokens(force = false) {
  if (!tokenCache || force) {
    tokenCache = GuestTableApi.qrTokens()
      .then((list) => Object.fromEntries(list.map((t) => [t.tableId, t.token])))
      .catch((e) => {
        tokenCache = null;
        throw e;
      });
  }
  return tokenCache;
}

/** Signed guest-ordering URL for a table, or null while tokens load / for unknown tables. */
export function useTableQrUrl(tableId: string) {
  const [tokens, setTokens] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTableTokens()
      .then(async (map) => (map[tableId] ? map : fetchTableTokens(true)))
      .then((map) => {
        if (!cancelled) setTokens(map);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [tableId]);

  const token = tokens?.[tableId];
  return token ? buildTableQrUrl(tableId, token) : null;
}

async function toQrDataUrl(payload: string) {
  return QRCode.toDataURL(payload, {
    width: 512,
    margin: 2,
    color: { dark: "#0a0a0a", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Printable table card: table number heading, QR, and a short instruction line. */
async function buildPrintableCard(tableNo: string, outletName: string | undefined, qrDataUrl: string) {
  const width = 600;
  const height = 780;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext("2d");
  if (!g) return qrDataUrl;

  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, width, height);
  g.fillStyle = "#065f46";
  g.fillRect(0, 0, width, 130);

  g.textAlign = "center";
  g.fillStyle = "#a7f3d0";
  g.font = "600 22px system-ui, -apple-system, Segoe UI, sans-serif";
  g.fillText((outletName || "SCAN TO ORDER").toUpperCase(), width / 2, 50);
  g.fillStyle = "#ffffff";
  g.font = "700 46px system-ui, -apple-system, Segoe UI, sans-serif";
  g.fillText(`Table ${tableNo}`, width / 2, 105);

  const qr = await loadImage(qrDataUrl);
  g.drawImage(qr, 60, 160, 480, 480);

  g.fillStyle = "#0f172a";
  g.font = "600 26px system-ui, -apple-system, Segoe UI, sans-serif";
  g.fillText("Scan to view the menu", width / 2, 690);
  g.fillText("and order from your table", width / 2, 725);

  return canvas.toDataURL("image/png");
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

async function downloadTableCard(url: string, tableNo: string, outletName: string | undefined, fileStem: string) {
  const qr = await toQrDataUrl(url);
  downloadDataUrl(await buildPrintableCard(tableNo, outletName, qr), `${fileStem}-${tableNo}-qr.png`);
}

function useQrImage(url: string | null) {
  const [rendered, setRendered] = useState<{ url: string; dataUrl: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!url) return;
    toQrDataUrl(url).then((d) => {
      if (!cancelled) setRendered({ url, dataUrl: d });
    });
    return () => {
      cancelled = true;
    };
  }, [url]);
  return rendered && rendered.url === url ? rendered.dataUrl : null;
}

/** Compact QR preview for detail drawers */
export function TableQrPreview({
  tableId,
  tableNo,
  outletId,
  outletName,
  linked = true,
  onDownloaded,
}: {
  tableId: string;
  tableNo: string;
  outletId: string;
  outletName?: string;
  linked?: boolean;
  onDownloaded?: () => void;
}) {
  const url = useTableQrUrl(tableId);
  const dataUrl = useQrImage(url);

  return (
    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Table QR</p>
          <p className="mt-1 text-sm font-medium text-slate-800">
            {linked ? "Linked · ready to print" : "Pending link"}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
            linked ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800",
          )}
        >
          {linked ? "Linked" : "Pending"}
        </span>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt={`QR for ${tableNo}`} className="h-44 w-44 object-contain" />
          ) : (
            <div className="flex h-44 w-44 items-center justify-center text-slate-300">
              <QrCode className="h-10 w-10" />
            </div>
          )}
        </div>
        <p className="mt-3 max-w-[260px] text-center text-[11px] leading-relaxed text-slate-500">
          Guests scan this code to see the menu and send an order request for{" "}
          <span className="font-medium text-slate-700">{tableNo}</span>. Staff review it in Guest Order Requests.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            disabled={!url}
            onClick={async () => {
              if (!url) return;
              await downloadTableCard(url, tableNo, outletName, outletId);
              onDownloaded?.();
            }}
          >
            <Download className="h-3.5 w-3.5" />
            Download PNG
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={!url}
            onClick={() => url && window.open(url, "_blank", "noopener")}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open
          </Button>
        </div>
      </div>
    </div>
  );
}

interface TableQrCardProps {
  tableId: string;
  tableNo: string;
  section?: string;
  outletId: string;
  outletName: string;
  linked: boolean;
  onLink?: () => void;
  onDownloaded?: () => void;
}

export function TableQrCard({
  tableId,
  tableNo,
  section,
  outletId,
  outletName,
  linked,
  onLink,
  onDownloaded,
}: TableQrCardProps) {
  const [expanded, setExpanded] = useState(false);
  const url = useTableQrUrl(tableId);
  const dataUrl = useQrImage(url);

  const handleDownload = async () => {
    if (!url) return;
    await downloadTableCard(url, tableNo, outletName, outletId);
    onDownloaded?.();
  };

  return (
    <li className="rounded-xl border border-slate-200 px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white"
            title="View QR"
          >
            {!dataUrl ? (
              <QrCode className="h-5 w-5 text-emerald-700" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dataUrl} alt={`QR for ${tableNo}`} className="h-full w-full object-contain p-1" />
            )}
          </button>
          <div>
            <p className="text-sm font-semibold text-slate-900">{tableNo}</p>
            <p className="text-xs text-slate-500">
              {section ?? "—"} · {outletName}
            </p>
            {url && (
              <p className="mt-0.5 max-w-[220px] truncate text-[10px] text-slate-400" title={url}>
                {url}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              linked ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
            )}
          >
            {linked ? "Linked" : "Pending"}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Hide" : "View"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={!url}
            onClick={handleDownload}
          >
            <Download className="h-3.5 w-3.5" />
            PNG
          </Button>
          {!linked && onLink && (
            <Button type="button" size="sm" onClick={onLink}>
              Link QR
            </Button>
          )}
        </div>
      </div>

      {expanded && dataUrl && (
        <div className="mt-3 flex flex-col items-center rounded-xl bg-slate-50 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt={`QR code ${tableNo}`}
            className="h-48 w-48 rounded-lg border border-slate-200 bg-white p-2"
          />
          <p className="mt-3 text-center text-xs text-slate-500">
            Print this QR and place it on {tableNo}. Guests scan to view the menu and send an order request.
          </p>
          <Button type="button" size="sm" className="mt-3 gap-1.5" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" />
            Download QR image
          </Button>
        </div>
      )}
    </li>
  );
}

export async function downloadAllTableQrs(
  tables: { tableId: string; tableNo: string; outletId: string; outletName?: string }[],
) {
  const tokens = await fetchTableTokens(true);
  let count = 0;
  for (const table of tables) {
    const token = tokens[table.tableId];
    if (!token) continue;
    await downloadTableCard(buildTableQrUrl(table.tableId, token), table.tableNo, table.outletName, table.outletId);
    count += 1;
    await new Promise((r) => setTimeout(r, 150));
  }
  return count;
}
