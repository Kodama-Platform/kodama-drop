import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, EyeOff, Info, KeyRound, Loader2, MapPin, Send, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";

import { TALK } from "@/lib/brand";
import { talkService } from "@/features/talk/services";
import type { DropOrigin, OwnerSession, Place } from "@/features/talk/types";
import { markFor } from "@/features/talk/lib/mark";
import { TalkShell } from "@/features/talk/components/talk-shell";
import { PlaceMark } from "@/features/talk/components/place-mark";
import { TalkAddressPlaque } from "@/features/talk/components/talk-address-plaque";
import { PrivacyStatus } from "@/features/talk/components/privacy-status";
import { TalkLoading, TalkEmpty } from "@/features/talk/components/states";
import { getTalkSecurity } from "@/features/talk/security/talk-security-adapter";
import { ShelfScreen } from "@/features/talk/screens/shelf-screen";

type View = "door" | "claim" | "unlock";

export function DoorScreen({ address }: { address: string }) {
  const [place, setPlace] = useState<Place | null | undefined>(undefined);
  const [view, setView] = useState<View>("door");
  const [session, setSession] = useState<OwnerSession | null>(null);
  const [remembered, setRemembered] = useState<OwnerSession | null>(null);

  useEffect(() => {
    let alive = true;
    setPlace(undefined);
    setRemembered(talkService.rememberedSession(address));
    void talkService.resolvePlace(address).then((p) => alive && setPlace(p));
    return () => { alive = false; };
  }, [address]);

  if (session) return <ShelfScreen session={session} onLock={() => { setSession(null); setView("door"); }} />;

  if (place === undefined) return <TalkShell centered><TalkLoading /></TalkShell>;

  const back = (
    <Link to="/" className="talk-pill" data-testid="door-back"><ArrowLeft className="h-4 w-4" /> Home</Link>
  );

  if (place === null) {
    return (
      <TalkShell centered headerAction={back}>
        {view === "claim" ? (
          <ClaimView address={address} onClaimed={setSession} onCancel={() => setView("door")} />
        ) : (
          <div className="w-full max-w-md px-5 text-center">
            <div className="talk-surface p-7">
              <div className="mx-auto mb-4 w-fit"><PlaceMark mark={markFor(address, address)} size={64} /></div>
              <h1 className="talk-display text-2xl text-foreground" data-testid="door-place-name">{address}</h1>
              <div className="mt-2 flex justify-center"><TalkAddressPlaque address={address} /></div>
              <p className="mt-4 text-sm font-light leading-relaxed text-muted-foreground">
                This place is unclaimed. Make <span className="text-foreground">{TALK.domain}/{address}</span> your own — one address where anyone can reach you.
              </p>
              <button type="button" className="btn-moss mt-6 w-full justify-center" onClick={() => setView("claim")} data-testid="claim-this-btn">
                <Sparkles className="h-4 w-4" /> Claim this address
              </button>
            </div>
          </div>
        )}
      </TalkShell>
    );
  }

  // Claimed place → visitor Door + unlock
  return (
    <TalkShell centered headerAction={back}>
      {view === "unlock" ? (
        <UnlockView place={place} remembered={remembered} onUnlocked={setSession} onCancel={() => setView("door")} />
      ) : (
        <div className="w-full max-w-md px-5">
          {remembered && (
            <button type="button" className="talk-pill mb-3 w-full justify-center !border-primary/40 !bg-primary/6" onClick={() => setView("unlock")} data-testid="resume-owner">
              <KeyRound className="h-4 w-4" /> Welcome back — open your Shelf
            </button>
          )}
          <DoorView place={place} onOwner={() => setView("unlock")} />
        </div>
      )}
    </TalkShell>
  );
}

function DoorView({ place, onOwner }: { place: Place; onOwner: () => void }) {
  const [origin, setOrigin] = useState<DropOrigin>("anonymous");
  const [name, setName] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  if (place.dropReceiving === "closed") {
    return (
      <div className="talk-surface p-7 text-center" data-testid="door-closed">
        <PlaceMark mark={place.mark} size={60} className="mx-auto mb-4" />
        <h1 className="talk-display text-2xl text-foreground">{place.displayName}</h1>
        <TalkEmpty title="Not receiving Drops" body="This place is quiet right now and isn't accepting new messages." />
      </div>
    );
  }

  if (sent) {
    return (
      <div className="talk-surface p-8 text-center" data-testid="drop-sent">
        <div className="mx-auto mb-4 w-fit animate-pop"><PlaceMark mark={place.mark} size={60} /></div>
        <h1 className="talk-display text-2xl text-foreground">Your Drop settled</h1>
        <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">
          {place.displayName} will decide what becomes a conversation. Want your own place too?
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link to="/" className="btn-moss justify-center">Claim your Talk address</Link>
          <button type="button" className="talk-pill justify-center" onClick={() => { setSent(false); setBody(""); }}>Send another</button>
        </div>
      </div>
    );
  }

  const send = async () => {
    if (!body.trim()) return;
    setBusy(true);
    try {
      await getTalkSecurity().sealForPlace(body);
      await talkService.sendDrop({
        toAddress: place.address,
        origin,
        fromLabel: origin === "named" ? name || "guest" : origin === "place" ? fromAddress : "someone",
        fromAddress: origin === "place" ? fromAddress.trim() || undefined : undefined,
        body: body.trim(),
      });
      setSent(true);
    } catch {
      toast.error("Could not send your Drop");
    } finally {
      setBusy(false);
    }
  };

  const origins: [DropOrigin, string, typeof EyeOff][] = [
    ["anonymous", "Anonymously", EyeOff],
    ["named", "With a name", UserRound],
    ["place", "From my place", MapPin],
  ];

  return (
    <div className="talk-surface p-6 sm:p-7" data-testid="door-view">
      {/* Quiet identity — a place, not a profile */}
      <div className="flex items-center gap-2.5">
        <PlaceMark mark={place.mark} size={38} />
        <div className="min-w-0">
          <p className="talk-display truncate text-base leading-tight text-foreground" data-testid="door-place-name">{place.displayName}</p>
          <TalkAddressPlaque address={place.address} className="!py-0.5 !px-2 !text-[0.78rem]" />
        </div>
      </div>

      {/* The invitation is the hero */}
      <h1 className="mt-5 talk-display text-3xl text-foreground">
        Drop {firstName(place.displayName)} a message
      </h1>
      {place.tagline && (
        <p className="mt-1.5 text-sm font-light leading-relaxed text-muted-foreground">{place.tagline}</p>
      )}

      {place.doorNote && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/[0.06] px-3 py-2" data-testid="door-note">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
          <span className="text-sm font-light leading-relaxed text-foreground/85">{place.doorNote}</span>
        </div>
      )}

      <textarea
        className="talk-composer-field mt-4 rounded-xl border border-border/60"
        placeholder={`Say hello to ${firstName(place.displayName)}…`}
        value={body}
        rows={3}
        autoFocus
        onChange={(e) => setBody(e.target.value)}
        data-testid="door-composer"
      />

      <div className="mt-3 flex flex-wrap items-center gap-1.5" data-testid="origin-select">
        <span className="mr-1 font-mono text-[0.66rem] uppercase tracking-wider text-muted-foreground/60">Send</span>
        {origins.map(([o, label, Icon]) => (
          <button key={o} type="button" onClick={() => setOrigin(o)} className={`talk-pill !py-1.5 text-sm ${origin === o ? "!border-primary/50 !bg-primary/10 !text-foreground" : ""}`} data-testid={`origin-${o}`}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {origin === "named" && (
        <input className="note-input mt-3" placeholder="How should they know you?" value={name} onChange={(e) => setName(e.target.value)} data-testid="drop-name" />
      )}
      {origin === "place" && (
        <div className="mt-3 flex items-center rounded-xl border border-border/70 bg-background/50 px-3">
          <span className="font-mono text-sm text-muted-foreground/70">{TALK.domain}/</span>
          <input className="w-full bg-transparent py-2.5 font-mono text-sm outline-none" placeholder="your-address" value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} data-testid="drop-from-address" />
        </div>
      )}

      <button type="button" className="btn-moss mt-4 w-full justify-center disabled:opacity-50" onClick={send} disabled={busy || !body.trim()} data-testid="door-send">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Drop it
      </button>

      <p className="mt-3 text-center text-xs font-light leading-relaxed text-muted-foreground" data-testid="door-consent">
        {firstName(place.displayName)} decides what becomes a conversation. You can stay anonymous — no account needed.
      </p>

      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
        <PrivacyStatus status={getTalkSecurity().describePrivacy()} />
        <button type="button" className="font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground/70 underline-offset-4 hover:text-foreground hover:underline" onClick={onOwner} data-testid="this-is-me">
          This is me →
        </button>
      </div>
    </div>
  );
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

function ClaimView({ address, onClaimed, onCancel }: { address: string; onClaimed: (s: OwnerSession) => void; onCancel: () => void }) {
  const [displayName, setDisplayName] = useState("");
  const [tagline, setTagline] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const claim = async () => {
    if (!displayName.trim() || password.length < 4) { toast.error("Add a name and a password (4+ chars)"); return; }
    setBusy(true);
    try {
      await talkService.claimAddress({ address, displayName: displayName.trim(), tagline: tagline.trim() || undefined, ownerPassword: password });
      const session = await talkService.unlockOwner(address, password, true);
      if (session) onClaimed(session);
    } catch (e) {
      toast.error((e as Error).message === "address_taken" ? "That address was just taken" : "Could not claim");
    } finally { setBusy(false); }
  };

  return (
    <div className="w-full max-w-md px-5" data-testid="claim-view">
      <div className="talk-surface p-7">
        <p className="talk-section-label">New place</p>
        <h1 className="mt-2 talk-display text-2xl text-foreground">Claim <span className="text-primary">/{address}</span></h1>
        <p className="mt-2 text-sm font-light text-muted-foreground">Your owner password stays on this device. There's no account, and it can't be reset.</p>
        <div className="mt-5 space-y-3">
          <input className="note-input" placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoFocus data-testid="claim-name" />
          <input className="note-input" placeholder="Tagline (optional)" value={tagline} onChange={(e) => setTagline(e.target.value)} data-testid="claim-tagline" />
          <input className="note-input" type="password" placeholder="Owner password" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="claim-password" />
        </div>
        <div className="mt-5 flex gap-2">
          <button type="button" className="talk-pill flex-1 justify-center" onClick={onCancel}>Back</button>
          <button type="button" className="btn-moss flex-1 justify-center disabled:opacity-50" onClick={claim} disabled={busy} data-testid="claim-submit">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Claim & open
          </button>
        </div>
      </div>
    </div>
  );
}

function UnlockView({ place, remembered, onUnlocked, onCancel }: { place: Place; remembered: OwnerSession | null; onUnlocked: (s: OwnerSession) => void; onCancel: () => void }) {
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  const unlock = async () => {
    setBusy(true);
    try {
      const session = await talkService.unlockOwner(place.address, password, remember);
      if (session) onUnlocked(session);
      else toast.error("That owner password doesn't match");
    } finally { setBusy(false); }
  };

  return (
    <div className="w-full max-w-sm px-5" data-testid="unlock-view">
      <div className="talk-surface p-7 text-center">
        <div className="mx-auto mb-4 w-fit"><PlaceMark mark={place.mark} size={56} /></div>
        <h1 className="talk-display text-xl text-foreground">Open your Shelf</h1>
        <p className="mt-1 font-mono text-[0.72rem] text-primary">{TALK.domain}/{place.address}</p>
        {remembered && <p className="mt-2 text-xs font-light text-muted-foreground">This device is remembered. Enter your password to continue.</p>}
        <input className="note-input mt-5" type="password" placeholder="Owner password" value={password} autoFocus onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void unlock()} data-testid="unlock-password" />
        <label className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" className="accent-primary" checked={remember} onChange={(e) => setRemember(e.target.checked)} data-testid="unlock-remember" /> Remember this device
        </label>
        <div className="mt-5 flex gap-2">
          <button type="button" className="talk-pill flex-1 justify-center" onClick={onCancel}>Back</button>
          <button type="button" className="btn-moss flex-1 justify-center disabled:opacity-50" onClick={unlock} disabled={busy || !password} data-testid="unlock-submit">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Unlock
          </button>
        </div>
      </div>
    </div>
  );
}
