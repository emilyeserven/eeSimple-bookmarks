// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  clampSectionColumns,
  SECTION_COLUMN_OPTIONS,
  sectionColumnsClass,
  sectionColumnsEditorClass,
} from "./layoutColumns";

describe("clampSectionColumns", () => {
  it("defaults undefined / 0 / negative / NaN to 1", () => {
    expect(clampSectionColumns(undefined)).toBe(1);
    expect(clampSectionColumns(0)).toBe(1);
    expect(clampSectionColumns(-3)).toBe(1);
    expect(clampSectionColumns(Number.NaN)).toBe(1);
  });

  it("caps values above 4 at 4", () => {
    expect(clampSectionColumns(5)).toBe(4);
    expect(clampSectionColumns(99)).toBe(4);
  });

  it("passes 1–4 through and truncates fractional counts", () => {
    expect(clampSectionColumns(1)).toBe(1);
    expect(clampSectionColumns(2)).toBe(2);
    expect(clampSectionColumns(3)).toBe(3);
    expect(clampSectionColumns(4)).toBe(4);
    expect(clampSectionColumns(2.9)).toBe(2);
  });
});

describe("sectionColumnsClass (render)", () => {
  it("keeps the full-width stack for 1 column (byte-identical default)", () => {
    expect(sectionColumnsClass(undefined)).toBe("space-y-6");
    expect(sectionColumnsClass(1)).toBe("space-y-6");
  });

  it("uses a responsive grid that stacks below md for 2–4 columns", () => {
    expect(sectionColumnsClass(2)).toBe("grid gap-6 md:grid-cols-2");
    expect(sectionColumnsClass(3)).toBe("grid gap-6 md:grid-cols-3");
    expect(sectionColumnsClass(4)).toBe("grid gap-6 md:grid-cols-4");
  });

  it("clamps a stale stored value to a known class", () => {
    expect(sectionColumnsClass(7)).toBe("grid gap-6 md:grid-cols-4");
  });
});

describe("sectionColumnsEditorClass (preview)", () => {
  it("uses a fixed grid at 1/N width for every count, including a single full-width column", () => {
    expect(sectionColumnsEditorClass(1)).toBe("grid grid-cols-1 gap-1.5");
    expect(sectionColumnsEditorClass(2)).toBe("grid grid-cols-2 gap-1.5");
    expect(sectionColumnsEditorClass(3)).toBe("grid grid-cols-3 gap-1.5");
    expect(sectionColumnsEditorClass(4)).toBe("grid grid-cols-4 gap-1.5");
  });
});

describe("SECTION_COLUMN_OPTIONS", () => {
  it("offers 1 through 4", () => {
    expect([...SECTION_COLUMN_OPTIONS]).toEqual([1, 2, 3, 4]);
  });
});
