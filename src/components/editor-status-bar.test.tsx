import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EditorStatusBar } from "@/components/editor-status-bar";

const baseProps = {
  zoom: 100 as const,
  fontScale: 100 as const,
  viewWidth: "tablet" as const,
  wordCount: 12,
  readingMinutes: 1,
  charCount: 40,
  sessionWords: 0,
  updatedAt: new Date().toISOString(),
  canSave: true,
  isPlaintext: false,
  canEdit: true,
  onZoomChange: vi.fn(),
  onFontScaleChange: vi.fn(),
  onViewWidthChange: vi.fn(),
  outlineVisible: true,
  notesVisible: true,
  onToggleOutline: vi.fn(),
  onToggleNotes: vi.fn(),
  onOpenTemplates: vi.fn(),
};

describe("EditorStatusBar", () => {
  it("toggles outline and notes panels", () => {
    const onToggleOutline = vi.fn();
    const onToggleNotes = vi.fn();
    render(
      <EditorStatusBar
        {...baseProps}
        onToggleOutline={onToggleOutline}
        onToggleNotes={onToggleNotes}
      />,
    );

    const outline = screen.getByRole("button", { name: "Outline" });
    const notes = screen.getByRole("button", { name: "Notes" });
    expect(outline).toHaveAttribute("aria-pressed", "true");
    expect(notes).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(outline);
    fireEvent.click(notes);
    expect(onToggleOutline).toHaveBeenCalled();
    expect(onToggleNotes).toHaveBeenCalled();
  });

  it("steps zoom/font and opens templates overlay", () => {
    const onZoomChange = vi.fn();
    const onFontScaleChange = vi.fn();
    const onOpenTemplates = vi.fn();
    const onViewWidthChange = vi.fn();
    render(
      <EditorStatusBar
        {...baseProps}
        zoom={100}
        fontScale={100}
        onZoomChange={onZoomChange}
        onFontScaleChange={onFontScaleChange}
        onOpenTemplates={onOpenTemplates}
        onViewWidthChange={onViewWidthChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(onZoomChange).toHaveBeenCalledWith(110);

    fireEvent.click(screen.getByRole("button", { name: "Increase font size" }));
    expect(onFontScaleChange).toHaveBeenCalledWith(115);

    fireEvent.click(screen.getByTitle("Comfortable"));
    expect(onViewWidthChange).toHaveBeenCalledWith("comfortable");

    fireEvent.click(screen.getByRole("button", { name: "Templates" }));
    expect(onOpenTemplates).toHaveBeenCalled();
  });
});
