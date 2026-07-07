// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  advancedNav,
  automationsNav,
  displayNav,
  locationsNav,
  mediaNav,
  SETTINGS_TAB_SECTIONS,
} from "./settingsNav";

const ALL_NAVS = [displayNav, mediaNav, automationsNav, locationsNav, advancedNav];

describe("settingsNav", () => {
  it("has unique `to` values within each nav", () => {
    for (const nav of ALL_NAVS) {
      const tos = nav.map(item => item.to);
      expect(new Set(tos).size).toBe(tos.length);
    }
  });

  it("has globally unique `to` values across every nav", () => {
    const allTos = ALL_NAVS.flat().map(item => item.to);
    expect(new Set(allTos).size).toBe(allTos.length);
  });

  it("gives every item a truthy label and a defined icon", () => {
    for (const nav of ALL_NAVS) {
      for (const item of nav) {
        expect(item.label).toBeTruthy();
        expect(item.icon).toBeDefined();
      }
    }
  });

  it("has exactly 5 tabbed settings sections in the expected order", () => {
    expect(SETTINGS_TAB_SECTIONS.map(s => s.section)).toEqual([
      "Display",
      "Media",
      "Automations",
      "Locations",
      "Advanced",
    ]);
  });

  it("pairs each section with its own nav array", () => {
    const expected = [
      ["Display", displayNav],
      ["Media", mediaNav],
      ["Automations", automationsNav],
      ["Locations", locationsNav],
      ["Advanced", advancedNav],
    ] as const;
    for (const [section, nav] of expected) {
      const entry = SETTINGS_TAB_SECTIONS.find(s => s.section === section);
      expect(entry?.items).toEqual(nav);
    }
  });

  it("has every item's `to` start with its section's path", () => {
    for (const {
      path, items,
    } of SETTINGS_TAB_SECTIONS) {
      for (const item of items) {
        expect(item.to?.startsWith(`${path}/`)).toBe(true);
      }
    }
  });
});
