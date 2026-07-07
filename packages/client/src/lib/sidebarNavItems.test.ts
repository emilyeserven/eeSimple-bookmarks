// @vitest-environment node
import { describe, expect, it } from "vitest";

import { actionItems, customizationItems, navItems, taxonomyItems } from "./sidebarNavItems";

describe("sidebarNavItems", () => {
  it("has globally unique `to` values across every list", () => {
    const allTos = [...navItems, ...taxonomyItems, ...actionItems, ...customizationItems]
      .map(item => item.to);
    expect(new Set(allTos).size).toBe(allTos.length);
  });

  it("has unique `key` values within taxonomyItems", () => {
    const keys = taxonomyItems.map(item => item.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has unique `key` values within customizationItems", () => {
    const keys = customizationItems.map(item => item.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("gives every item a truthy title and a defined icon", () => {
    for (const item of [...navItems, ...taxonomyItems, ...actionItems, ...customizationItems]) {
      expect(item.title).toBeTruthy();
      expect(item.icon).toBeDefined();
    }
  });
});
