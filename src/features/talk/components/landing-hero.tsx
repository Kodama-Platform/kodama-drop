import { useEffect, useRef, useState } from "react";
import { Check, DoorOpen, EyeOff, Lock, MapPin, Radio, RotateCcw, Send, UserRound, Users } from "lucide-react";
import { TALK } from "@/lib/brand";
import { cn } from "@/lib/utils";

type Identity = "anonymously" | "named" | "place";
type Mode = "direct" | "spaces";

export type EchoTarget = { name: string; address: string };

const IDENTITIES: { id: Identity; label: string; icon: typeof MapPin }[] = [
  { id: "anonymously", label: "anonymously", icon: EyeOff },
  { id: "named", label: "my name", icon: UserRound },
  { id: "place", label: "from my place", icon: MapPin },
];

const initialsOf = (name: string) =>
  name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "AR";
const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] || "there";

function authorLabel(id: Identity): string {
  if (id === "anonymously") return "Someone · anonymously";
  if (id === "named") return "You";
  return `You · ${TALK.domain}/you`;
}

/**
 * A playable snapshot of the app: leave a Drop at whoever you're typing to, and
 * watch it open as a private Talk — or flip to see Channels & Groups. Softly
 * self-runs once on load, then hands control over. Stays live (only recedes)
 * while you type in the field.
 */
export function LandingSnapshots({ recede, target }: { recede: boolean; target: EchoTarget }) {
  const [mode, setMode] = useState<Mode>("direct");
  const [note, setNote] = useState("Hi — loved your field notes on calm software. Could we talk?");
  const [identity, setIdentity] = useState<Identity>("place");
  const [sent, setSent] = useState(false);
  const [replied, setReplied] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [following, setFollowing] = useState(true);
  const timers = useRef<number[]>([]);
  const interacted = useRef(false);
  const autoplayed = useRef(false);

  const name = target.name.trim() || "Alex Rivera";
  const address = target.address.trim() || "alex";
  const first = firstNameOf(name);
  const initials = initialsOf(name);

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
    setSent(false); setReplied(false); setPulse(false);
    setNote("Hi — loved your field notes on calm software. Could we talk?");
  };
  const mark = () => { interacted.current = true; };

  // Autoplay once: run the loop softly, then hand control to the visitor.
  // Scheduling stays StrictMode-safe (only the firing latches `autoplayed`).
  useEffect(() => {
    if (mode !== "direct" || recede) return;
    const t = window.setTimeout(() => {
      if (autoplayed.current || interacted.current || sent) return;
      autoplayed.current = true;
      setSent(true);
      setPulse(true);
      timers.current.push(window.setTimeout(() => setPulse(false), 900));
      timers.current.push(window.setTimeout(() => setReplied(true), 1700));
    }, 1600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, recede]);

  const switchMode = (m: Mode) => { mark(); setMode(m); };

  return (
    <div className={cn("landing-explainer", recede && "landing-explainer--recede")} data-testid="landing-snapshots">
      <div className="snap-modes-wrap">
        <div className="snap-modes" role="tablist" aria-label="What Kodama Talk can do">
          <button type="button" role="tab" className="snap-mode-btn" data-active={mode === "direct"} onClick={() => switchMode("direct")} data-testid="snapshot-mode-direct">One-to-one</button>
          <button type="button" role="tab" className="snap-mode-btn" data-active={mode === "spaces"} onClick={() => switchMode("spaces")} data-testid="snapshot-mode-spaces">Channels & Groups</button>
        </div>
      </div>

      <div className="snap-stage" data-testid="snapshot-stage">
        {mode === "direct" ? (
          <>
            {/* Snapshot 1 — leaving a Drop at their door (interactive) */}
            <div className="snap-phone snap-phone--drop" data-testid="snapshot-drop">
              <span className="snap-caption" style={{ top: "-0.8rem", left: "-0.4rem" }}>
                <span className="dot" /> Leave a Drop · try it
              </span>
              <div className="snap-screen">
                <div className="snap-head">
                  <span className="snap-mark">{initials}</span>
                  <span className="min-w-0">
                    <span className="snap-name block" data-testid="snapshot-drop-name">{name}</span>
                    <span className="snap-addr block">{TALK.domain}/{address}</span>
                  </span>
                </div>
                <div className="snap-note">
                  <textarea
                    className="snap-note-input"
                    value={note}
                    onChange={(e) => { mark(); setNote(e.target.value); }}
                    onFocus={mark}
                    placeholder={`Hi ${first}, I just wanted to say…`}
                    rows={2}
                    aria-label="Write a Drop"
                    data-testid="snapshot-note"
                  />
                </div>
                <div className="snap-idrow">
                  {IDENTITIES.map((o) => (
                    <button key={o.id} type="button" className="snap-chip" data-active={identity === o.id}
                      onClick={() => { mark(); setIdentity(o.id); }} data-testid={`snapshot-chip-${o.id}`}>
                      <o.icon className="mr-1 inline h-2.5 w-2.5" strokeWidth={2} />{o.label}
                    </button>
                  ))}
                </div>
                <button type="button" className="snap-btn" onClick={() => { mark(); leave(); }} disabled={!note.trim() || sent} data-testid="snapshot-send">
                  <Send className="h-3 w-3" strokeWidth={2} />
                  {sent ? `Left at ${first}'s door` : `Leave it at ${first}'s door`}
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
                  <span className="snap-mark">{initials}</span>
                  <span className="min-w-0 flex-1">
                    <span className="snap-name block">{name}</span>
                    <span className="snap-addr block">{TALK.domain}/{address}</span>
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
                    <p className="snap-empty-text">Leave a Drop and it opens here — as a private Talk, only if {first} replies.</p>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="snap-frag-wrap">
                      <span className="snap-speaker ml-auto block text-right">{authorLabel(identity)}</span>
                      <div className="snap-frag snap-frag--own mt-0.5">{note.trim()}</div>
                    </div>
                    {!replied ? (
                      <div className="snap-typing" data-testid="snapshot-typing" aria-label={`${first} is replying`}>
                        <span /><span /><span />
                      </div>
                    ) : (
                      <div className="snap-frag-wrap" data-testid="snapshot-reply">
                        <span className="snap-speaker">{first}</span>
                        <div className="snap-frag snap-frag--other mt-0.5">Glad you liked them — Tuesday afternoon works. I'll send a time.</div>
                      </div>
                    )}
                    {replied && <p className="snap-seen mt-0.5"><Check className="h-2.5 w-2.5" strokeWidth={3} /> Seen</p>}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Snapshot A — a public Channel (one-to-many, quiet broadcast) */}
            <div className="snap-phone snap-phone--drop" data-testid="snapshot-channel">
              <span className="snap-caption" style={{ top: "-0.8rem", left: "-0.4rem" }}>
                <span className="dot" /> A Channel
              </span>
              <div className="snap-screen">
                <div className="snap-head">
                  <span className="snap-mark" style={{ borderRadius: "26%" }}><Radio className="h-3.5 w-3.5" strokeWidth={2} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="snap-name block">Field Notes</span>
                    <span className="snap-addr block">{TALK.domain}/{address}/field-notes</span>
                  </span>
                  <button type="button" className="snap-follow" data-active={following} onClick={() => { mark(); setFollowing((v) => !v); }} data-testid="snapshot-follow">
                    {following ? <><Check className="h-2.5 w-2.5" strokeWidth={3} /> Following</> : "Follow"}
                  </button>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <div className="snap-post">This week: designing for calm — less notification, more intention.</div>
                  <div className="snap-post">New: replies here are reviewed before they appear. Quiet by default.</div>
                </div>
                <p className="snap-meta mt-2">Broadcasts from {first} · 128 following · replies reviewed</p>
              </div>
            </div>

            {/* Snapshot B — a private Group (a few people, invite-only) */}
            <div className="snap-phone snap-phone--convo" data-testid="snapshot-group">
              <span className="snap-caption" style={{ bottom: "-0.8rem", right: "-0.2rem" }}>
                <span className="dot" /> A Group
              </span>
              <div className="snap-screen">
                <div className="snap-head">
                  <span className="snap-mark" style={{ borderRadius: "26%" }}><Lock className="h-3.5 w-3.5" strokeWidth={2} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="snap-name block">Design Team</span>
                    <span className="snap-addr block">private group · invite-only</span>
                  </span>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <div>
                    <span className="snap-speaker">Wren</span>
                    <div className="snap-frag snap-frag--other mt-0.5">Let's ship the calmer palette this week.</div>
                  </div>
                  <div className="snap-frag-wrap">
                    <span className="snap-speaker ml-auto block text-right">You</span>
                    <div className="snap-frag snap-frag--own mt-0.5">Agreed — Tuesday works for me.</div>
                  </div>
                  <div>
                    <span className="snap-speaker">Mara</span>
                    <div className="snap-frag snap-frag--other mt-0.5">Perfect. I'll prep the notes.</div>
                  </div>
                </div>
                <p className="snap-meta mt-2"><Users className="mr-1 inline h-2.5 w-2.5" strokeWidth={2} />3 members · only they can read this</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
