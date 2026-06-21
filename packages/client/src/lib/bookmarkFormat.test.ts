import { describe, expect, it } from "vitest";

import { formatBoolean, formatBooleanBadge, formatDuration, formatNumber } from "./bookmarkFormat";
import { makeCustomProperty as property } from "../test-utils/factories";

describe("formatNumber", () => {
  it("returns the bare value when the property has no units", () => {
    expect(formatNumber(5, property({}))).toBe("5");
  });

  it("uses the singular unit for a value of one", () => {
    expect(formatNumber(1, property({
      unitSingular: "star",
      unitPlural: "stars",
    }))).toBe("1 star");
  });

  it("uses the plural unit for a value other than one", () => {
    expect(formatNumber(3, property({
      unitSingular: "star",
      unitPlural: "stars",
    }))).toBe("3 stars");
  });

  it("falls back to whichever unit is defined", () => {
    expect(formatNumber(2, property({
      unitSingular: "point",
    }))).toBe("2 point");
    expect(formatNumber(1, property({
      unitPlural: "points",
    }))).toBe("1 points");
  });

  it("prepends the value prefix, with and without a unit", () => {
    expect(formatNumber(5, property({
      valuePrefix: "$",
    }))).toBe("$5");
    expect(formatNumber(5, property({
      valuePrefix: "$",
      unitPlural: "each",
    }))).toBe("$5 each");
  });

  it("shows the zero label for a value of zero, ignoring prefix and unit", () => {
    expect(formatNumber(0, property({
      zeroLabel: "Free",
      valuePrefix: "$",
      unitPlural: "dollars",
    }))).toBe("Free");
  });

  it("shows the bare value at zero when no zero label is set", () => {
    expect(formatNumber(0, property({
      valuePrefix: "$",
    }))).toBe("$0");
  });

  it("shows the max label once the value reaches the maximum", () => {
    expect(formatNumber(5, property({
      numberMax: 5,
      maxLabel: "Unlimited",
    }))).toBe("Unlimited");
    expect(formatNumber(7, property({
      numberMax: 5,
      maxLabel: "Unlimited",
    }))).toBe("Unlimited");
  });

  it("does not apply the max label below the maximum or when no maximum is set", () => {
    expect(formatNumber(4, property({
      numberMax: 5,
      maxLabel: "Unlimited",
    }))).toBe("4");
    expect(formatNumber(5, property({
      maxLabel: "Unlimited",
    }))).toBe("5");
  });

  it("formats a duration property as a clock, ignoring unit/label knobs", () => {
    expect(formatNumber(260, property({
      numberFormat: "duration",
      unitPlural: "seconds",
    }))).toBe("4:20");
    expect(formatNumber(3723, property({
      numberFormat: "duration",
    }))).toBe("1:02:03");
  });
});

describe("formatBoolean hideIcon", () => {
  it("renders the icon glyph by default and falls back to text when the icon is hidden", () => {
    const icons = property({
      type: "boolean",
      booleanLabelPreset: "icons",
    });
    expect(formatBoolean(true, icons)).toBe("✓");
    expect(formatBoolean(true, icons, {
      hideIcon: true,
    })).toBe("Yes");
    expect(formatBoolean(false, icons, {
      hideIcon: true,
    })).toBe("No");
  });

  it("prefers the property's custom true/false labels when hiding a stars glyph", () => {
    const stars = property({
      type: "boolean",
      booleanLabelPreset: "stars",
      booleanTrueLabel: "Favorite",
      booleanFalseLabel: "Skip",
    });
    expect(formatBoolean(true, stars)).toBe("★");
    expect(formatBoolean(true, stars, {
      hideIcon: true,
    })).toBe("Favorite");
    expect(formatBoolean(false, stars, {
      hideIcon: true,
    })).toBe("Skip");
  });

  it("leaves non-icon presets unchanged when hideIcon is set", () => {
    const yesNo = property({
      type: "boolean",
      booleanLabelPreset: "yes-no",
    });
    expect(formatBoolean(true, yesNo, {
      hideIcon: true,
    })).toBe("Yes");
  });
});

describe("formatBooleanBadge hideIcon", () => {
  it("switches an icon preset to the ordinary `Name: value` form when the icon is hidden", () => {
    const icons = property({
      name: "Watched",
      type: "boolean",
      booleanLabelPreset: "icons",
    });
    expect(formatBooleanBadge(true, icons)).toBe("Watched: ✓");
    expect(formatBooleanBadge(true, icons, {
      hideIcon: true,
    })).toBe("Watched: Yes");
  });

  it("shows only the text value when both label and icon are hidden", () => {
    const icons = property({
      name: "Watched",
      type: "boolean",
      booleanLabelPreset: "icons",
    });
    expect(formatBooleanBadge(true, icons, {
      hideLabel: true,
      hideIcon: true,
    })).toBe("Yes");
  });
});

describe("formatDuration", () => {
  it("uses M:SS below an hour and H:MM:SS at or above an hour", () => {
    expect(formatDuration(5)).toBe("0:05");
    expect(formatDuration(75)).toBe("1:15");
    expect(formatDuration(3600)).toBe("1:00:00");
  });

  it("clamps non-positive or non-finite values to 0:00", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(-10)).toBe("0:00");
    expect(formatDuration(Number.NaN)).toBe("0:00");
  });
});
