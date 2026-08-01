import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OutlineCanopyPanel } from "@/components/outline-canopy-panel";

describe("OutlineCanopyPanel", () => {
  it("renders nested headings and jumps on click", () => {
    const onJump = vi.fn();
    render(
      <OutlineCanopyPanel
        text={"# Roots\n\nBody\n\n## Branches\n\n### Twigs\n"}
        activeHeading="Roots"
        onJumpToHeading={onJump}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Canopy")).toBeTruthy();
    expect(screen.getByText("Headings in this trail")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Roots" }).dataset.headingLevel).toBe("1");
    expect(screen.getByRole("button", { name: "Branches" }).dataset.headingLevel).toBe("2");
    expect(screen.getByRole("button", { name: "Twigs" }).dataset.headingLevel).toBe("3");
    fireEvent.click(screen.getByRole("button", { name: "Twigs" }));
    expect(onJump).toHaveBeenCalledWith({ level: 3, text: "Twigs" });
  });

  it("prefers live headings with document positions", () => {
    const onJump = vi.fn();
    render(
      <OutlineCanopyPanel
        headings={[
          { level: 1, text: "Live root", pos: 12 },
          { level: 2, text: "Live branch", pos: 40 },
        ]}
        onJumpToHeading={onJump}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Live branch" }));
    expect(onJump).toHaveBeenCalledWith({ level: 2, text: "Live branch", pos: 40 });
  });

  it("shows empty copy when there are no headings", () => {
    render(
      <OutlineCanopyPanel
        text="Just a paragraph."
        onJumpToHeading={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Headings appear as you grow this trail.")).toBeTruthy();
  });
});
