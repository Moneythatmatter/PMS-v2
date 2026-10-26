"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, ExternalLink, QrCode } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { buildRoomQrUrl } from "@/services/front-office/guest-portal";

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

/** Printable card: room number heading, QR, and a short instruction line. */
async function buildPrintableCard(roomNo: string, qrDataUrl: string) {
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
  g.fillText("GUEST SERVICES", width / 2, 50);
  g.fillStyle = "#ffffff";
  g.font = "700 46px system-ui, -apple-system, Segoe UI, sans-serif";
  g.fillText(`Room ${roomNo}`, width / 2, 105);

  const qr = await loadImage(qrDataUrl);
  g.drawImage(qr, 60, 160, 480, 480);

  g.fillStyle = "#0f172a";
  g.font = "600 26px system-ui, -apple-system, Segoe UI, sans-serif";
  g.fillText("Scan to order food, request", width / 2, 690);
  g.fillText("room cleaning or laundry", width / 2, 725);

  return canvas.toDataURL("image/png");
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export async function downloadRoomQr(roomNo: string, roomId: string, token: string) {
  const qr = await toQrDataUrl(buildRoomQrUrl(roomId, token));
  const card = await buildPrintableCard(roomNo, qr);
  downloadDataUrl(card, `room-${roomNo}-qr.png`);
}

export async function downloadAllRoomQrs(rooms: { roomNo: string; roomId: string; token: string }[]) {
  for (const room of rooms) {
    await downloadRoomQr(room.roomNo, room.roomId, room.token);
    await new Promise((r) => setTimeout(r, 150));
  }
}

export function RoomQrPanel({
  roomNo,
  roomId,
  token,
  inactive,
  onCopied,
}: {
  roomNo: string;
  roomId: string;
  token: string | null;
  inactive?: boolean;
  onCopied?: () => void;
}) {
  const [rendered, setRendered] = useState<{ url: string; dataUrl: string } | null>(null);
  const url = token ? buildRoomQrUrl(roomId, token) : null;
  const dataUrl = rendered && rendered.url === url ? rendered.dataUrl : null;

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

  return (
    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Guest Room QR</p>
          <p className="mt-1 text-sm font-medium text-slate-800">Unique to Room {roomNo}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            inactive ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {inactive ? "Room inactive" : "Ready to print"}
        </span>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt={`QR for room ${roomNo}`} className="h-44 w-44 object-contain" />
          ) : (
            <div className="flex h-44 w-44 items-center justify-center text-slate-300">
              <QrCode className="h-10 w-10" />
            </div>
          )}
        </div>
        <p className="mt-3 max-w-[280px] text-center text-[11px] leading-relaxed text-slate-500">
          Guests scan this code to open the room portal for{" "}
          <span className="font-medium text-slate-700">Room {roomNo}</span> — order food, request cleaning or
          laundry. Requests work only while a guest is checked in.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            disabled={!token}
            onClick={() => token && void downloadRoomQr(roomNo, roomId, token)}
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
            onClick={() => {
              if (!url) return;
              void navigator.clipboard?.writeText(url).then(() => onCopied?.());
            }}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy link
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
