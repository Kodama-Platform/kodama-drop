import { TALK } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Atmospheric forest-mist backdrop for the landing — theme-aware, held behind everything. */
export function LandingBackdrop() {
  return (
    <div className="landing-mist" aria-hidden="true" data-testid="landing-backdrop">
      <img className="landing-mist-light" src="/landing/mist-light.jpg" alt="" loading="eager" decoding="async" />
      <img className="landing-mist-dark" src="/landing/mist-dark.jpg" alt="" loading="eager" decoding="async" />
    </div>
  );
}

const BEATS = [
  { n: "01", title: "A Drop", body: "Anyone opens your address and leaves a note. No app, no account — just words." },
  { n: "02", title: "You decide", body: "Reply and it quietly becomes a private Talk. Or let it rest. You're never obligated." },
  { n: "03", title: "It stays yours", body: "Groups and Channels appear only when you want them. Nothing to manage until then." },
] as const;

const TRAIL = [
  { title: "Someone leaves a Drop", when: "a moment ago", ember: false },
  { title: "It arrives at your place", when: "just now", ember: true },
  { title: "You reply — a Talk begins", when: "", ember: false },
  { title: "The conversation stays private", when: "always", ember: false },
] as const;

/**
 * The editorial explainer beside the live field: little Drop notes flowing into
 * your address, and the quiet trail a Drop can become. Recreated in the DOM so
 * it reflects the theme and the address being typed. Fades out via `dim`.
 */
export function LandingExplainer({ slug, dim }: { slug: string; dim: boolean }) {
  const name = slug || "your-name";
  return (
    <div
      className={cn("landing-explainer landing-stagger", dim && "landing-explainer--dim")}
      aria-hidden={dim}
      data-testid="landing-explainer"
    >
      {/* Drops → your address */}
      <div className="diagram-wrap">
        <div className="diagram-drops" data-testid="diagram-drops">
          <Note dot="rgb(var(--primary))" />
          <Note dot="rgb(var(--ember))" />
          <Note dot="rgb(var(--stone))" />
        </div>
        <svg className="diagram-flow" viewBox="0 0 300 34" preserveAspectRatio="none" aria-hidden="true">
          <path d="M40 2 C 40 24, 150 20, 150 32" />
          <path d="M150 2 L150 32" />
          <path d="M260 2 C 260 24, 150 20, 150 32" />
        </svg>
        <div className="address-slab" data-testid="diagram-address">
          <span className="address-slab-tag">Your Talk address</span>
          <div className="address-slab-url">
            <span className="host">{TALK.domain}</span>
            <span className="slash">/</span>
            <span className="name">{name}</span>
          </div>
          <span className="address-slab-moss" aria-hidden="true" />
        </div>
      </div>

      {/* The trail a Drop can grow into */}
      <div className="mt-8">
        <p className="mb-3 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground/60">
          A Drop can become a Talk
        </p>
        <ul className="trail-mini" data-testid="diagram-trail">
          {TRAIL.map((t) => (
            <li key={t.title} data-ember={t.ember}>
              <span className="t-title">{t.title}</span>
              {t.when && <span className="t-when block">{t.when}</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* Three beats, in human terms */}
      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {BEATS.map((b) => (
          <div key={b.title}>
            <span className="beat-num">{b.n}</span>
            <h3 className="beat-title mt-1">{b.title}</h3>
            <p className="beat-body mt-1">{b.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Note({ dot }: { dot: string }) {
  return (
    <div className="drop-note">
      <span className="drop-dot" style={{ background: dot }} />
      <span className="drop-line" />
      <span className="drop-line" />
    </div>
  );
}
