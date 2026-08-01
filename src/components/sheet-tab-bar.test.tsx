import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SheetTabBar } from "@/components/sheet-tab-bar";
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

describe("SheetTabBar", () => {
  it("shows the current sheet and New sheet when there is only one page", () => {
    render(
      <SheetTabBar
        sheets={[sheet({ sheet_id: "a", title: "Ideas", order: 0 })]}
        activeSheetId="a"
        canEdit
        switching={false}
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onReorder={vi.fn()}
      />,
    );

    expect(screen.getByRole("tab", { name: "Ideas" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add sheet" })).toBeTruthy();
  });

  it("lets the user switch sheets", () => {
    const onSelect = vi.fn();
    render(
      <SheetTabBar
        sheets={[
          sheet({ sheet_id: "a", title: "One", order: 0 }),
          sheet({ sheet_id: "b", title: "Two", order: 1 }),
        ]}
        activeSheetId="a"
        canEdit
        switching={false}
        onSelect={onSelect}
        onAdd={vi.fn()}
        onRename={vi.fn()}
        onDelete={vi.fn()}
        onReorder={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Two" }));
    expect(onSelect).toHaveBeenCalledWith("b");
  });
});
