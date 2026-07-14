// @vitest-environment node
import { describe, expect, it } from "vitest";

import { buildHomepageSectionInitialValues } from "./homepageSectionForm";
import { makeHomepageSection } from "../test-utils/factories";

describe("buildHomepageSectionInitialValues", () => {
  it("returns all defaults for a brand-new section (no section, no default zones)", () => {
    const values = buildHomepageSectionInitialValues(undefined, undefined, []);
    expect(values.title).toBe("");
    expect(values.description).toBe("");
    expect(values.columns).toBe(2);
    expect(values.imageMode).toBe("natural");
    expect(values.imageLayout).toBe("above");
    expect(values.imageVisibility).toBe("shown");
    expect(values.viewMode).toBe("cards");
    expect(values.hideIfEmpty).toBe(false);
    expect(values.hideWebsiteForYouTube).toBe(false);
    expect(values.conditions.children).toEqual([]);
    expect(values.sort).toBeNull();
  });

  it("carries over the editing section's values", () => {
    const section = makeHomepageSection({
      id: "s1",
      title: "My Section",
      description: "Desc",
      columns: 4,
      imageMode: "cropped",
      viewMode: "table",
      hideIfEmpty: true,
      hideWebsiteForYouTube: true,
      sort: {
        primary: {
          field: "title",
          direction: "asc",
        },
      },
    });
    const values = buildHomepageSectionInitialValues(section, undefined, []);
    expect(values.title).toBe("My Section");
    expect(values.description).toBe("Desc");
    expect(values.columns).toBe(4);
    expect(values.imageMode).toBe("cropped");
    expect(values.viewMode).toBe("table");
    expect(values.hideIfEmpty).toBe(true);
    expect(values.hideWebsiteForYouTube).toBe(true);
    expect(values.sort).toEqual({
      primary: {
        field: "title",
        direction: "asc",
      },
    });
  });

  it("prefers the section zones, then the default-rule zones, then standard defaults", () => {
    const defaultZones = {
      marker: "from-default-rule",
    } as never;
    const values = buildHomepageSectionInitialValues(undefined, defaultZones, []);
    expect(values.fieldZones).toBe(defaultZones);
  });
});
