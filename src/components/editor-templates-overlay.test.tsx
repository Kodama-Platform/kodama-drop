import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EditorTemplatesOverlay } from "@/components/editor-templates-overlay";

describe("EditorTemplatesOverlay", () => {
  it("applies a template and closes", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<EditorTemplatesOverlay open onClose={onClose} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole("button", { name: /Meeting notes/i }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "meeting", label: "Meeting notes" }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("does not render when closed", () => {
    render(
      <EditorTemplatesOverlay open={false} onClose={() => {}} onSelect={() => {}} />,
    );
    expect(screen.queryByRole("dialog", { name: "Note templates" })).not.toBeInTheDocument();
  });
});
