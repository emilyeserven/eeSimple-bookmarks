// @vitest-environment node
import type { EntityLayoutRecord } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { formatLayoutIssueDebug } from "./layoutIssueDebug";

describe("formatLayoutIssueDebug", () => {
  it("produces a stable, prompt-ready blob with kind, timestamp, issues, and raw JSON", () => {
    const record: EntityLayoutRecord = {
      entityKind: "custom-property",
      layout: null,
      updatedAt: "2026-07-13T12:00:00.000Z",
      invalid: true,
      rawLayout: {
        foo: "bar",
      },
      issues: ["tabs is missing or not an array"],
    };
    expect(formatLayoutIssueDebug(record)).toBe(
      [
        "Entity layout issue",
        "Kind: custom-property",
        "Saved at: 2026-07-13T12:00:00.000Z",
        "Issues:",
        "- tabs is missing or not an array",
        "Raw stored layout:",
        "{\n  \"foo\": \"bar\"\n}",
      ].join("\n"),
    );
  });

  it("handles a record with no issues/rawLayout gracefully", () => {
    const record: EntityLayoutRecord = {
      entityKind: "tag",
      layout: null,
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const blob = formatLayoutIssueDebug(record);
    expect(blob).toContain("- (none reported)");
    expect(blob).toContain("null");
  });
});
