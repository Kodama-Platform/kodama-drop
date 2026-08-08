import { useState } from "react";
import { ArrowRight, CornerUpLeft, Hand, Lock } from "lucide-react";

import { useNavigate } from "@tanstack/react-router";
import { TALK } from "@/lib/brand";
import { normalizeSlug } from "@/lib/slug";
import { TalkShell } from "@/features/talk/components/talk-shell";
import { TalkAddressPlaque } from "@/features/talk/components/talk-address-plaque";

const STEPS = [
  {
    icon: Hand,
    name: "A Drop",
    body: "Anyone opens your address and leaves a message. No app, no account — just words.",
  },
  {
    icon: CornerUpLeft,
    name: "You decide",
    body: "Reply and it quietly becomes a private Direct Talk. Or decline. You're never obligated.",
  },
  {
    icon: Lock,
    name: "It stays yours",
    body: "Groups and Channels appear only when you want them. Nothing to manage until then.",
  },
] as const;

/** The front door of Kodama Talk. One field, two honest intents. */
export function LandingScreen() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const slug = normalizeSlug(draft);

  const go = () => {
    if (!slug) return;
    navigate({ to: "/$address", params: { address: slug } });
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
          One address anyone can reach you at. You decide what becomes a conversation.
          No account, ever.
        </p>

        {/* One field, two honest paths: claim it, or reach someone. */}
        <div className="animate-rise animate-rise-delay-1 mx-auto mt-9 flex w-full max-w-md flex-col items-center gap-3">
          <div className="flex w-full items-center gap-2">
            <TalkAddressPlaque
              editable
              value={draft}
              onChange={setDraft}
              onSubmit={go}
              placeholder="your-name"
              className="!flex-1 !py-3 !text-base"
            />
            <button
              type="button"
              className="btn-moss shrink-0 !px-4 text-base disabled:opacity-40"
              onClick={go}
              disabled={!slug}
              aria-label="Open this address"
              data-testid="claim-address-btn"
            >
              <ArrowRight className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>
          <p className="text-sm font-light text-muted-foreground" data-testid="landing-helper">
            {slug ? (
              <>
                Open <span className="font-medium text-foreground">{TALK.domain}/{slug}</span> —
                claim it if it&apos;s free, reach them if it&apos;s taken.
              </>
            ) : (
              <>Type a name to claim it — or open someone&apos;s address to reach them.</>
            )}
          </p>
        </div>

        {/* How it feels — the communication forms, in human terms. */}
        <div className="mt-16 grid gap-4 text-left sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.name} className="talk-surface p-5">
              <div className="flex items-center gap-2">
                <s.icon className="h-5 w-5 text-primary" strokeWidth={1.5} aria-hidden="true" />
                <span className="font-mono text-[0.66rem] text-muted-foreground/60">0{i + 1}</span>
              </div>
              <h3 className="mt-3 talk-display text-lg text-foreground">{s.name}</h3>
              <p className="mt-1.5 text-sm font-light leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-4">
          <p className="max-w-lg text-sm font-light leading-relaxed text-muted-foreground">
            Stop scattering your email, phone number, and five social links everywhere.
            Share one address.
          </p>
          <span className="talk-privacy talk-privacy--calm" title={TALK.privacyLine}>
            <Lock className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
            Private by design — encrypted before it reaches Kodama
          </span>
        </div>
      </section>
    </TalkShell>
  );
}
