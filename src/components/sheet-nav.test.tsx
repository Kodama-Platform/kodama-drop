import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SheetNav } from "@/components/sheet-nav";
import type { WorkbookSheet } from "@/lib/workbook";

function sheet(partial: Partial<WorkbookSheet> & Pick<WorkbookSheet, "sheet_id" | "title">): WorkbookSheet {
  return {
    order: 0,
    markdown: "",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("SheetNav", () => {
  it("marks the active sheet and calls onSelect", () => {
    const onSelect = vi.fn();
    const sheets = [
      sheet({ sheet_id: "a", title: "Alpha", order: 0, markdown: "First body" }),
      sheet({ sheet_id: "b", title: "Beta", order: 1, markdown: "Second body" }),
    ];

    render(
      <SheetNav
        sheets={sheets}
        activeSheetId="a"
        canEdit
        onSelect={onSelect}
        onAdd={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onReorder={() => {}}
      />,
    );

    const alpha = screen.getByRole("option", { name: /Alpha/i });
    const beta = screen.getByRole("option", { name: /Beta/i });
    expect(alpha).toHaveAttribute("aria-selected", "true");
    expect(beta).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.queryByText("First body")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open Beta" }));
    expect(onSelect).toHaveBeenCalledWith("b");
  });

  it("shows relative updated time instead of markdown preview", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-30T12:00:00.000Z"));

    render(
      <SheetNav
        sheets={[
          sheet({
            sheet_id: "a",
            title: "Alpha",
            markdown: "stale body",
            updated_at: "2026-07-30T11:58:00.000Z",
          }),
        ]}
        activeSheetId="a"
        activeMarkdown="Live typing preview"
        canEdit={false}
        onSelect={() => {}}
        onAdd={() => {}}
        onRename={() => {}}
        onDelete={() => {}}
        onReorder={() => {}}
      />,
    );

    expect(screen.getByText("2m ago")).toBeInTheDocument();
    expect(screen.queryByText("Live typing preview")).not.toBeInTheDocument();
    expect(screen.queryByText("stale body")).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
