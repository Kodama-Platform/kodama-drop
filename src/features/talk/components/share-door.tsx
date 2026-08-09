import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";

import { TALK } from "@/lib/brand";
import { talkService } from "@/features/talk/services";
import type { Place } from "@/features/talk/types";
import { markFor } from "@/features/talk/lib/mark";
import { TalkSheet } from "@/features/talk/components/talk-sheet";
import { TalkAddressPlaque } from "@/features/talk/components/talk-address-plaque";

/** Share your Door: copy the URL, a QR, and a downloadable share card. */
export function ShareDoorSheet({
  open,
  onOpenChange,
  address,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  address: string;
}) {
  const [place, setPlace] = useState<Place | null>(null);
  const [qr, setQr] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const url = `${TALK.url}/${address}`;

  useEffect(() => {
    if (!open) return;
    void talkService.resolvePlace(address).then((p) => setPlace(p));
    void QRCode.toDataURL(url, {
      margin: 1,
      width: 320,
      color: { dark: "#2f3a2c", light: "#00000000" },
    }).then(setQr);
  }, [open, address, url]);

  useEffect(() => {
    if (open && place && canvasRef.current) void drawShareCard(canvasRef.current, place);
  }, [open, place]);

  const copyLink = async () => {
    try {
      await navigator.clipboard?.writeText(url);
      toast.success("Link copied — paste it anywhere");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const nativeShare = async () => {
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: `${place?.displayName ?? address} on Kodama Talk`, text: "Drop me a message here:", url });
      } catch {
        /* user cancelled */
      }
    } else {
      void copyLink();
    }
  };

  const downloadCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `kodama-talk-${address}.png`;
    a.click();
    toast.success("Share card saved");
  };

  return (
    <TalkSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Share your door"
      description="One address, anywhere. No account needed to reach you."
    >
      <div className="space-y-5" data-testid="share-sheet">
        <div className="flex justify-center">
          <TalkAddressPlaque address={address} className="!py-2.5 !text-base" />
        </div>

        <div className="flex gap-2">
          <button type="button" className="btn-moss flex-1 justify-center" onClick={copyLink} data-testid="share-copy-link">
            <Link2 className="h-4 w-4" /> Copy link
          </button>
          <button type="button" className="talk-pill justify-center" onClick={nativeShare} data-testid="share-native">
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card/40 p-5">
          {qr ? (
            <img src={qr} alt={`QR code for ${url}`} className="h-40 w-40" data-testid="share-qr" />
          ) : (
            <div className="h-40 w-40 animate-pulse rounded-xl bg-muted" />
          )}
          <p className="text-center font-mono text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground/70">
            Point a camera here
          </p>
        </div>

        <div className="space-y-2">
          <p className="talk-section-label">Share card</p>
          <canvas ref={canvasRef} width={1024} height={536} className="w-full rounded-xl border border-border/60" data-testid="share-card-canvas" />
          <button type="button" className="talk-pill w-full justify-center" onClick={downloadCard} data-testid="share-download-card">
            <Download className="h-4 w-4" /> Download share card
          </button>
        </div>
      </div>
    </TalkSheet>
  );
}

async function drawShareCard(canvas: HTMLCanvasElement, place: Place) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
  } catch {
    /* fonts optional */
  }
  const W = canvas.width;
  const H = canvas.height;
  const mark = place.mark ?? markFor(place.displayName, place.address);

  // Dusk background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#12160f");
  bg.addColorStop(1, "#1b241c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Soft accent glow from the place gradient
  const glow = ctx.createRadialGradient(W - 220, 150, 40, W - 220, 150, 520);
  glow.addColorStop(0, hexA(mark.gradient[1], 0.28));
  glow.addColorStop(1, hexA(mark.gradient[1], 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const padX = 72;

  // Place mark
  const size = 132;
  const mx = padX;
  const my = 96;
  const g = ctx.createLinearGradient(mx, my, mx + size, my + size);
  g.addColorStop(0, mark.gradient[0]);
  g.addColorStop(1, mark.gradient[1]);
  ctx.fillStyle = g;
  roundRect(ctx, mx, my, size, size, 40);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.font = "500 56px 'Fraunces', Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(mark.initials, mx + size / 2, my + size / 2 + 2);

  // Eyebrow
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(198,138,74,0.9)";
  ctx.font = "500 22px ui-monospace, monospace";
  ctx.fillText("REACH ME AT", mx + size + 34, my + 40);

  // Display name
  ctx.fillStyle = "#f3efe6";
  ctx.font = "500 60px 'Fraunces', Georgia, serif";
  ctx.fillText(truncate(ctx, place.displayName, W - (mx + size + 34) - padX), mx + size + 34, my + 100);

  // Address
  ctx.fillStyle = "#9db07e";
  ctx.font = "500 30px ui-monospace, monospace";
  ctx.fillText(`${TALK.domain}/${place.address}`, mx + size + 34, my + 145);

  // Tagline
  ctx.fillStyle = "rgba(243,239,230,0.7)";
  ctx.font = "300 30px 'Outfit', system-ui, sans-serif";
  wrapText(ctx, place.tagline || "Drop me a message.", padX, my + size + 70, W - padX * 2, 42, 2);

  // Footer
  ctx.fillStyle = "rgba(243,239,230,0.45)";
  ctx.font = "500 22px ui-monospace, monospace";
  ctx.fillText("Own your place · Kodama Talk · No account needed", padX, H - 48);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, maxLines: number) {
  const words = text.split(" ");
  let line = "";
  let lines = 0;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      line = w;
      y += lh;
      lines += 1;
      if (lines >= maxLines - 1) {
        ctx.fillText(truncate(ctx, line + " " + words.slice(words.indexOf(w) + 1).join(" "), maxW), x, y);
        return;
      }
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
}

function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
