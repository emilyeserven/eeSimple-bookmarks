import type { EntityLayout } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { locationWorkbench } from "./location";
import { shape } from "./workbenchLayoutTestUtils";

/**
 * The #1191 location analogue of `bookmarkLayout.test.tsx`: the former single `general` composite is now
 * atomized into per-row fields, so this snapshots the chosen unified tab / section / field-key order and
 * the parity-by-construction split — edit-only rows (name, geoLookup, usesWikidataCoordinates, plusCode,
 * ancestors, alternateNames, tags, labeledWebsites, genreMoods) drop in view; view-only rows (slug,
 * childrenCount, bookmarkCount, created, map) drop in edit, and the view-only Hierarchy tab drops in
 * edit. Renderers are never invoked — only the pure order/visibility helpers (so the map never mounts).
 * The tab-key-only check stays in `batch2Layouts.test.tsx`; this adds the field-level detail.
 */

describe("location default layout", () => {
  it("renders the view tab/section/field order (edit-only rows dropped, Hierarchy present)", () => {
    expect(shape(locationWorkbench, "view")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: [
            "slug",
            "primaryLanguage",
            "names",
            "description",
            "coordinates",
            "mapUrl",
            "placeType",
            "countryCode",
            "officialLink",
            "wikipediaLinks",
            "parent",
            "childrenCount",
            "bookmarkCount",
            "created",
            "map",
          ],
        }],
      },
      {
        key: "hierarchy",
        group: undefined,
        sections: [{
          key: "hierarchy",
          fields: ["hierarchy"],
        }],
      },
      {
        key: "autofill",
        group: undefined,
        sections: [{
          key: "autofill",
          fields: ["autofillRules"],
        }],
      },
    ]);
  });

  it("renders the edit tab/section/field order (view-only rows + Hierarchy dropped)", () => {
    expect(shape(locationWorkbench, "edit")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: [
            "name",
            "primaryLanguage",
            "names",
            "description",
            "geoLookup",
            "coordinates",
            "mapUrl",
            "usesWikidataCoordinates",
            "plusCode",
            "placeType",
            "countryCode",
            "officialLink",
            "wikipediaLinks",
            "parent",
            "ancestors",
            "alternateNames",
            "tags",
            "labeledWebsites",
            "genreMoods",
          ],
        }],
      },
      {
        key: "autofill",
        group: undefined,
        sections: [{
          key: "autofill",
          fields: ["autofillRules"],
        }],
      },
    ]);
  });
});

describe("location stored layout rearrangement (end-to-end loop)", () => {
  // Move the both-mode `coordinates` field into a brand-new user-created tab; `resolveLayout` keeps it
  // there and appends every other unplaced field to its default home — proving a stored layout drives
  // the render in BOTH modes (the hand-PUT loop the editor UI automates).
  const stored: EntityLayout = {
    tabs: [
      {
        key: "geo",
        label: "Geo",
        sections: [{
          key: "s",
          fields: ["coordinates"],
        }],
      },
    ],
  };

  it("shows the moved field under the new tab in both modes", () => {
    const viewGeo = shape(locationWorkbench, "view", stored).find(tab => tab.key === "geo");
    const editGeo = shape(locationWorkbench, "edit", stored).find(tab => tab.key === "geo");
    expect(viewGeo?.sections[0]?.fields).toEqual(["coordinates"]);
    expect(editGeo?.sections[0]?.fields).toEqual(["coordinates"]);
  });
});
