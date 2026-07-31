export const EDITOR_ZOOM_STEPS = [75, 90, 100, 110, 125] as const;
export type EditorZoom = (typeof EDITOR_ZOOM_STEPS)[number];

/** Text size only (does not scale images). */
export const EDITOR_FONT_SCALE_STEPS = [85, 100, 115, 130] as const;
export type EditorFontScale = (typeof EDITOR_FONT_SCALE_STEPS)[number];

export type EditorViewWidth = "comfortable" | "tablet" | "full";

const ZOOM_KEY = "kodama-editor-zoom";
const FONT_KEY = "kodama-editor-font-scale";
const WIDTH_KEY = "kodama-editor-view-width";
const DEFAULT_ZOOM: EditorZoom = 100;
const DEFAULT_FONT: EditorFontScale = 100;
const DEFAULT_WIDTH: EditorViewWidth = "comfortable";

function isZoom(value: number): value is EditorZoom {
  return (EDITOR_ZOOM_STEPS as readonly number[]).includes(value);
}

function isFontScale(value: number): value is EditorFontScale {
  return (EDITOR_FONT_SCALE_STEPS as readonly number[]).includes(value);
}

function isViewWidth(value: string): value is EditorViewWidth {
  return value === "comfortable" || value === "tablet" || value === "full";
}

export function getEditorZoom(): EditorZoom {
  try {
    const raw = Number(localStorage.getItem(ZOOM_KEY));
    return isZoom(raw) ? raw : DEFAULT_ZOOM;
  } catch {
    return DEFAULT_ZOOM;
  }
}

export function setEditorZoom(zoom: EditorZoom): void {
  try {
    localStorage.setItem(ZOOM_KEY, String(zoom));
  } catch {
    /* ignore quota / private mode */
  }
}

export function stepEditorZoom(current: EditorZoom, direction: 1 | -1): EditorZoom {
  const idx = EDITOR_ZOOM_STEPS.indexOf(current);
  const next = Math.max(0, Math.min(EDITOR_ZOOM_STEPS.length - 1, idx + direction));
  return EDITOR_ZOOM_STEPS[next] ?? DEFAULT_ZOOM;
}

export function getEditorFontScale(): EditorFontScale {
  try {
    const raw = Number(localStorage.getItem(FONT_KEY));
    return isFontScale(raw) ? raw : DEFAULT_FONT;
  } catch {
    return DEFAULT_FONT;
  }
}

export function setEditorFontScale(scale: EditorFontScale): void {
  try {
    localStorage.setItem(FONT_KEY, String(scale));
  } catch {
    /* ignore quota / private mode */
  }
}

export function stepEditorFontScale(
  current: EditorFontScale,
  direction: 1 | -1,
): EditorFontScale {
  const idx = EDITOR_FONT_SCALE_STEPS.indexOf(current);
  const next = Math.max(0, Math.min(EDITOR_FONT_SCALE_STEPS.length - 1, idx + direction));
  return EDITOR_FONT_SCALE_STEPS[next] ?? DEFAULT_FONT;
}

export function getEditorViewWidth(): EditorViewWidth {
  try {
    const raw = localStorage.getItem(WIDTH_KEY) ?? "";
    return isViewWidth(raw) ? raw : DEFAULT_WIDTH;
  } catch {
    return DEFAULT_WIDTH;
  }
}

export function setEditorViewWidth(width: EditorViewWidth): void {
  try {
    localStorage.setItem(WIDTH_KEY, width);
  } catch {
    /* ignore quota / private mode */
  }
}

export function editorViewWidthLabel(width: EditorViewWidth): string {
  switch (width) {
    case "comfortable":
      return "Narrow";
    case "tablet":
      return "Wide";
    case "full":
      return "Full width";
  }
}
