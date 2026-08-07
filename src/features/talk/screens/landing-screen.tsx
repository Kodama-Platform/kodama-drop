import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, DoorOpen, Layers, MessagesSquare } from "lucide-react";

import { TALK } from "@/lib/brand";
import { normalizeSlug } from "@/lib/slug";
import { TalkShell } from "@/features/talk/components/talk-shell";
import { TalkAddressPlaque } from "@/features/talk/components/talk-address-plaque";
import { PrivacyStatus } from "@/features/talk/components/privacy-status";
import { getTalkSecurity } from "@/features/talk/security/talk-security-adapter";

const EXPERIENCES = [
  {
    icon: DoorOpen,
    name: "The Door",
    body: "Anyone opens your address and drops a message in seconds. No account.",
  },
  {
    icon: Layers,
    name: "The Shelf",
    body: "Unlock your own address to see what needs attention — Drops, pinned places, sent.",
  },
  {
    icon: MessagesSquare,
    name: "The Stream",
    body: "Every Drop, Direct Talk, Group, or Channel opens into one focused page.",
  },
] as const;

/** Marketing Door — the front of Kodama Talk. */
export function LandingScreen() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");

  const go = () => {
    const address = normalizeSlug(draft);
    if (!address) return;
    navigate({ to: "/$address", params: { address } });
  };

  return (
    <TalkShell showFooter>
      <section className="mx-auto w-full max-w-3xl px-5 pb-24 pt-10 text-center sm:pt-20">
        <p className="animate-rise font-mono text-[0.72rem] uppercase tracking-[0.32em] text-clay">
          {TALK.domain}
        </p>
        <h1 className="animate-rise animate-rise-delay-1 mt-5 talk-display text-4xl text-foreground sm:text-6xl">
          Your own place<br className="hidden sm:block" /> for messages.
        </h1>
        <p className="animate-rise animate-rise-delay-1 mx-auto mt-5 max-w-md text-base font-light leading-relaxed text-muted-foreground">
          One memorable address where anyone can reach you — and you decide what becomes a
          conversation.
        </p>

        <div className="animate-rise animate-rise-delay-1 mt-9 flex flex-col items-center gap-3">
          <TalkAddressPlaque
            editable
            value={draft}
            onChange={setDraft}
            onSubmit={go}
            placeholder="your-name"
            className="!py-3 !text-base"
          />
          <button
            type="button"
            className="btn-moss text-base disabled:opacity-50"
            onClick={go}
            disabled={!normalizeSlug(draft)}
            data-testid="claim-address-btn"
          >
            Claim your Talk address
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <p className="text-sm font-light text-muted-foreground">
            Anyone can drop you a message. No account needed.
          </p>
        </div>

        <div className="mt-16 grid gap-4 text-left sm:grid-cols-3">
          {EXPERIENCES.map((e) => (
            <div key={e.name} className="talk-surface p-5">
              <e.icon className="h-5 w-5 text-primary" strokeWidth={1.5} aria-hidden="true" />
              <h3 className="mt-3 talk-display text-lg text-foreground">{e.name}</h3>
              <p className="mt-1.5 text-sm font-light leading-relaxed text-muted-foreground">
                {e.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-4">
          <p className="max-w-lg text-sm font-light leading-relaxed text-muted-foreground">
            Stop putting your email, phone number, Telegram, Discord, and five social links
            everywhere. Put one address.
          </p>
          <PrivacyStatus status={getTalkSecurity().describePrivacy()} withText />
        </div>
      </section>
    </TalkShell>
  );
}
