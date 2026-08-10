import { useState } from "react";
import { CornerUpLeft, Hand, Lock } from "lucide-react";

import { useNavigate } from "@tanstack/react-router";
import { TALK } from "@/lib/brand";
import { normalizeSlug } from "@/lib/slug";
import { TalkShell } from "@/features/talk/components/talk-shell";
import { DoorHero } from "@/features/talk/components/door-hero";

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
      <section className="mx-auto w-full max-w-3xl px-5 pb-24 pt-14 text-center sm:pt-24">
        <div className="animate-rise">
          <DoorHero mode="entry" draft={draft} slug={slug} onDraft={setDraft} onOpen={go} />
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
