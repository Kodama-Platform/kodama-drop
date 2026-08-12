import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { KeyRound, Loader2, Send, Sparkles } from "lucide-react";

import { TALK } from "@/lib/brand";
import { normalizeSlug } from "@/lib/slug";
import { talkService } from "@/features/talk/services";
import type { Place } from "@/features/talk/types";
import { TalkSheet } from "@/features/talk/components/talk-sheet";

const RESERVED = new Set(["www", "app", "api", "admin", "help", "about", "talk", "kodama", "settings", "login", "signup"]);

function extractAddress(raw: string): string {
  const s = raw.trim();
  const last = s.includes("/") ? (s.split("/").filter(Boolean).pop() ?? "") : s;
  return normalizeSlug(last);
}

type Mode = "drop" | "claim";

/** A quiet footer on conversation surfaces: leave a Drop, or claim a new Talk address. */
export function ReachFooter({ className }: { className?: string }) {
  const [mode, setMode] = useState<Mode | null>(null);
  return (
    <div className={`mt-8 flex flex-col items-center gap-2 border-t border-border/40 pt-5 text-center ${className ?? ""}`} data-testid="reach-footer">
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.24em] text-muted-foreground/55">Kodama Talk</p>
      <div className="flex items-center gap-3 text-sm">
        <button type="button" className="inline-flex items-center gap-1.5 text-primary underline-offset-4 transition-opacity hover:underline" onClick={() => setMode("drop")} data-testid="cta-leave-drop">
          <Send className="h-3.5 w-3.5" strokeWidth={1.75} /> Leave a Drop
        </button>
        <span className="text-muted-foreground/30">·</span>
        <button type="button" className="inline-flex items-center gap-1.5 text-primary underline-offset-4 transition-opacity hover:underline" onClick={() => setMode("claim")} data-testid="cta-claim-address">
          <KeyRound className="h-3.5 w-3.5" strokeWidth={1.75} /> Claim a Talk address
        </button>
      </div>
      <ReachSheet mode={mode} onClose={() => setMode(null)} />
    </div>
  );
}

function ReachSheet({ mode, onClose }: { mode: Mode | null; onClose: () => void }) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken" | "reserved">("idle");
  const slug = extractAddress(value);

  useEffect(() => {
    if (!mode) { setValue(""); setStatus("idle"); }
  }, [mode]);

  useEffect(() => {
    if (!slug) { setStatus("idle"); return; }
    if (RESERVED.has(slug)) { setStatus("reserved"); return; }
    setStatus("checking");
    let alive = true;
    const t = setTimeout(async () => {
      const place = await talkService.resolvePlace(slug);
      if (alive) setStatus(place ? "taken" : "available");
    }, 320);
    return () => { alive = false; clearTimeout(t); };
  }, [slug]);

  const go = () => {
    if (!slug || status === "reserved") return;
    onClose();
    void navigate({ to: "/$address", params: { address: slug } });
  };

  const hint = useMemo(() => {
    if (mode === "claim") {
      if (status === "available") return { text: `${TALK.domain}/${slug} is free — claim it as yours`, ok: true };
      if (status === "taken") return { text: `${TALK.domain}/${slug} is already someone's place — you can leave them a Drop`, ok: true };
      if (status === "reserved") return { text: "That name is reserved — try another", ok: false };
      return { text: "Pick a short, memorable name for your Talk address", ok: false };
    }
    if (status === "taken") return { text: `Leave a Drop at ${TALK.domain}/${slug}`, ok: true };
    if (status === "available") return { text: `No one lives at ${TALK.domain}/${slug} yet — you could claim it`, ok: true };
    if (status === "reserved") return { text: "That name is reserved", ok: false };
    return { text: "Type any Talk address to reach someone", ok: false };
  }, [mode, status, slug]);

  const cta = mode === "claim"
    ? (status === "available" ? "Claim this address" : status === "taken" ? "Leave a Drop instead" : "Continue")
    : "Open the door";

  return (
    <TalkSheet
      open={!!mode}
      onOpenChange={(o) => !o && onClose()}
      title={mode === "claim" ? "Claim a Talk address" : "Leave a Drop"}
      description={mode === "claim" ? "Your own address — no account, no email. Just a name people can reach." : "Reach anyone by their Talk address."}
    >
      <div className="space-y-3" data-testid="reach-sheet">
        <div className="talk-plaque flex items-center">
          <span className="shrink-0 font-mono text-sm text-muted-foreground/70">{TALK.domain}/</span>
          <input
            autoFocus
            className="w-full bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
            placeholder={mode === "claim" ? "your-name" : "who?"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            data-testid="reach-input"
          />
          {status === "checking" && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground/60" />}
        </div>
        <p className={`text-sm font-light ${hint.ok ? "text-foreground/80" : "text-muted-foreground"}`} data-testid="reach-hint">{hint.text}</p>
        <button type="button" className="btn-moss w-full justify-center disabled:opacity-40" onClick={go} disabled={!slug || status === "reserved" || status === "checking"} data-testid="reach-go">
          {mode === "claim" ? <Sparkles className="h-4 w-4" /> : <Send className="h-4 w-4" />} {cta}
        </button>
      </div>
    </TalkSheet>
  );
}
