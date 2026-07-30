export type EditorSheetRef = {
  sheetId: string;
  title: string;
};

export type EditorCommandContext = {
  sheets: EditorSheetRef[];
  activeSheetId: string | null;
  canSave: boolean;
  canLock: boolean;
  canEdit: boolean;
};

let context: EditorCommandContext = {
  sheets: [],
  activeSheetId: null,
  canSave: false,
  canLock: false,
  canEdit: false,
};

export function setEditorCommandContext(next: EditorCommandContext): void {
  context = next;
}

export function getEditorCommandContext(): EditorCommandContext {
  return context;
}

export const EDITOR_EVENTS = {
  find: "kodama:find",
  findReplace: "kodama:find-replace",
  save: "kodama:save",
  lock: "kodama:lock",
  appearance: "kodama:appearance",
  shortcuts: "kodama:shortcuts",
  outline: "kodama:outline",
  export: "kodama:export",
  toggleFocus: "kodama:toggle-focus",
  toggleMarkdownView: "kodama:toggle-markdown-view",
  switchSheet: "kodama:switch-sheet",
} as const;

export function dispatchEditorEvent(
  name: (typeof EDITOR_EVENTS)[keyof typeof EDITOR_EVENTS],
  detail?: unknown,
): void {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}
