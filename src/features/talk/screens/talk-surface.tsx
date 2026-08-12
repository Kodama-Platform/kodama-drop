import { useEffect, useState } from "react";
import { KeyRound, Loader2, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { TALK } from "@/lib/brand";
import { normalizeSlug } from "@/lib/slug";
import { talkService } from "@/features/talk/services";
import type { OwnerSession, Place } from "@/features/talk/types";
import { markFor } from "@/features/talk/lib/mark";
import { TalkShell } from "@/features/talk/components/talk-shell";
import { PlaceMark } from "@/features/talk/components/place-mark";
import { TalkAddressPlaque } from "@/features/talk/components/talk-address-plaque";
import { TalkLoading } from "@/features/talk/components/states";
import { ShelfScreen } from "@/features/talk/screens/shelf-screen";
import { DoorView, ClaimView, UnlockSheet } from "@/features/talk/screens/door-screen";

type Availability = "idle" | "checking" | "available" | "taken" | "yours" | "reserved";

const RESERVED = new Set([
  "admin", "talk", "kodama", "www", "api", "help", "support", "settings",
  "about", "terms", "privacy", "root", "system", "new", "login", "signup",
]);

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Accept a bare name, a full Talk URL, or pasted URL variations → place name. */
function extractAddress(raw: string): string {
  const s = raw.trim();
  const last = s.includes("/") ? (s.split("/").filter(Boolean).pop() ?? "") : s;
  return normalizeSlug(last);
}

/**
 * One dynamic address field IS the entire entry flow. Root (`/`) resolves the
 * typed address LIVE (debounced) and morphs in place — checking / claimed
 * (Drop) / available (Claim) / your Talk / reserved — with no route change.
 * Direct links (`/:address`) hydrate the same components.
 */
export function TalkSurface({ initialAddress }: { initialAddress?: string }) {
  const [input, setInput] = useState(initialAddress ?? "");
  const [address, setAddress] = useState<string | null>(initialAddress ?? null);
  const [place, setPlace] = useState<Place | null | undefined>(undefined);
  const [session, setSession] = useState<OwnerSession | null>(() =>
    initialAddress ? talkService.activeSession(initialAddress) : null,
  );
  const [remembered, setRemembered] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);

  // Live landing resolution
  const [status, setStatus] = useState<Availability>("idle");
  const [preview, setPreview] = useState<Place | null>(null);
  const debouncedInput = useDebounced(input, 400);

  // Resolve a committed address (direct links / explicit open)
  useEffect(() => {
    if (!address) { setPlace(undefined); return; }
    let alive = true;
    setPlace(undefined);
    setClaiming(false);
    setUnlockOpen(false);
    setSession(talkService.activeSession(address));
    setRemembered(!!talkService.rememberedSession(address));
    void talkService.resolvePlace(address).then((p) => alive && setPlace(p));
    return () => { alive = false; };
  }, [address]);

  // Instant "checking" feedback on the landing as the user types
  useEffect(() => {
    if (address !== null) return;
    const slug = extractAddress(input);
    setStatus(!slug ? "idle" : RESERVED.has(slug) ? "reserved" : "checking");
  }, [input, address]);

  // Debounced availability lookup; stale responses are ignored via `alive`
  useEffect(() => {
    if (address !== null) return;
    const slug = extractAddress(debouncedInput);
    if (!slug) { setPreview(null); setStatus("idle"); return; }
    if (RESERVED.has(slug)) { setPreview(null); setStatus("reserved"); return; }
    let alive = true;
    void talkService.resolvePlace(slug).then((p) => {
      if (!alive) return;
      setPreview(p ?? null);
      if (!p) { setStatus("available"); return; }
      const mine = talkService.activeSession(slug) ?? talkService.rememberedSession(slug);
      setStatus(mine ? "yours" : "taken");
    });
    return () => { alive = false; };
  }, [debouncedInput, address]);

  const open = (raw?: string) => {
    const slug = extractAddress(raw ?? input);
    if (!slug) return;
    setInput(slug);
    setAddress(slug); // in place — deliberately no navigation
  };
  const openShelf = (s: OwnerSession, persist = false) => {
    talkService.beginSession(s, persist);
    setSession(s);
    setUnlockOpen(false);
    setInput(s.address);
    setAddress(s.address);
  };
  const openMyTalk = (slug: string) => {
    const s = talkService.activeSession(slug);
    if (s) { openShelf(s); return; }
    setUnlockOpen(true); // remembered but locked → unlock sheet
  };
  const lock = () => {
    if (address) talkService.endSession(address);
    setSession(null);
  };
  const tryAnother = () => { setInput(""); setAddress(null); setPlace(undefined); };

  const bar = <AddressBar value={input} onChange={setInput} onOpen={() => open()} />;

  // ── Owner Shelf (private) ──
  if (session && address) {
    return <ShelfScreen session={session} onLock={lock} addressBar={bar} />;
  }

  // ── No committed address: the dynamic address-field landing ──
  if (address === null) {
    const slug = extractAddress(input);
    const revealing = status === "taken" || status === "available" || status === "yours";
    return (
      <TalkShell centered>
        <section className="w-full max-w-md px-5 pb-16">
          <div className="animate-rise flex flex-col items-center text-center">
            <PlaceMark
              mark={preview && (status === "taken" || status === "yours") ? preview.mark : markFor(slug || "?", slug)}
              size={72}
              className={cn("transition-all duration-500", !slug && "opacity-35 grayscale")}
            />
            <h1 className="mt-3.5 talk-display text-3xl text-foreground sm:text-4xl" data-testid="landing-title">
              {preview && (status === "taken" || status === "yours") ? preview.displayName : slug ? slug : "Kodama Talk"}
            </h1>
            {preview && status === "taken" && preview.tagline && (
              <p className="mt-2 max-w-xs text-sm font-light italic text-muted-foreground">&ldquo;{preview.tagline}&rdquo;</p>
            )}
            {status === "idle" && (
              <p className="mt-2 text-sm font-light text-muted-foreground/70" data-testid="landing-purpose">
                Type a Talk address to reach someone.
              </p>
            )}

            {/* The one dynamic field */}
            <div className="mt-5 w-full">
              <TalkAddressPlaque
                editable
                value={input}
                onChange={setInput}
                onSubmit={() => open()}
                placeholder="your-name"
                className="!w-full !py-2.5 !text-base"
              />
            </div>

            {/* Status — fixed height so the layout never jumps */}
            <div className="mt-3 flex h-5 items-center justify-center">
              <StatusChip status={status} />
            </div>
          </div>

          {/* Reserved / invalid */}
          {status === "reserved" && (
            <p className="mt-3 text-center text-sm font-light text-muted-foreground" data-testid="reserved-state">
              This address cannot be claimed. Try another name.
            </p>
          )}

          {/* Live reveal */}
          {revealing && preview !== undefined && (
            <div key={`${status}:${slug}`} className="animate-rise mt-6" data-testid="landing-reveal">
              {status === "yours" && preview ? (
                <button type="button" className="btn-moss w-full justify-center" onClick={() => openMyTalk(slug)} data-testid="open-my-talk">
                  <KeyRound className="h-4 w-4" /> Open my Talk
                </button>
              ) : status === "taken" && preview ? (
                <DoorView place={preview} showHero={false} onOwner={() => setUnlockOpen(true)} />
              ) : (
                <ClaimView address={slug} onClaimed={(s) => openShelf(s, true)} onCancel={() => setInput("")} />
              )}
            </div>
          )}

          {(status === "taken" || status === "yours") && preview && (
            <UnlockSheet
              open={unlockOpen}
              onOpenChange={setUnlockOpen}
              place={preview}
              remembered={!!talkService.rememberedSession(preview.address)}
              onUnlocked={openShelf}
            />
          )}
        </section>
      </TalkShell>
    );
  }

  // ── Resolving a committed address ──
  if (place === undefined) {
    return <TalkShell centered><TalkLoading /></TalkShell>;
  }

  // ── Unclaimed / not available (committed) ──
  if (place === null) {
    return (
      <TalkShell centered>
        <div className="w-full max-w-md px-5">
          {bar}
          {claiming ? (
            <ClaimView address={address} onClaimed={(s) => openShelf(s, true)} onCancel={() => setClaiming(false)} />
          ) : (
            <div className="talk-surface p-7 text-center" data-testid="address-unavailable">
              <div className="mx-auto mb-4 w-fit"><PlaceMark mark={markFor(address, address)} size={60} /></div>
              <h1 className="talk-display text-2xl text-foreground" data-testid="door-place-name">{address}</h1>
              <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">
                <span className="text-foreground">{TALK.domain}/{address}</span> — this Talk address is available.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <button type="button" className="btn-moss justify-center" onClick={() => setClaiming(true)} data-testid="claim-this-btn">
                  <Sparkles className="h-4 w-4" /> Claim this address
                </button>
                <button type="button" className="talk-pill justify-center" onClick={tryAnother} data-testid="try-another">
                  Try another address
                </button>
              </div>
            </div>
          )}
        </div>
      </TalkShell>
    );
  }

  // ── Claimed place → visitor Door (+ unlock in a sheet) ──
  return (
    <TalkShell centered>
      <div className="w-full max-w-md px-5">
        {bar}
        {remembered && (
          <button type="button" className="talk-pill mb-3 w-full justify-center !border-primary/40 !bg-primary/6" onClick={() => setUnlockOpen(true)} data-testid="resume-owner">
            <KeyRound className="h-4 w-4" /> Welcome back — open your Shelf
          </button>
        )}
        <DoorView place={place} onOwner={() => setUnlockOpen(true)} />
      </div>
      <UnlockSheet open={unlockOpen} onOpenChange={setUnlockOpen} place={place} remembered={remembered} onUnlocked={openShelf} />
    </TalkShell>
  );
}

function StatusChip({ status }: { status: Availability }) {
  if (status === "idle") return null;
  const map = {
    checking: { cls: "text-muted-foreground", icon: <Loader2 className="h-3 w-3 animate-spin" />, text: "Checking address…" },
    available: { cls: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", text: "Available" },
    taken: { cls: "text-primary", dot: "bg-primary", text: "Claimed" },
    yours: { cls: "text-clay", dot: "bg-clay", text: "Your Talk" },
    reserved: { cls: "text-muted-foreground/70", dot: "bg-muted-foreground/50", text: "Unavailable" },
  }[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.16em]", map.cls)} data-testid="availability-status" data-status={status}>
      {"icon" in map && map.icon ? map.icon : <span className={cn("h-1.5 w-1.5 rounded-full", (map as { dot: string }).dot)} aria-hidden="true" />}
      {map.text}
    </span>
  );
}

function AddressBar({ value, onChange, onOpen }: { value: string; onChange: (v: string) => void; onOpen: () => void }) {
  return (
    <div className="mb-5 flex items-center gap-2" data-testid="address-bar">
      <TalkAddressPlaque editable value={value} onChange={onChange} onSubmit={onOpen} placeholder="open an address" className="!flex-1 !py-2 !text-sm" />
      <button type="button" className="btn-moss shrink-0 !px-4 disabled:opacity-40" onClick={onOpen} disabled={!extractAddress(value)} data-testid="address-open">
        Open
      </button>
    </div>
  );
}
