import { Check, EyeOff, MapPin, Send, UserRound } from "lucide-react";
import { TALK } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * Snapshots of the app itself, standing in for a text explanation: a Drop being
 * left at someone's door, and the private Talk it can become. Two softly-tilted
 * phone frames. The whole stage recedes (`dim`) the moment you start typing.
 */
export function LandingSnapshots({ dim }: { dim: boolean }) {
  return (
    <div
      className={cn("landing-explainer snap-stage", dim && "landing-explainer--dim")}
      aria-hidden={dim}
      data-testid="landing-snapshots"
    >
      {/* Snapshot 1 — leaving a Drop at a door */}
      <div className="snap-phone snap-phone--drop" data-testid="snapshot-drop">
        <span className="snap-caption" style={{ top: "-0.8rem", left: "-0.4rem" }}>
          <span className="dot" /> Leave a Drop
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
            <p className="snap-note-text">
              Hi Alex — loved your field notes on calm software. Could we talk sometime?
            </p>
          </div>
          <div className="snap-idrow">
            <span className="snap-chip"><EyeOff className="mr-1 inline h-2.5 w-2.5" strokeWidth={2} />anonymously</span>
            <span className="snap-chip"><UserRound className="mr-1 inline h-2.5 w-2.5" strokeWidth={2} />my name</span>
            <span className="snap-chip" data-active="true"><MapPin className="mr-1 inline h-2.5 w-2.5" strokeWidth={2} />from my place</span>
          </div>
          <div className="snap-btn">
            <Send className="h-3 w-3" strokeWidth={2} /> Leave it at Alex's door
          </div>
        </div>
      </div>

      {/* Snapshot 2 — the private Talk it becomes */}
      <div className="snap-phone snap-phone--convo" data-testid="snapshot-convo">
        <span className="snap-caption" style={{ bottom: "-0.8rem", right: "-0.2rem" }}>
          <span className="dot" /> It becomes a Talk
        </span>
        <div className="snap-screen">
          <div className="snap-head">
            <span className="snap-mark">MA</span>
            <span className="min-w-0">
              <span className="snap-name block">Mara</span>
              <span className="snap-addr block">{TALK.domain}/mara</span>
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <div>
              <span className="snap-speaker">Mara</span>
              <div className="snap-frag snap-frag--other mt-0.5">Either afternoon works on my end.</div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="snap-speaker ml-auto">You</span>
              </div>
              <div className="snap-frag snap-frag--own mt-0.5">Next Tuesday works — I'll send a time.</div>
              <p className="snap-seen mt-1"><Check className="h-2.5 w-2.5" strokeWidth={3} /> Seen</p>
            </div>
          </div>
          <div className="snap-composerbar">
            Leave a message…
            <span className="snap-send"><Send className="h-3 w-3" strokeWidth={2} /></span>
          </div>
        </div>
      </div>
    </div>
  );
}
