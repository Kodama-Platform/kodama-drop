import { useEffect, useRef, useState } from "react";
import { Check, DoorOpen, EyeOff, MapPin, RotateCcw, Send, UserRound } from "lucide-react";
import { TALK } from "@/lib/brand";
import { cn } from "@/lib/utils";

type Identity = "anonymously" | "named" | "place";

const IDENTITIES: { id: Identity; label: string; icon: typeof MapPin }[] = [
  { id: "anonymously", label: "anonymously", icon: EyeOff },
  { id: "named", label: "my name", icon: UserRound },
  { id: "place", label: "from my place", icon: MapPin },
];

function authorLabel(id: Identity): string {
  if (id === "anonymously") return "Someone · anonymously";
  if (id === "named") return "You";
  return `You · ${TALK.domain}/you`;
}

/**
 * A playable snapshot of the app's core loop: write a note at Alex's door,
 * choose how to sign it, leave it — and watch it open as a private Talk with a
 * gentle reply. Stays live (only gently recedes) while you type in the field.
 */
export function LandingSnapshots({ recede }: { recede: boolean }) {
  const [note, setNote] = useState("Hi Alex — loved your field notes on calm software. Could we talk?");
  const [identity, setIdentity] = useState<Identity>("place");
  const [sent, setSent] = useState(false);
  const [replied, setReplied] = useState(false);
  const [pulse, setPulse] = useState(false);
  const timers = useRef<number[]>([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => clearTimers(), []);

  const leave = () => {
    if (!note.trim() || sent) return;
    setSent(true);
    setPulse(true);
    timers.current.push(window.setTimeout(() => setPulse(false), 900));
    timers.current.push(window.setTimeout(() => setReplied(true), 1700));
  };
  const reset = () => {
    clearTimers();
    setSent(false);
    setReplied(false);
    setPulse(false);
    setNote("Hi Alex — loved your field notes on calm software. Could we talk?");
  };

  return (
    <div
      className={cn("landing-explainer snap-stage", recede && "landing-explainer--recede")}
      data-testid="landing-snapshots"
    >
      {/* Snapshot 1 — leaving a Drop at a door (interactive) */}
      <div className="snap-phone snap-phone--drop" data-testid="snapshot-drop">
        <span className="snap-caption" style={{ top: "-0.8rem", left: "-0.4rem" }}>
          <span className="dot" /> Leave a Drop · try it
        </span>
        <div className="snap-screen">
          <div className="snap-head">
            <span className="snap-mark">AR</span>
            <span className="min-w-0">
              <span className="snap-name block">Alex Rivera</span>
              <span className="snap-addr block">{TALK.domain}/alex</span>
            </span>
          </div>
          <div className="snap-note">
            <textarea
              className="snap-note-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Hi Alex, I just wanted to say…"
              rows={2}
              aria-label="Write a Drop"
              data-testid="snapshot-note"
            />
          </div>
          <div className="snap-idrow">
            {IDENTITIES.map((o) => (
              <button
                key={o.id}
                type="button"
                className="snap-chip"
                data-active={identity === o.id}
                onClick={() => setIdentity(o.id)}
                data-testid={`snapshot-chip-${o.id}`}
              >
                <o.icon className="mr-1 inline h-2.5 w-2.5" strokeWidth={2} />{o.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="snap-btn"
            onClick={leave}
            disabled={!note.trim() || sent}
            data-testid="snapshot-send"
          >
            <Send className="h-3 w-3" strokeWidth={2} />
            {sent ? "Left at Alex's door" : "Leave it at Alex's door"}
          </button>
        </div>
      </div>

      {/* Snapshot 2 — the private Talk it becomes */}
      <div className={cn("snap-phone snap-phone--convo", pulse && "snap-phone--pulse")} data-testid="snapshot-convo">
        <span className="snap-caption" style={{ bottom: "-0.8rem", right: "-0.2rem" }}>
          <span className="dot" /> It becomes a Talk
        </span>
        <div className="snap-screen">
          <div className="snap-head">
            <span className="snap-mark">AR</span>
            <span className="min-w-0 flex-1">
              <span className="snap-name block">Alex Rivera</span>
              <span className="snap-addr block">{TALK.domain}/alex</span>
            </span>
            {sent && (
              <button type="button" className="snap-reset" onClick={reset} data-testid="snapshot-reset">
                <RotateCcw className="h-2.5 w-2.5" strokeWidth={2} /> start over
              </button>
            )}
          </div>

          {!sent ? (
            <div className="snap-empty" data-testid="snapshot-empty">
              <span className="snap-empty-icon"><DoorOpen className="h-4 w-4" strokeWidth={1.75} /></span>
              <p className="snap-empty-text">Leave a Drop and it opens here — as a private Talk, only if Alex replies.</p>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              <div className="snap-frag-wrap">
                <span className="snap-speaker ml-auto block text-right">{authorLabel(identity)}</span>
                <div className="snap-frag snap-frag--own mt-0.5">{note.trim()}</div>
              </div>
              {!replied ? (
                <div className="snap-typing" data-testid="snapshot-typing" aria-label="Alex is replying">
                  <span /><span /><span />
                </div>
              ) : (
                <div className="snap-frag-wrap" data-testid="snapshot-reply">
                  <span className="snap-speaker">Alex</span>
                  <div className="snap-frag snap-frag--other mt-0.5">Glad you liked them — Tuesday afternoon works. I'll send a time.</div>
                </div>
              )}
              {replied && <p className="snap-seen mt-0.5"><Check className="h-2.5 w-2.5" strokeWidth={3} /> Seen</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
