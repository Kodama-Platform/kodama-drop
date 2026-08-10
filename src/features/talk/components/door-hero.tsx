import { ArrowRight, Info } from "lucide-react";

import { TALK } from "@/lib/brand";
import type { Place } from "@/features/talk/types";
import { markFor } from "@/features/talk/lib/mark";
import { PlaceMark } from "@/features/talk/components/place-mark";
import { TalkAddressPlaque } from "@/features/talk/components/talk-address-plaque";

type EntryProps = {
  mode: "entry";
  draft: string;
  slug: string;
  onDraft: (v: string) => void;
  onOpen: () => void;
};
type PlaceProps = { mode: "place"; place: Place };

/**
 * The one hero shared by the landing (`/`) and every door (`/:address`).
 * Same skeleton — eyebrow → place-mark → name → address plaque → extras —
 * morphing between an empty doorway (entry) and a claimed place (place).
 */
export function DoorHero(props: EntryProps | PlaceProps) {
  if (props.mode === "place") {
    const { place } = props;
    return (
      <div className="flex flex-col items-center text-center" data-testid="door-hero">
        <span className="mb-3 font-mono text-[0.6rem] uppercase tracking-[0.3em] text-clay">You&apos;re knocking at</span>
        <PlaceMark mark={place.mark} size={76} />
        <h1 className="mt-3.5 talk-display text-3xl text-foreground" data-testid="door-place-name">{place.displayName}</h1>
        <TalkAddressPlaque address={place.address} className="mt-2 !px-2.5 !py-1 !text-[0.78rem]" />
        {place.tagline && (
          <p className="mt-3 max-w-xs text-sm font-light italic leading-relaxed text-muted-foreground">&ldquo;{place.tagline}&rdquo;</p>
        )}
        {place.doorNote && (
          <div className="mt-3.5 flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/[0.05] px-3 py-2 text-left" data-testid="door-note">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
            <span className="text-sm font-light leading-relaxed text-foreground/85">{place.doorNote}</span>
          </div>
        )}
      </div>
    );
  }

  const { draft, slug, onDraft, onOpen } = props;
  const active = !!slug;
  return (
    <div className="flex flex-col items-center text-center" data-testid="door-hero">
      <span className="mb-3 font-mono text-[0.6rem] uppercase tracking-[0.3em] text-clay">{TALK.domain}</span>
      <PlaceMark mark={markFor(slug || "?", slug)} size={76} className={active ? "transition-all duration-500" : "opacity-35 grayscale transition-all duration-500"} />
      <h1 className="mt-3.5 talk-display text-3xl text-foreground sm:text-4xl" data-testid="landing-title">
        {active ? slug : "Your own place for messages."}
      </h1>
      <p className="mt-2 text-sm font-light italic text-muted-foreground/70" data-testid="landing-purpose">
        Find or claim a place for messages.
      </p>

      <div className="mt-5 flex w-full max-w-sm items-center gap-2">
        <TalkAddressPlaque
          editable
          value={draft}
          onChange={onDraft}
          onSubmit={onOpen}
          placeholder="your-name"
          className="!flex-1 !py-2.5 !text-base"
        />
        <button
          type="button"
          className="btn-moss shrink-0 !px-4 text-base disabled:opacity-40"
          onClick={onOpen}
          disabled={!active}
          aria-label="Open this address"
          data-testid="claim-address-btn"
        >
          <ArrowRight className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>

      <p className="mt-3 max-w-sm text-sm font-light text-muted-foreground" data-testid="landing-helper">
        {active ? (
          <>
            Open <span className="font-medium text-foreground">{TALK.domain}/{slug}</span> —
            claim it if it&apos;s free, reach them if it&apos;s taken.
          </>
        ) : (
          <>Type a name to claim it — or open someone&apos;s address to reach them.</>
        )}
      </p>
    </div>
  );
}
