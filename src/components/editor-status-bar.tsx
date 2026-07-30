import { useEffect, useState } from "react";
import {
  CloudOff,
  FileText,
  LayoutTemplate,
  ListTree,
  Minus,
  Plus,
  ShieldCheck,
} from "lucide-react";

import {
  type EditorFontScale,
  type EditorViewWidth,
  type EditorZoom,
  stepEditorFontScale,
  stepEditorZoom,
} from "@/lib/editor-view-prefs";
import { formatRelativeTime } from "@/lib/relative-time";

type EditorStatusBarProps = {
  zoom: EditorZoom;
  fontScale: EditorFontScale;
  viewWidth: EditorViewWidth;
  wordCount: number;
  readingMinutes: number;
  charCount: number;
  sessionWords: number;
  updatedAt: string;
  canSave: boolean;
  isPlaintext: boolean;
  canEdit: boolean;
  onZoomChange: (zoom: EditorZoom) => void;
  onFontScaleChange: (scale: EditorFontScale) => void;
  onViewWidthChange: (width: EditorViewWidth) => void;
  outlineVisible: boolean;
  notesVisible: boolean;
  onToggleOutline: () => void;
  onToggleNotes: () => void;
  onOpenTemplates: () => void;
};

const WIDTH_OPTIONS: { value: EditorViewWidth; label: string; short: string }[] = [
  { value: "comfortable", label: "Comfortable", short: "Comfy" },
  { value: "tablet", label: "Tablet", short: "Tablet" },
  { value: "full", label: "Full", short: "Full" },
];

export function EditorStatusBar({
  zoom,
  fontScale,
  viewWidth,
  wordCount,
  readingMinutes,
  charCount,
  sessionWords,
  updatedAt,
  canSave,
  isPlaintext,
  canEdit,
  onZoomChange,
  onFontScaleChange,
  onViewWidthChange,
  outlineVisible,
  notesVisible,
  onToggleOutline,
  onToggleNotes,
  onOpenTemplates,
}: EditorStatusBarProps) {
  const [metaExpanded, setMetaExpanded] = useState(false);

  return (
    <footer
      data-editor-chrome="true"
      data-editor-status-bar="true"
      className="editor-status-bar"
    >
      <div className="editor-status-bar-inner">
        <div className="editor-status-cluster">
          <div className="editor-status-group" role="group" aria-label="Zoom">
            <button
              type="button"
              className="editor-status-btn"
              aria-label="Zoom out"
              title="Zoom out (including images)"
              disabled={zoom <= 75}
              onClick={() => onZoomChange(stepEditorZoom(zoom, -1))}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="editor-status-zoom-label" aria-live="polite">
              {zoom}%
            </span>
            <button
              type="button"
              className="editor-status-btn"
              aria-label="Zoom in"
              title="Zoom in (including images)"
              disabled={zoom >= 125}
              onClick={() => onZoomChange(stepEditorZoom(zoom, 1))}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="editor-status-group" role="group" aria-label="Font size">
            <button
              type="button"
              className="editor-status-btn"
              aria-label="Decrease font size"
              title="Smaller text"
              disabled={fontScale <= 85}
              onClick={() => onFontScaleChange(stepEditorFontScale(fontScale, -1))}
            >
              <span className="editor-status-font-label" aria-hidden="true">
                A−
              </span>
            </button>
            <span className="editor-status-zoom-label" aria-live="polite">
              {fontScale}%
            </span>
            <button
              type="button"
              className="editor-status-btn"
              aria-label="Increase font size"
              title="Larger text"
              disabled={fontScale >= 130}
              onClick={() => onFontScaleChange(stepEditorFontScale(fontScale, 1))}
            >
              <span className="editor-status-font-label" aria-hidden="true">
                A+
              </span>
            </button>
          </div>

          <div
            className="editor-status-segment"
            role="group"
            aria-label="View width"
          >
            {WIDTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`editor-status-segment-btn${viewWidth === opt.value ? " is-active" : ""}`}
                aria-pressed={viewWidth === opt.value}
                title={opt.label}
                onClick={() => onViewWidthChange(opt.value)}
              >
                <span className="hidden sm:inline">{opt.label}</span>
                <span className="sm:hidden">{opt.short}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="editor-status-cluster">
          <button
            type="button"
            className={`editor-status-btn editor-status-btn--label${outlineVisible ? " is-active" : ""}`}
            title="Outline"
            aria-label="Outline"
            aria-pressed={outlineVisible}
            onClick={onToggleOutline}
          >
            <ListTree className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Outline</span>
          </button>
          <button
            type="button"
            className={`editor-status-btn editor-status-btn--label${notesVisible ? " is-active" : ""}`}
            title="Notes"
            aria-label="Notes"
            aria-pressed={notesVisible}
            onClick={onToggleNotes}
          >
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Notes</span>
          </button>
          <button
            type="button"
            className="editor-status-btn editor-status-btn--label"
            title="Templates"
            aria-label="Templates"
            disabled={!canEdit}
            onClick={onOpenTemplates}
          >
            <LayoutTemplate className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Templates</span>
          </button>
        </div>

        <div className="editor-status-meta">
          <button
            type="button"
            className="editor-footer-meta"
            aria-expanded={metaExpanded}
            onClick={() => setMetaExpanded((v) => !v)}
            title={
              isPlaintext
                ? "Note stats · Saved in this browser"
                : "Note stats · End-to-end encrypted"
            }
          >
            <span className="inline-flex min-w-0 items-center gap-2 truncate">
              <span>{wordCount.toLocaleString()} words</span>
              <span className="text-muted-foreground/50">·</span>
              <span className="truncate">
                Updated <RelTime iso={updatedAt} />
              </span>
            </span>
            {isPlaintext ? (
              <CloudOff
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                aria-label="Saved locally in this browser"
              />
            ) : (
              <ShieldCheck
                className="h-3.5 w-3.5 shrink-0 text-primary/80"
                aria-label="End-to-end encrypted"
              />
            )}
          </button>
          {metaExpanded && (
            <div className="editor-footer-details">
              <span>{readingMinutes} min read</span>
              <span>{charCount.toLocaleString()} chars</span>
              {canSave && sessionWords > 0 && (
                <span className="text-primary">
                  +{sessionWords.toLocaleString()} this session
                </span>
              )}
              {isPlaintext ? (
                <span className="inline-flex items-center gap-1 normal-case tracking-normal">
                  <CloudOff className="h-3 w-3 text-muted-foreground" />
                  Saved in this browser only
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 normal-case tracking-normal">
                  <ShieldCheck className="h-3 w-3 text-primary" />
                  End-to-end encrypted
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

function RelTime({ iso }: { iso: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, []);
  const label = formatRelativeTime(iso);
  if (!label) return null;
  return <span>{label}</span>;
}
