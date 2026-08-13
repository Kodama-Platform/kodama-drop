import { useState } from "react";
import { Check, EyeOff, KeyRound, Loader2, MapPin, Send, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";

import { TALK } from "@/lib/brand";
import { talkService } from "@/features/talk/services";
import type { DropOrigin, OwnerSession, Place } from "@/features/talk/types";
import { PlaceMark } from "@/features/talk/components/place-mark";
import { DoorHero } from "@/features/talk/components/door-hero";
import { PrivacyStatus } from "@/features/talk/components/privacy-status";
import { Markdown } from "@/features/talk/lib/markdown";
import { TalkEmpty } from "@/features/talk/components/states";
import { getTalkSecurity } from "@/features/talk/security/talk-security-adapter";
import { KeyCardSheet } from "@/features/talk/components/key-card";
import { TalkSheet } from "@/features/talk/components/talk-sheet";

/** The visitor Door — a place identity + a note composer. Reused inline and at /:address. */
export function DoorView({ place, onOwner, showHero = true }: { place: Place; onOwner: () => void; showHero?: boolean }) {
  const [origin, setOrigin] = useState<DropOrigin>("anonymous");
  const [name, setName] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentSubject, setSentSubject] = useState("");

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
    const reset = () => { setSent(false); setBody(""); setSubject(""); setSentSubject(""); };
    return (
      <div className="talk-surface p-8 text-center" data-testid="drop-sent">
        <div className="door-seal mx-auto mb-5" data-testid="drop-sent-seal">
          <Check className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
        </div>
        <h1 className="talk-display text-2xl text-foreground">Tucked under {firstName(place.displayName)}&apos;s door</h1>
        {sentSubject && (
          <p className="mx-auto mt-2 max-w-xs truncate text-sm font-light italic text-muted-foreground" data-testid="drop-sent-subject">
            &ldquo;{sentSubject}&rdquo;
          </p>
        )}
        <p className="mx-auto mt-2 max-w-xs text-sm font-light leading-relaxed text-muted-foreground">
          {firstName(place.displayName)} will find it when they next open their place. No account, no pressure — you&apos;re all done.
        </p>
        <button type="button" className="btn-moss mt-6 w-full justify-center" onClick={reset} data-testid="drop-done">
          <Check className="h-4 w-4" /> Done
        </button>
        <div className="mt-3 flex items-center justify-center gap-3 text-sm">
          <button type="button" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" onClick={reset} data-testid="drop-another">
            Leave another
          </button>
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
        subject: subject.trim() || undefined,
        body: body.trim(),
      });
      setSentSubject(subject.trim());
      setSent(true);
    } catch {
      toast.error("Could not send your Drop");
    } finally {
      setBusy(false);
    }
  };

  const origins: [DropOrigin, string, typeof EyeOff][] = [
    ["anonymous", "anonymously", EyeOff],
    ["named", "with my name", UserRound],
    ["place", "from my place", MapPin],
  ];

  const fn = firstName(place.displayName);

  return (
    <div data-testid="door-view">
      {showHero && (
        <>
          {/* Whose door — the shared hero, in its "place" state */}
          <DoorHero mode="place" place={place} />
          {/* The threshold */}
          <div className="talk-divider mb-5 mt-5" />
        </>
      )}

      {/* Leave your note — the single focus of this screen */}
      <p className="mb-2.5 text-center text-sm font-light text-muted-foreground">
        Leave <span className="text-foreground">{fn}</span> a note
      </p>
      <div className="door-paper px-5 pb-4 pt-3.5">
        <input
          className="door-subject"
          placeholder="Add a subject (optional)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={80}
          data-testid="door-subject"
        />
        <div className="mb-1 mt-2.5 flex items-center justify-end" data-testid="door-writemode">
          <button type="button" className="door-sign !text-[0.82rem]" data-active={!preview} onClick={() => setPreview(false)} data-testid="door-write-tab">Write</button>
          <span className="px-2 text-muted-foreground/30">·</span>
          <button type="button" className="door-sign !text-[0.82rem]" data-active={preview} onClick={() => body.trim() && setPreview(true)} data-testid="door-preview-tab">Preview</button>
        </div>

        {preview ? (
          <div className="min-h-[8.5rem]" data-testid="door-preview">
            <Markdown text={body.trim() || "_Nothing written yet…_"} className="md text-[1.05rem] font-light leading-relaxed text-foreground/90" />
          </div>
        ) : (
          <textarea
            className="door-writing"
            placeholder={`Hi ${fn}, I just wanted to say…`}
            value={body}
            autoFocus={showHero}
            onChange={(e) => setBody(e.target.value)}
            data-testid="door-composer"
          />
        )}

        <div className="mt-1 border-t border-border/40 pt-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5" data-testid="origin-select">
            <span className="text-sm font-light italic text-muted-foreground/80">Signed,</span>
            {origins.map(([o, label, Icon]) => (
              <button
                key={o}
                type="button"
                onClick={() => setOrigin(o)}
                className="door-sign"
                data-active={origin === o}
                data-testid={`origin-${o}`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {label}
              </button>
            ))}
          </div>

          {origin === "named" && (
            <input
              className="door-sign-input mt-3"
              placeholder="your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="drop-name"
            />
          )}
          {origin === "place" && (
            <div className="mt-3 inline-flex items-center">
              <span className="font-mono text-sm text-muted-foreground/70">{TALK.domain}/</span>
              <input
                className="door-sign-input !min-w-[7rem]"
                placeholder="your-address"
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
                data-testid="drop-from-address"
              />
            </div>
          )}
        </div>
      </div>

      <button type="button" className="btn-moss mt-4 w-full justify-center disabled:opacity-50" onClick={send} disabled={busy || !body.trim()} data-testid="door-send">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {busy ? "Leaving it…" : `Leave it at ${fn}'s door`}
      </button>

      <div className="mt-3 flex flex-col items-center gap-2 text-center">
        <p className="text-xs font-light leading-relaxed text-muted-foreground" data-testid="door-consent">
          You can stay anonymous. {fn} decides what becomes a conversation — no account needed.
        </p>
        <PrivacyStatus status={getTalkSecurity().describePrivacy()} />
      </div>

      {/* Owner path — quiet, but easy to find */}
      <div className="mt-6 border-t border-border/50 pt-4 text-center">
        <button type="button" className="talk-pill mx-auto !py-2 text-sm text-muted-foreground hover:!text-foreground" onClick={onOwner} data-testid="this-is-me">
          <KeyRound className="h-3.5 w-3.5" strokeWidth={1.75} /> This is my place — unlock it
        </button>
      </div>
    </div>
  );
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

/** Claim an unclaimed address (in-place). */
export function ClaimView({ address, onClaimed, onCancel }: { address: string; onClaimed: (s: OwnerSession, stay: boolean) => void; onCancel: () => void }) {
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [stay, setStay] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<OwnerSession | null>(null);

  const claim = async () => {
    if (!displayName.trim()) { toast.error("Add a display name for your place"); return; }
    if (password.length < 4) { toast.error("Choose an owner password (4+ characters)"); return; }
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    setBusy(true);
    try {
      await talkService.claimAddress({ address, displayName: displayName.trim(), ownerPassword: password });
      const session = await talkService.unlockOwner(address, password, stay);
      if (session) setPending(session);
    } catch (e) {
      toast.error((e as Error).message === "address_taken" ? "That address was just taken" : "Could not claim");
    } finally { setBusy(false); }
  };

  return (
    <div className="w-full" data-testid="claim-view">
      <div className="talk-surface p-5">
        <p className="talk-section-label">Available</p>
        <h1 className="mt-1.5 talk-display text-2xl text-foreground">Claim <span className="text-primary">/{address}</span></h1>
        <div className="mt-4 space-y-2.5">
          <input className="note-input" placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoFocus data-testid="claim-name" />
          <input className="note-input" type="password" placeholder="Owner password" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="claim-password" />
          <input className="note-input" type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void claim()} data-testid="claim-confirm" />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-foreground/90">
          <input type="checkbox" className="accent-primary" checked={stay} onChange={(e) => setStay(e.target.checked)} data-testid="claim-remember" /> Keep me signed in on this device
        </label>
        <p className="mt-2 text-[0.7rem] font-light leading-relaxed text-muted-foreground/70">No account — your password can&apos;t be reset, so keep it safe.</p>
        <div className="mt-4 flex gap-2">
          <button type="button" className="talk-pill flex-1 justify-center" onClick={onCancel}>Back</button>
          <button type="button" className="btn-moss flex-1 justify-center disabled:opacity-50" onClick={claim} disabled={busy} data-testid="claim-submit">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Claim my Talk address
          </button>
        </div>
      </div>
      <KeyCardSheet
        open={!!pending}
        onOpenChange={() => {}}
        address={address}
        displayName={displayName.trim() || address}
        mustAcknowledge
        onAcknowledged={() => pending && onClaimed(pending, stay)}
      />
    </div>
  );
}

/** Owner unlock, in a modal sheet (no separate route/page). */
export function UnlockSheet({ open, onOpenChange, place, remembered, onUnlocked }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  place: Place;
  remembered: boolean;
  onUnlocked: (s: OwnerSession, stay: boolean) => void;
}) {
  const [password, setPassword] = useState("");
  const [stay, setStay] = useState(true);
  const [busy, setBusy] = useState(false);

  const unlock = async () => {
    setBusy(true);
    try {
      const session = await talkService.unlockOwner(place.address, password, stay);
      if (session) onUnlocked(session, stay);
      else toast.error("That owner password doesn't match");
    } finally { setBusy(false); }
  };

  return (
    <TalkSheet open={open} onOpenChange={onOpenChange} title="Open your Shelf" description={`${TALK.domain}/${place.address}`}>
      <div data-testid="unlock-view">
        {remembered && <p className="mb-2 text-xs font-light text-muted-foreground">This device is remembered. Enter your password to continue.</p>}
        <input className="note-input" type="password" placeholder="Owner password" value={password} autoFocus onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void unlock()} data-testid="unlock-password" />
        <label className="mt-3 flex items-center gap-2 text-sm text-foreground/90">
          <input type="checkbox" className="accent-primary" checked={stay} onChange={(e) => setStay(e.target.checked)} data-testid="unlock-remember" /> Keep me signed in on this device
        </label>
        <p className="mt-1 text-[0.7rem] font-light text-muted-foreground/70">Skip the password next time. Uncheck on a shared computer.</p>
        <button type="button" className="btn-moss mt-5 w-full justify-center disabled:opacity-50" onClick={unlock} disabled={busy || !password} data-testid="unlock-submit">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Unlock
        </button>
      </div>
    </TalkSheet>
  );
}
