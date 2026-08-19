import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { talkService } from "@/features/talk/services";
import { markFor } from "@/features/talk/lib/mark";
import { PlaceMark } from "@/features/talk/components/place-mark";
import { TALK } from "@/lib/brand";

/**
 * When you're opted in to a Talk, the header shows a quiet badge back to it —
 * so leaving for the landing page never strands you away from your place.
 * A small lock lets you sign out of this (possibly shared) device.
 * Hidden while you're already viewing your own Talk.
 */
export function OwnerReturnBadge() {
  const owner = talkService.lastOpenedTalk();
  const pathname = useLocation({ select: (l) => l.pathname });
  const [confirm, setConfirm] = useState(false);
  const resetRef = useRef<number | undefined>(undefined);

  // A missed confirm shouldn't linger — quietly step back after a moment.
  useEffect(() => {
    if (!confirm) return;
    resetRef.current = window.setTimeout(() => setConfirm(false), 3200);
    return () => window.clearTimeout(resetRef.current);
  }, [confirm]);

  if (!owner) return null;
  const base = `/${owner.address}`;
  if (pathname === base || pathname.startsWith(`${base}/`)) return null;

  const lockDevice = () => {
    talkService.forgetDevice(owner.address);
    // Hard reset so no session lingers on a shared device.
    window.location.assign("/");
  };

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/8 py-1 pl-1 pr-1"
      data-testid="owner-return-wrap"
    >
      <Link
        to="/$address"
        params={{ address: owner.address }}
        className="group inline-flex items-center gap-2"
        data-testid="owner-return"
        title={`Back to your Talk — ${TALK.domain}/${owner.address}`}
      >
        <PlaceMark mark={markFor(owner.displayName, owner.address)} size={26} />
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-primary">Opted in</span>
          <span className="font-mono text-[0.72rem] text-foreground">{TALK.domain}/{owner.address}</span>
        </span>
      </Link>
      <button
        type="button"
        onClick={() => (confirm ? lockDevice() : setConfirm(true))}
        className={
          confirm
            ? "ml-0.5 inline-flex items-center gap-1.5 rounded-full bg-ember/12 py-1 pl-2.5 pr-3 text-ember transition-colors hover:bg-ember/18"
            : "ml-0.5 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-primary/12 hover:text-primary"
        }
        aria-label={confirm ? "Tap again to lock this device" : "Lock this device"}
        title={confirm ? "Tap again to lock" : "Lock this device"}
        data-testid="lock-device"
      >
        <Lock className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
        {confirm && (
          <span className="font-mono text-[0.66rem] tracking-[0.02em]" data-testid="lock-device-confirm">
            Sure? Tap to lock
          </span>
        )}
      </button>
    </div>
  );
}
