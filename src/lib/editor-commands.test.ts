import { describe, it, expect, beforeEach } from "vitest";

import {
  dispatchEditorEvent,
  EDITOR_EVENTS,
  getEditorCommandContext,
  setEditorCommandContext,
} from "@/lib/editor-commands";

describe("editor-commands", () => {
  beforeEach(() => {
    setEditorCommandContext({
      sheets: [],
      activeSheetId: null,
      canSave: false,
      canLock: false,
      canEdit: false,
    });
  });

  it("stores command context for the palette", () => {
    setEditorCommandContext({
      sheets: [{ sheetId: "a", title: "Alpha" }],
      activeSheetId: "a",
      canSave: true,
      canLock: true,
      canEdit: true,
    });
    expect(getEditorCommandContext().sheets).toHaveLength(1);
    expect(getEditorCommandContext().canSave).toBe(true);
  });

  it("dispatches named editor events", () => {
    let received = false;
    const onFind = () => {
      received = true;
    };
    window.addEventListener(EDITOR_EVENTS.find, onFind);
    dispatchEditorEvent(EDITOR_EVENTS.find);
    window.removeEventListener(EDITOR_EVENTS.find, onFind);
    expect(received).toBe(true);
  });
});
