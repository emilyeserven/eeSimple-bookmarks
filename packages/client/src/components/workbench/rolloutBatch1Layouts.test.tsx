import { describe, expect, it } from "vitest";

import { groupWorkbench } from "./group";
import { groupTypeWorkbench } from "./groupType";
import { languageWorkbench } from "./language";
import { locationRelationWorkbench } from "./locationRelation";
import { personWorkbench } from "./person";
import { placeTypeWorkbench } from "./placeType";
import { propertyGroupWorkbench } from "./propertyGroup";
import { relationshipTypeWorkbench } from "./relationshipType";
import { shape } from "./workbenchLayoutTestUtils";

/**
 * Byte-identical rollout-batch-1 check (#1164): each "simple flat entity" field registry must resolve
 * its code default layout to the exact same tab / section / field-key order — in both view and edit —
 * as its pre-migration opaque panes. Mirrors `pilotLayouts.test.tsx` via the shared `shape` helper
 * (`workbenchLayoutTestUtils.ts`). Renderers are never invoked here, only the pure order/visibility
 * helpers, so no React rendering happens.
 */

describe("language default layout", () => {
  it("renders the single view/edit tab", () => {
    const expected = [{
      key: "general",
      group: undefined,
      sections: [{
        key: "general",
        fields: ["general"],
      }],
    }];
    expect(shape(languageWorkbench, "view")).toEqual(expected);
    expect(shape(languageWorkbench, "edit")).toEqual(expected);
  });
});

describe("placeType default layout", () => {
  it("renders the single view/edit tab", () => {
    const expected = [{
      key: "general",
      group: undefined,
      sections: [{
        key: "general",
        fields: ["general"],
      }],
    }];
    expect(shape(placeTypeWorkbench, "view")).toEqual(expected);
    expect(shape(placeTypeWorkbench, "edit")).toEqual(expected);
  });
});

describe("locationRelation default layout", () => {
  it("renders both view tabs (bookmarks, general)", () => {
    expect(shape(locationRelationWorkbench, "view")).toEqual([
      {
        key: "bookmarks",
        group: undefined,
        sections: [{
          key: "bookmarks",
          fields: ["bookmarks"],
        }],
      },
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["general"],
        }],
      },
    ]);
  });

  it("renders only the general edit tab (bookmarks is view-only, so it vanishes in edit)", () => {
    expect(shape(locationRelationWorkbench, "edit")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["general"],
        }],
      },
    ]);
  });
});

describe("propertyGroup default layout", () => {
  it("renders all four tabs identically in both modes", () => {
    const expected = [
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["general"],
        }],
      },
      {
        key: "categories",
        group: undefined,
        sections: [{
          key: "categories",
          fields: ["categories"],
        }],
      },
      {
        key: "media-types",
        group: undefined,
        sections: [{
          key: "media-types",
          fields: ["mediaTypes"],
        }],
      },
      {
        key: "display-rules",
        group: undefined,
        sections: [{
          key: "display-rules",
          fields: ["displayRules"],
        }],
      },
    ];
    expect(shape(propertyGroupWorkbench, "view")).toEqual(expected);
    expect(shape(propertyGroupWorkbench, "edit")).toEqual(expected);
  });
});

describe("group default layout", () => {
  // The General composite was atomized into granular fields (#1195). The unified field order is shared;
  // the mode filters which render — `name`/`genreMoods` are edit-only, `metadata` is view-only — so the
  // view and edit projections of the General tab differ.
  const otherTabs = [
    {
      key: "people",
      group: undefined,
      sections: [{
        key: "people",
        fields: ["people"],
      }],
    },
    {
      key: "youtube-channels",
      group: undefined,
      sections: [{
        key: "youtube-channels",
        fields: ["youtubeChannels"],
      }],
    },
    {
      key: "websites",
      group: undefined,
      sections: [{
        key: "websites",
        fields: ["websites"],
      }],
    },
  ];

  it("renders the granular General view fields (name/genreMoods are edit-only, so they drop)", () => {
    expect(shape(groupWorkbench, "view")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: [
            "image",
            "metadata",
            "description",
            "primaryLanguage",
            "names",
            "groupType",
            "labeledWebsites",
            "connectedYoutubeChannels",
            "socialLinks",
            "creatorMedia",
          ],
        }],
      },
      ...otherTabs,
    ]);
  });

  it("renders the granular General edit fields (metadata is view-only, so it drops)", () => {
    expect(shape(groupWorkbench, "edit")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: [
            "image",
            "name",
            "description",
            "primaryLanguage",
            "names",
            "groupType",
            "labeledWebsites",
            "connectedYoutubeChannels",
            "socialLinks",
            "creatorMedia",
            "genreMoods",
          ],
        }],
      },
      ...otherTabs,
    ]);
  });
});

describe("groupType default layout", () => {
  it("renders the single view/edit tab", () => {
    const expected = [{
      key: "general",
      group: undefined,
      sections: [{
        key: "general",
        fields: ["general"],
      }],
    }];
    expect(shape(groupTypeWorkbench, "view")).toEqual(expected);
    expect(shape(groupTypeWorkbench, "edit")).toEqual(expected);
  });
});

describe("relationshipType default layout", () => {
  it("renders both view tabs (relationships, general)", () => {
    expect(shape(relationshipTypeWorkbench, "view")).toEqual([
      {
        key: "relationships",
        group: undefined,
        sections: [{
          key: "relationships",
          fields: ["relationships"],
        }],
      },
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["general"],
        }],
      },
    ]);
  });

  it("renders only the general edit tab (relationships is view-only, so it vanishes in edit)", () => {
    expect(shape(relationshipTypeWorkbench, "edit")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["general"],
        }],
      },
    ]);
  });
});

describe("person default layout", () => {
  it("renders all five tabs identically in both modes", () => {
    const expected = [
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["general"],
        }],
      },
      {
        key: "youtube-channels",
        group: undefined,
        sections: [{
          key: "youtube-channels",
          fields: ["youtubeChannels"],
        }],
      },
      {
        key: "websites",
        group: undefined,
        sections: [{
          key: "websites",
          fields: ["websites"],
        }],
      },
      {
        key: "groups",
        group: undefined,
        sections: [{
          key: "groups",
          fields: ["groups"],
        }],
      },
      {
        key: "languages",
        group: undefined,
        sections: [{
          key: "languages",
          fields: ["languages"],
        }],
      },
    ];
    expect(shape(personWorkbench, "view")).toEqual(expected);
    expect(shape(personWorkbench, "edit")).toEqual(expected);
  });
});
