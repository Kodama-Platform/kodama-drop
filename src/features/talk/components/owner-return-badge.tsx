import { Link, useLocation } from "@tanstack/react-router";
import { talkService } from "@/features/talk/services";
import { markFor } from "@/features/talk/lib/mark";
import { PlaceMark } from "@/features/talk/components/place-mark";
import { TALK } from "@/lib/brand";

/**
 * When you're opted in to a Talk, the header shows a quiet badge back to it —
 * so leaving for the landing page never strands you away from your place.
 * Hidden while you're already viewing your own Talk.
 */
export function OwnerReturnBadge() {
  const owner = talkService.lastOpenedTalk();
  const pathname = useLocation({ select: (l) => l.pathname });
  if (!owner) return null;
  const base = `/${owner.address}`;
  if (pathname === base || pathname.startsWith(`${base}/`)) return null;

  return (
    <Link
      to="/$address"
      params={{ address: owner.address }}
      className="group inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 py-1 pl-1 pr-1.5 transition-colors hover:border-primary/45 hover:bg-primary/12 sm:pr-3"
      data-testid="owner-return"
      title={`Back to your Talk — ${TALK.domain}/${owner.address}`}
    >
      <PlaceMark mark={markFor(owner.displayName, owner.address)} size={26} />
      <span className="hidden flex-col leading-tight sm:flex">
        <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-primary">Opted in</span>
        <span className="font-mono text-[0.72rem] text-foreground">{TALK.domain}/{owner.address}</span>
      </span>
    </Link>
  );
}
