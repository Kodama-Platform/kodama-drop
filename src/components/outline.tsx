import { useEffect, useMemo, useRef } from "react";
import { ListTree, X } from "lucide-react";

import { SheetNav, type SheetNavProps } from "@/components/sheet-nav";
import {
  parseMarkdownHeadings,
  type EditorHeading,
} from "@/lib/editor-headings";

export type OutlineDrawerPanel = "sheets" | "outline";

function OutlineBody({
  headings,
  activeHeading,
  onJump,
}: {
  headings: EditorHeading[];
  activeHeading?: string | null;
  onJump: (h: EditorHeading) => void;
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
        const depth = Math.max(0, h.level - 1);
        return (
          <li key={`${h.pos ?? h.text}-${i}`} style={{ paddingLeft: depth * 0.85 + "rem" }}>
            <button
              type="button"
              onClick={() => onJump(h)}
              data-heading-level={h.level}
              className={`outline-item block w-full truncate rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-primary/5 hover:text-foreground${
                h.level === 1
                  ? " text-[12.5px] font-medium text-foreground/85"
                  : h.level === 2
                    ? " text-[11.5px] font-normal text-foreground/75"
                    : " text-[11px] font-light text-muted-foreground/85"
              }${active ? " is-active" : ""}`}
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
  headings: headingsProp,
  activeHeading,
  onJumpToHeading,
  onJump,
  embedded = false,
}: {
  text: string;
  headings?: EditorHeading[];
  activeHeading?: string | null;
  onJumpToHeading?: (heading: EditorHeading) => void;
  onJump?: () => void;
  /** When true, render as a section (for stacking under SheetNav). */
  embedded?: boolean;
}) {
  const headings = useMemo(
    () => headingsProp ?? parseMarkdownHeadings(text),
    [headingsProp, text],
  );

  const jump = (h: EditorHeading) => {
    onJumpToHeading?.(h);
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
  headings: headingsProp,
  activeHeading,
  onJumpToHeading,
  sheets,
  initialPanel = "outline",
}: {
  open: boolean;
  onClose: () => void;
  text: string;
  headings?: EditorHeading[];
  activeHeading?: string | null;
  onJumpToHeading?: (heading: EditorHeading) => void;
  sheets?: OutlineDrawerSheetProps;
  initialPanel?: OutlineDrawerPanel;
}) {
  const headings = useMemo(
    () => headingsProp ?? parseMarkdownHeadings(text),
    [headingsProp, text],
  );
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
      aria-label="Canopy"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-background/95 backdrop-blur-xl"
        onClick={onClose}
      />
      <div className="relative mx-auto flex h-full max-w-lg flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 font-display text-lg font-medium tracking-tight text-foreground">
              <ListTree className="h-4 w-4 text-primary" />
              Canopy
            </p>
            <p className="mt-0.5 font-mono text-[10px] font-light uppercase tracking-[0.14em] text-muted-foreground/75">
              Headings in this trail
            </p>
          </div>
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
                Trails
              </p>
              <SheetNav {...sheets} embedded onAfterSelect={onClose} />
            </section>
          )}
          <section ref={outlineRef} data-outline-panel="outline">
            <p className="mb-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
              <ListTree className="h-3 w-3" /> Canopy map
            </p>
            <OutlineBody
              headings={headings}
              activeHeading={activeHeading}
              onJump={(h) => {
                onJumpToHeading?.(h);
                onClose();
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
