import { afterEach, describe, expect, it } from "vitest";

import {
  EDITOR_FONT_SCALE_STEPS,
  EDITOR_ZOOM_STEPS,
  getEditorFontScale,
  getEditorViewWidth,
  getEditorZoom,
  setEditorFontScale,
  setEditorViewWidth,
  setEditorZoom,
  stepEditorFontScale,
  stepEditorZoom,
} from "@/lib/editor-view-prefs";

afterEach(() => {
  localStorage.clear();
});

describe("editor-view-prefs", () => {
  it("defaults zoom, font scale, and view width", () => {
    expect(getEditorZoom()).toBe(100);
    expect(getEditorFontScale()).toBe(100);
    expect(getEditorViewWidth()).toBe("tablet");
  });

  it("persists zoom and steps within range", () => {
    setEditorZoom(90);
    expect(getEditorZoom()).toBe(90);
    expect(stepEditorZoom(75, -1)).toBe(75);
    expect(stepEditorZoom(125, 1)).toBe(125);
    expect(stepEditorZoom(100, 1)).toBe(110);
    expect(EDITOR_ZOOM_STEPS.includes(getEditorZoom())).toBe(true);
  });

  it("persists font scale and steps within range", () => {
    setEditorFontScale(115);
    expect(getEditorFontScale()).toBe(115);
    expect(stepEditorFontScale(85, -1)).toBe(85);
    expect(stepEditorFontScale(130, 1)).toBe(130);
    expect(stepEditorFontScale(100, 1)).toBe(115);
    expect(EDITOR_FONT_SCALE_STEPS.includes(getEditorFontScale())).toBe(true);
  });

  it("persists view width and rejects unknown values", () => {
    setEditorViewWidth("full");
    expect(getEditorViewWidth()).toBe("full");
    localStorage.setItem("kodama-editor-view-width", "huge");
    expect(getEditorViewWidth()).toBe("tablet");
  });
});
