import { describe, expect, it } from "vitest";

import { formatRelativeTime } from "@/lib/relative-time";

describe("formatRelativeTime", () => {
  it("formats recent and older timestamps", () => {
    const now = Date.parse("2026-07-30T12:00:00.000Z");
    expect(formatRelativeTime("2026-07-30T11:59:58.000Z", now)).toBe("just now");
    expect(formatRelativeTime("2026-07-30T11:55:00.000Z", now)).toBe("5m ago");
    expect(formatRelativeTime("2026-07-30T09:00:00.000Z", now)).toBe("3h ago");
    expect(formatRelativeTime("bad", now)).toBe("");
  });
});
