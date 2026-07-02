// @vitest-environment node
import { describe, expect, it } from "vitest";

import { buildPropertyQuickSearch, shiftDateTime } from "./bookmarkPropertyQuickFilter";
import { makeCustomProperty as property } from "../test-utils/factories";

describe("buildPropertyQuickSearch", () => {
  it("filters a number property to its exact value by default", () => {
    const search = buildPropertyQuickSearch(property({
      type: "number",
    }), 20);
    expect(search.num).toEqual({
      prop: [20, 20],
    });
  });

  it("widens a number property to value ± quickFilterRange", () => {
    const search = buildPropertyQuickSearch(
      property({
        type: "number",
        quickFilterRange: 5,
      }),
      20,
    );
    expect(search.num).toEqual({
      prop: [15, 25],
    });
  });

  it("treats a duration range (stored as seconds) like any number range", () => {
    const search = buildPropertyQuickSearch(
      property({
        type: "number",
        numberFormat: "duration",
        quickFilterRange: 90,
      }),
      600,
    );
    expect(search.num).toEqual({
      prop: [510, 690],
    });
  });

  it("uses an exact value for rating and calculate (no ± range)", () => {
    expect(
      buildPropertyQuickSearch(property({
        type: "ratingScale",
        quickFilterRange: 2,
      }), 4).num,
    ).toEqual({
      prop: [4, 4],
    });
    expect(
      buildPropertyQuickSearch(property({
        type: "calculate",
        quickFilterRange: 2,
      }), 7).num,
    ).toEqual({
      prop: [7, 7],
    });
  });

  it("filters a boolean property to its value", () => {
    expect(buildPropertyQuickSearch(property({
      type: "boolean",
    }), true).bool).toEqual({
      prop: true,
    });
    expect(buildPropertyQuickSearch(property({
      type: "boolean",
    }), false).bool).toEqual({
      prop: false,
    });
  });

  it("filters a datetime property to its exact value by default", () => {
    const search = buildPropertyQuickSearch(
      property({
        type: "datetime",
        dateTimeFormat: "date",
      }),
      "2026-06-15",
    );
    expect(search.date).toEqual({
      prop: ["2026-06-15", "2026-06-15"],
    });
  });

  it("shifts a datetime range by ± quickFilterRange seconds", () => {
    const search = buildPropertyQuickSearch(
      // 2 days in seconds.
      property({
        type: "datetime",
        dateTimeFormat: "date",
        quickFilterRange: 172_800,
      }),
      "2026-06-15",
    );
    expect(search.date).toEqual({
      prop: ["2026-06-13", "2026-06-17"],
    });
  });

  it("uses presence for image and file properties", () => {
    expect(buildPropertyQuickSearch(property({
      type: "image",
    }), "url").presence).toEqual({
      prop: "has",
    });
    expect(buildPropertyQuickSearch(property({
      type: "file",
    }), "url").presence).toEqual({
      prop: "has",
    });
  });
});

describe("shiftDateTime", () => {
  it("shifts a time within the day and clamps at the edges", () => {
    expect(shiftDateTime("10:00", "time", 30 * 60)).toBe("10:30");
    expect(shiftDateTime("10:00", "time", -30 * 60)).toBe("09:30");
    expect(shiftDateTime("00:05", "time", -30 * 60)).toBe("00:00");
    expect(shiftDateTime("23:50", "time", 30 * 60)).toBe("23:59");
  });

  it("shifts a datetime across hours", () => {
    expect(shiftDateTime("2026-06-15T10:00", "datetime", 90 * 60)).toBe("2026-06-15T11:30");
  });
});
