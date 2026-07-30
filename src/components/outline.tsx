import { useEffect, useMemo, useRef } from "react";
import { ListTree, X } from "lucide-react";

import { SheetNav, type SheetNavProps } from "@/components/sheet-nav";

type Heading = { level: number; text: string; offset: number };

export type OutlineDrawerPanel = "sheets" | "outline";

function parseHeadings(text: string): Heading[] {
  const out: Heading[] = [];
  const lines = text.split("\n");
  let offset = 0;
  for (const line of lines) {
    const m = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (m) out.push({ level: m[1].length, text: m[2], offset });
    offset += line.length + 1;
  }
  return out;
}

function OutlineBody({
  headings,
  activeHeading,
  onJump,
}: {
  headings: Heading[];
  activeHeading?: string | null;
  onJump: (h: Heading) => void;
}) {
  if (headings.length === 0) {
    return (
      <p className="text-[11px] font-light leading-relaxed text-muted-foreground/60">
        Headings appear here as you write.
      </p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {headings.map((h, i) => {
        const active = !!activeHeading && h.text === activeHeading;
        return (
          <li key={`${h.offset}-${i}`} style={{ paddingLeft: (h.level - 1) * 10 }}>
            <button
              type="button"
              onClick={() => onJump(h)}
              className={`outline-item block w-full truncate rounded-md px-1.5 py-1.5 text-left text-[11px] font-light text-muted-foreground/80 transition-colors hover:bg-primary/5 hover:text-foreground${
                active ? " is-active" : ""
              }`}
              title={h.text}
              aria-current={active ? "true" : undefined}
            >
              {h.text}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function Outline({
  text,
  activeHeading,
  onJumpToHeading,
  onJump,
  embedded = false,
}: {
  text: string;
  activeHeading?: string | null;
  onJumpToHeading?: (heading: string) => void;
  onJump?: () => void;
  /** When true, render as a section (for stacking under SheetNav). */
  embedded?: boolean;
}) {
  const headings = useMemo(() => parseHeadings(text), [text]);

  const jump = (h: Heading) => {
    onJumpToHeading?.(h.text);
    onJump?.();
  };

  const body = (
    <>
      <div className="mb-3 inline-flex w-full items-center gap-1.5 border-b border-border/50 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <ListTree className="h-3 w-3" /> Outline
      </div>
      <OutlineBody headings={headings} activeHeading={activeHeading} onJump={jump} />
    </>
  );

  if (embedded) {
    return (
      <section data-editor-outline="true" className="min-h-0">
        {body}
      </section>
    );
  }

  return (
    <aside
      data-editor-outline="true"
      className="hidden h-full min-h-0 w-48 shrink-0 self-stretch overflow-y-auto border-r border-border/40 pr-3 opacity-80 transition-opacity hover:opacity-100 md:block lg:w-52"
    >
      {body}
    </aside>
  );
}

type OutlineDrawerSheetProps = Pick<
  SheetNavProps,
  | "sheets"
  | "activeSheetId"
  | "activeMarkdown"
  | "canEdit"
  | "onSelect"
  | "onAdd"
  | "onRename"
  | "onDelete"
  | "onReorder"
>;

/** Navigate drawer — sheets list + heading outline (all breakpoints). */
export function OutlineDrawer({
  open,
  onClose,
  text,
  activeHeading,
  onJumpToHeading,
  sheets,
  initialPanel = "outline",
}: {
  open: boolean;
  onClose: () => void;
  text: string;
  activeHeading?: string | null;
  onJumpToHeading?: (heading: string) => void;
  sheets?: OutlineDrawerSheetProps;
  initialPanel?: OutlineDrawerPanel;
}) {
  const headings = useMemo(() => parseHeadings(text), [text]);
  const sheetsRef = useRef<HTMLElement | null>(null);
  const outlineRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const target = initialPanel === "sheets" ? sheetsRef.current : outlineRef.current;
    target?.scrollIntoView({ block: "start" });
  }, [open, initialPanel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-label="Sheets and outline"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-background/95 backdrop-blur-xl"
        onClick={onClose}
      />
      <div className="relative mx-auto flex h-full max-w-lg flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 font-display text-lg font-medium tracking-tight text-foreground">
            <ListTree className="h-4 w-4 text-primary" />
            Navigate
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 min-h-0 flex-1 space-y-6 overflow-y-auto pb-4">
          {sheets && (
            <section ref={sheetsRef} data-outline-panel="sheets">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
                Sheets
              </p>
              <SheetNav {...sheets} embedded onAfterSelect={onClose} />
            </section>
          )}
          <section ref={outlineRef} data-outline-panel="outline">
            <p className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
              <ListTree className="h-3 w-3" /> Outline
            </p>
            <OutlineBody
              headings={headings}
              activeHeading={activeHeading}
              onJump={(h) => {
                onJumpToHeading?.(h.text);
                onClose();
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
