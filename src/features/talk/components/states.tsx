import type { ReactNode } from "react";
import { Loader2, Ghost, TriangleAlert } from "lucide-react";
import { KodamaMark } from "@/components/kodama-mark";

/** Loading — a breathing mark, never a blank pane. */
export function TalkLoading({ label = "Finding this place…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center" data-testid="talk-loading">
      <div className="animate-breathe">
        <KodamaMark size={40} />
      </div>
      <p className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        {label}
      </p>
    </div>
  );
}

/** Empty — welcoming, never left blank. */
export function TalkEmpty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-16 text-center" data-testid="talk-empty">
      <Ghost className="h-8 w-8 text-primary/60" strokeWidth={1.25} aria-hidden="true" />
      <h3 className="talk-display text-xl text-foreground">{title}</h3>
      <p className="text-sm font-light leading-relaxed text-muted-foreground">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Error — calm, actionable. */
export function TalkError({
  title = "Something slipped",
  body,
  action,
}: {
  title?: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-16 text-center" data-testid="talk-error">
      <TriangleAlert className="h-8 w-8 text-ember" strokeWidth={1.25} aria-hidden="true" />
      <h3 className="talk-display text-xl text-foreground">{title}</h3>
      <p className="text-sm font-light leading-relaxed text-muted-foreground">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
