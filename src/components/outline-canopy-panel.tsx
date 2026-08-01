import { useMemo } from "react";
import { Leaf, X } from "lucide-react";

import {
  parseMarkdownHeadings,
  type EditorHeading,
} from "@/lib/editor-headings";

export type OutlineCanopyPanelProps = {
  text?: string;
  /** Prefer live TipTap headings (with pos) when available. */
  headings?: EditorHeading[];
  activeHeading?: string | null;
  onJumpToHeading: (heading: EditorHeading) => void;
  onClose: () => void;
};

/** Docked right canopy — outline that visibly takes space beside the paper. */
export function OutlineCanopyPanel({
  text = "",
  headings: headingsProp,
  activeHeading,
  onJumpToHeading,
  onClose,
}: OutlineCanopyPanelProps) {
  const headings = useMemo(
    () => headingsProp ?? parseMarkdownHeadings(text),
    [headingsProp, text],
  );

  return (
    <aside
      data-outline-canopy-panel="true"
      className="outline-canopy-panel"
      aria-label="Canopy outline"
    >
      <div className="outline-canopy-panel-header">
        <div>
          <p className="outline-canopy-panel-title">
            <Leaf className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            Canopy
          </p>
          <p className="outline-canopy-panel-sub">Headings in this trail</p>
        </div>
        <button
          type="button"
          className="outline-canopy-panel-close"
          aria-label="Hide canopy"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {headings.length === 0 ? (
        <p className="outline-canopy-panel-empty">
          Headings appear as you grow this trail.
        </p>
      ) : (
        <ul className="outline-canopy-panel-list">
          {headings.map((h, i) => {
            const active = !!activeHeading && h.text === activeHeading;
            const depth = Math.max(0, h.level - 1);
            return (
              <li
                key={`${h.pos ?? h.text}-${i}`}
                className="outline-canopy-panel-li"
                data-heading-level={h.level}
                style={{ paddingLeft: depth * 0.85 + "rem" }}
              >
                <button
                  type="button"
                  className={`outline-canopy-panel-item${active ? " is-active" : ""}`}
                  data-heading-level={h.level}
                  aria-current={active ? "true" : undefined}
                  title={h.text}
                  onClick={() => onJumpToHeading(h)}
                >
                  {depth > 0 && (
                    <span className="outline-canopy-panel-branch" aria-hidden="true" />
                  )}
                  <span className="outline-canopy-panel-label">{h.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
