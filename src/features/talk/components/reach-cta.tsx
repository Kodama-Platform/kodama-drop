import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Send } from "lucide-react";

import { TALK } from "@/lib/brand";
import { normalizeSlug } from "@/lib/slug";
import { talkService } from "@/features/talk/services";
import { TalkSheet } from "@/features/talk/components/talk-sheet";

function extractAddress(raw: string): string {
  const s = raw.trim();
  const last = s.includes("/") ? (s.split("/").filter(Boolean).pop() ?? "") : s;
  return normalizeSlug(last);
}

/** A simple, focused way to drop a message to someone else's Talk address. */
export function LeaveDropSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "taken" | "empty">("idle");
  const slug = extractAddress(value);

  useEffect(() => {
    if (!open) { setValue(""); setStatus("idle"); }
  }, [open]);

  useEffect(() => {
    if (!slug) { setStatus("idle"); return; }
    setStatus("checking");
    let alive = true;
    const t = setTimeout(async () => {
      const place = await talkService.resolvePlace(slug);
      if (alive) setStatus(place ? "taken" : "empty");
    }, 320);
    return () => { alive = false; clearTimeout(t); };
  }, [slug]);

  const go = () => {
    if (!slug) return;
    onOpenChange(false);
    void navigate({ to: "/$address", params: { address: slug } });
  };

  const hint =
    status === "taken" ? `Open ${TALK.domain}/${slug} to leave your Drop`
    : status === "empty" ? `No one lives at ${TALK.domain}/${slug} yet`
    : "Type the Talk address of the person you want to reach";

  return (
    <TalkSheet open={open} onOpenChange={onOpenChange} title="Leave a Drop" description="Reach anyone by their Talk address — no account needed.">
      <div className="space-y-3" data-testid="leave-drop-sheet">
        <div className="talk-plaque flex items-center">
          <span className="shrink-0 font-mono text-sm text-muted-foreground/70">{TALK.domain}/</span>
          <input
            autoFocus
            className="w-full bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
            placeholder="who?"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            data-testid="leave-drop-input"
          />
          {status === "checking" && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground/60" />}
        </div>
        <p className="text-sm font-light text-muted-foreground" data-testid="leave-drop-hint">{hint}</p>
        <button type="button" className="btn-moss w-full justify-center disabled:opacity-40" onClick={go} disabled={!slug || status === "checking"} data-testid="leave-drop-go">
          <Send className="h-4 w-4" /> Open the door
        </button>
      </div>
    </TalkSheet>
  );
}
