import { useEffect, useRef, useState } from "react";
import { Check, Copy, Download, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { TALK } from "@/lib/brand";
import { markFor } from "@/features/talk/lib/mark";
import { copyText } from "@/features/talk/lib/clipboard";
import { getTalkSecurity } from "@/features/talk/security/talk-security-adapter";
import { TalkSheet } from "@/features/talk/components/talk-sheet";

/**
 * The Key Card — a calm, downloadable recovery artifact for an accountless place.
 * At claim time it must be acknowledged before continuing; from Settings it's a
 * quiet re-download. Honest: the mock code is a placeholder for the real
 * security-core recovery key.
 */
export function KeyCardSheet({
  open,
  onOpenChange,
  address,
  displayName,
  mustAcknowledge = false,
  onAcknowledged,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  address: string;
  displayName: string;
  mustAcknowledge?: boolean;
  onAcknowledged?: () => void;
}) {
  const [code, setCode] = useState("");
  const [saved, setSaved] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open) return;
    setSaved(false);
    void getTalkSecurity().mintRecoveryKey(address).then((k) => setCode(k.code));
  }, [open, address]);

  useEffect(() => {
    if (open && code && canvasRef.current) void drawKeyCard(canvasRef.current, { address, displayName, code });
  }, [open, code, address, displayName]);

  const copyCode = async () => {
    if (await copyText(code)) toast.success("Recovery key copied");
    else toast.error("Couldn't copy — write it down instead");
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `kodama-talk-keycard-${address}.png`;
    a.click();
    setSaved(true);
    toast.success("Key card saved");
  };

  return (
    <TalkSheet
      open={open}
      onOpenChange={(o) => {
        // Don't let a claim-time gate be dismissed by the X / overlay.
        if (mustAcknowledge && !o) return;
        onOpenChange(o);
      }}
      title="Your key card"
      description="No account, no password reset. This card is the only way back into your place — keep it somewhere safe."
    >
      <div className="space-y-5" data-testid="key-card-sheet">
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.06] px-3 py-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
          <p className="text-xs font-light leading-relaxed text-foreground/85">
            We can&apos;t see it and can&apos;t recover it for you — that&apos;s what keeps your place yours.
          </p>
        </div>

        <div>
          <p className="talk-section-label mb-2">Recovery key for {TALK.domain}/{address}</p>
          <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/50 px-3 py-3">
            <code className="flex-1 select-all text-center font-mono text-lg tracking-[0.18em] text-foreground" data-testid="key-card-code">
              {code || "····-····-····-····"}
            </code>
            <button type="button" className="talk-pill !px-3 !py-2 text-sm" onClick={copyCode} disabled={!code} data-testid="key-card-copy">
              <Copy className="h-4 w-4" /> Copy
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="talk-section-label">Downloadable card</p>
          <canvas ref={canvasRef} width={1024} height={536} className="w-full rounded-xl border border-border/60" data-testid="key-card-canvas" />
          <button type="button" className="btn-moss w-full justify-center" onClick={download} disabled={!code} data-testid="key-card-download">
            <Download className="h-4 w-4" /> Download key card
          </button>
        </div>

        {mustAcknowledge ? (
          <div className="border-t border-border/50 pt-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/90">
              <input type="checkbox" className="accent-primary" checked={saved} onChange={(e) => setSaved(e.target.checked)} data-testid="key-card-ack" />
              I&apos;ve saved my key card somewhere safe
            </label>
            <button
              type="button"
              className="btn-moss mt-3 w-full justify-center disabled:opacity-40"
              disabled={!saved}
              onClick={() => onAcknowledged?.()}
              data-testid="key-card-continue"
            >
              <KeyRound className="h-4 w-4" /> Enter my place
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5 text-xs font-light text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-primary" /> Store it in a password manager or somewhere private.
          </div>
        )}
      </div>
    </TalkSheet>
  );
}

async function drawKeyCard(canvas: HTMLCanvasElement, place: { address: string; displayName: string; code: string }) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
  } catch {
    /* fonts optional */
  }
  const W = canvas.width;
  const H = canvas.height;
  const mark = markFor(place.displayName, place.address);

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#12160f");
  bg.addColorStop(1, "#1b241c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Framed "card" border
  ctx.strokeStyle = "rgba(157,176,126,0.35)";
  ctx.lineWidth = 2;
  roundRect(ctx, 28, 28, W - 56, H - 56, 28);
  ctx.stroke();

  const padX = 72;
  ctx.textAlign = "left";

  ctx.fillStyle = "rgba(198,138,74,0.9)";
  ctx.font = "500 22px ui-monospace, monospace";
  ctx.fillText("KODAMA TALK · KEY CARD", padX, 96);

  ctx.fillStyle = "#f3efe6";
  ctx.font = "500 46px 'Fraunces', Georgia, serif";
  ctx.fillText(truncate(ctx, place.displayName, W - padX * 2), padX, 156);

  ctx.fillStyle = "#9db07e";
  ctx.font = "500 28px ui-monospace, monospace";
  ctx.fillText(`${TALK.domain}/${place.address}`, padX, 198);

  // The recovery code — the hero
  ctx.fillStyle = "rgba(243,239,230,0.55)";
  ctx.font = "500 20px ui-monospace, monospace";
  ctx.fillText("RECOVERY KEY", padX, 268);

  ctx.fillStyle = "#f3efe6";
  ctx.font = "500 58px ui-monospace, monospace";
  ctx.fillText(place.code, padX, 330);

  ctx.fillStyle = "rgba(243,239,230,0.7)";
  ctx.font = "300 26px 'Outfit', system-ui, sans-serif";
  wrapText(ctx, "This is the only way back into your place. No account, no password reset. Keep it private.", padX, 396, W - padX * 2 - 180, 38, 3);

  // Place mark, bottom-right
  const size = 120;
  const mx = W - padX - size;
  const my = H - padX - size + 20;
  const g = ctx.createLinearGradient(mx, my, mx + size, my + size);
  g.addColorStop(0, mark.gradient[0]);
  g.addColorStop(1, mark.gradient[1]);
  ctx.fillStyle = g;
  roundRect(ctx, mx, my, size, size, 36);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.font = "500 50px 'Fraunces', Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(mark.initials, mx + size / 2, my + size / 2 + 2);
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
      if (lines >= maxLines) return;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
}
