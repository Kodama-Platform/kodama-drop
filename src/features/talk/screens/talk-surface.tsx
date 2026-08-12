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

type Availability = "idle" | "checking" | "available" | "taken";

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/**
 * One continuous communication surface. Root (`/`) opens address-first and
 * resolves the typed address LIVE (debounced) — showing fetching / available /
 * owned — then reveals the Drop form (owned) or Claim form (available) in place
 * with no route change. Direct links (`/:address`) hydrate the same components.
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
  const debouncedInput = useDebounced(input, 350);

  // Resolve committed address (direct links / explicit open)
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
    setStatus(normalizeSlug(input) ? "checking" : "idle");
  }, [input, address]);

  // Debounced availability lookup on the landing
  useEffect(() => {
    if (address !== null) return;
    const slug = normalizeSlug(debouncedInput);
    if (!slug) { setPreview(null); setStatus("idle"); return; }
    let alive = true;
    void talkService.resolvePlace(slug).then((p) => {
      if (!alive) return;
      setPreview(p ?? null);
      setStatus(p ? "taken" : "available");
    });
    return () => { alive = false; };
  }, [debouncedInput, address]);

  const open = (raw?: string) => {
    const slug = normalizeSlug(raw ?? input);
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

  // ── No committed address: live address-first landing ──
  if (address === null) {
    const slug = normalizeSlug(input);
    const revealing = status === "taken" || status === "available";
    return (
      <TalkShell centered>
        <section className="w-full max-w-md px-5 pb-16">
          <div className="animate-rise flex flex-col items-center text-center">
            <span className="mb-3 font-mono text-[0.6rem] uppercase tracking-[0.3em] text-clay">{TALK.domain}</span>
            <PlaceMark
              mark={status === "taken" && preview ? preview.mark : markFor(slug || "?", slug)}
              size={72}
              className={cn("transition-all duration-500", !slug && "opacity-35 grayscale")}
            />
            <h1 className="mt-3.5 talk-display text-3xl text-foreground sm:text-4xl" data-testid="landing-title">
              {status === "taken" && preview ? preview.displayName : slug ? slug : "Your own place for messages."}
            </h1>
            {status === "taken" && preview?.tagline && (
              <p className="mt-2 max-w-xs text-sm font-light italic text-muted-foreground">&ldquo;{preview.tagline}&rdquo;</p>
            )}
            {!revealing && (
              <p className="mt-2 text-sm font-light italic text-muted-foreground/70" data-testid="landing-purpose">
                Find or claim a place for messages.
              </p>
            )}

            {/* Address field */}
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

            <AvailabilityStatus status={status} name={preview ? firstNameOf(preview.displayName) : undefined} />
          </div>

          {/* Live reveal — Drop form (owned) or Claim form (available) */}
          {revealing && (
            <div key={`${status}:${slug}`} className="animate-rise mt-6" data-testid="landing-reveal">
              {status === "taken" && preview ? (
                <>
                  <DoorView place={preview} showHero={false} onOwner={() => setUnlockOpen(true)} />
                  <UnlockSheet
                    open={unlockOpen}
                    onOpenChange={setUnlockOpen}
                    place={preview}
                    remembered={!!talkService.rememberedSession(preview.address)}
                    onUnlocked={openShelf}
                  />
                </>
              ) : (
                <ClaimView address={slug} onClaimed={(s) => openShelf(s, true)} onCancel={() => setInput("")} />
              )}
            </div>
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
                <span className="text-foreground">{TALK.domain}/{address}</span> — this Talk address isn&apos;t available yet.
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

function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

function AvailabilityStatus({ status, name }: { status: Availability; name?: string }) {
  if (status === "idle") return null;
  const map = {
    checking: { dot: "bg-muted-foreground/50 animate-pulse", cls: "text-muted-foreground", icon: <Loader2 className="h-3 w-3 animate-spin" />, text: "Checking availability…" },
    available: { dot: "bg-emerald-500", cls: "text-emerald-600 dark:text-emerald-400", icon: <Sparkles className="h-3 w-3" />, text: "Available — claim it below" },
    taken: { dot: "bg-primary", cls: "text-primary", icon: <KeyRound className="h-3 w-3" />, text: `${name ?? "This place"} is here — leave a note below` },
  }[status];
  return (
    <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-light" data-testid="availability-status" data-status={status}>
      <span className={cn("h-2 w-2 rounded-full", map.dot)} aria-hidden="true" />
      <span className={cn("inline-flex items-center gap-1.5", map.cls)}>{map.icon} {map.text}</span>
    </div>
  );
}

function AddressBar({ value, onChange, onOpen }: { value: string; onChange: (v: string) => void; onOpen: () => void }) {
  return (
    <div className="mb-5 flex items-center gap-2" data-testid="address-bar">
      <TalkAddressPlaque editable value={value} onChange={onChange} onSubmit={onOpen} placeholder="open an address" className="!flex-1 !py-2 !text-sm" />
      <button type="button" className="btn-moss shrink-0 !px-4 disabled:opacity-40" onClick={onOpen} disabled={!normalizeSlug(value)} data-testid="address-open">
        Open
      </button>
    </div>
  );
}
