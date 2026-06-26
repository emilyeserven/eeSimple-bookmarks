import { describe, expect, it } from "vitest";

import { resolvePropertiesVisibility } from "./filterSections";
import { makeCustomProperty } from "../test-utils/factories";

const props = [
  makeCustomProperty({
    id: "p1",
    name: "Rating",
  }),
  makeCustomProperty({
    id: "p2",
    name: "Page Count",
  }),
];

describe("resolvePropertiesVisibility", () => {
  it("hides the section when there are no properties", () => {
    const r = resolvePropertiesVisibility({
      filter: "",
      propertiesLabelMatch: true,
      hasProperties: false,
      enabledProperties: [],
    });
    expect(r.showProperties).toBe(false);
    expect(r.propertyNameFilter).toBeUndefined();
  });

  it("shows the section with no name filter when the search matches the section label", () => {
    const r = resolvePropertiesVisibility({
      filter: "prop",
      propertiesLabelMatch: true,
      hasProperties: true,
      enabledProperties: props,
    });
    expect(r.showProperties).toBe(true);
    expect(r.propertyNameFilter).toBeUndefined();
  });

  it("shows the section and sets a name filter when a property name matches the search", () => {
    const r = resolvePropertiesVisibility({
      filter: "rat",
      propertiesLabelMatch: false,
      hasProperties: true,
      enabledProperties: props,
    });
    expect(r.showProperties).toBe(true);
    expect(r.propertyNameFilter).toBe("rat");
  });

  it("hides the section when the search matches neither the label nor any property name", () => {
    const r = resolvePropertiesVisibility({
      filter: "zzz",
      propertiesLabelMatch: false,
      hasProperties: true,
      enabledProperties: props,
    });
    expect(r.showProperties).toBe(false);
    expect(r.propertyNameFilter).toBe("zzz");
  });

  it("shows all properties when there is no search text", () => {
    const r = resolvePropertiesVisibility({
      filter: "",
      propertiesLabelMatch: true,
      hasProperties: true,
      enabledProperties: props,
    });
    expect(r.showProperties).toBe(true);
    expect(r.propertyNameFilter).toBeUndefined();
  });
});
