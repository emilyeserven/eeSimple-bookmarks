// @vitest-environment node
import { describe, expect, it } from "vitest";

import { cardBodyContainerClass, flexFlowClass, gapClass, zoneForm } from "./cardZoneLayoutClasses";

describe("zoneForm", () => {
  it("maps each body zone to its render form", () => {
    expect(zoneForm("card-labels")).toBe("label");
    expect(zoneForm("card-table")).toBe("table");
    expect(zoneForm("card-single-top")).toBe("single");
    expect(zoneForm("card-single-bottom")).toBe("single");
  });
});

describe("gapClass / flexFlowClass defaults", () => {
  it("defaults gap to md", () => {
    expect(gapClass({
      mode: "flex",
    })).toBe("gap-2");
    expect(gapClass({
      mode: "flex",
      gap: "lg",
    })).toBe("gap-4");
  });

  it("defaults wrap to flex-wrap and honors the fallback direction", () => {
    expect(flexFlowClass({
      mode: "flex",
    })).toBe("flex-row flex-wrap");
    expect(flexFlowClass({
      mode: "flex",
    }, "column")).toBe("flex-col flex-wrap");
    expect(flexFlowClass({
      mode: "flex",
      direction: "row",
      wrap: "nowrap",
    }, "column")).toBe("flex-row flex-nowrap");
  });
});

describe("cardBodyContainerClass", () => {
  it("label flex flows as a wrap row cross-aligned center by default", () => {
    expect(cardBodyContainerClass("label", {
      mode: "flex",
    })).toBe(
      "flex flex-row flex-wrap items-center gap-2 justify-start",
    );
  });

  it("label grid is a two-column grid cross-aligned center", () => {
    expect(cardBodyContainerClass("label", {
      mode: "grid",
      gap: "lg",
      alignItems: "start",
    })).toBe(
      "grid grid-cols-2 items-start gap-4",
    );
  });

  it("single flex stacks (column) cross-aligned stretch by default", () => {
    expect(cardBodyContainerClass("single", {
      mode: "flex",
    })).toBe(
      "flex flex-col flex-wrap items-stretch justify-start gap-2",
    );
  });

  it("single flex honors an explicit direction, wrap, align and vertical align", () => {
    expect(
      cardBodyContainerClass("single", {
        mode: "flex",
        direction: "row",
        wrap: "nowrap",
        align: "between",
        alignItems: "center",
        gap: "sm",
      }),
    ).toBe("flex flex-row flex-nowrap items-center justify-between gap-1");
  });

  it("single grid is a two-column grid cross-aligned stretch", () => {
    expect(cardBodyContainerClass("single", {
      mode: "grid",
    })).toBe(
      "grid grid-cols-2 items-stretch gap-2",
    );
  });
});
