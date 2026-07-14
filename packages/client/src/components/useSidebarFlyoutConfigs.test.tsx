import type { SidebarEntityData } from "./useSidebarEntityData";
import type { FlyoutInputs } from "./useSidebarFlyoutConfigs";
import type { Tag } from "@eesimple/types";
import type { TFunction } from "i18next";

import { GENRES_MOODS_TAXONOMY_SLUG } from "@eesimple/types";
import { describe, expect, it } from "vitest";

import { buildSidebarFlyoutData } from "./useSidebarFlyoutConfigs";
import { makeCategory, makeTaxonomy, makeTaxonomyTerm } from "../test-utils/factories";

// Fake `t`: interpolate {{name}}, else return the key verbatim — enough to assert titles/keys.
const t = ((key: string, opts?: { name?: string }) =>
  opts?.name ? key.replace("{{name}}", opts.name) : key) as unknown as TFunction;

function cat(id: string, isFavorite: boolean) {
  return makeCategory({
    id,
    name: `Cat ${id}`,
    slug: `cat-${id}`,
    isFavorite,
    bookmarkCount: 3,
  });
}

function term(id: string, taxonomyId: string, isFavorite: boolean) {
  return makeTaxonomyTerm({
    id,
    taxonomyId,
    name: `Term ${id}`,
    slug: `term-${id}`,
    isFavorite,
  });
}

const GM_ID = "gm-taxonomy";
const CUSTOM_ID = "custom-taxonomy";

function inputs(overrides: Partial<FlyoutInputs> = {}): FlyoutInputs {
  return {
    t,
    data: {
      categories: [cat("a", true), cat("b", false)],
      allTags: [] as Tag[],
    } as unknown as SidebarEntityData,
    languages: [],
    relationshipTypes: [],
    importRules: [],
    favoriteTerms: [
      term("t1", GM_ID, true),
      term("t2", CUSTOM_ID, true),
      term("t3", CUSTOM_ID, false),
    ],
    taxonomies: [
      makeTaxonomy({
        id: GM_ID,
        slug: GENRES_MOODS_TAXONOMY_SLUG,
        name: "Genres & Moods",
        icon: null,
      }),
      makeTaxonomy({
        id: CUSTOM_ID,
        slug: "topics",
        name: "Topics",
        icon: null,
      }),
    ],
    ...overrides,
  };
}

describe("buildSidebarFlyoutData", () => {
  it("includes only starred categories, keyed by their id/slug", () => {
    const configs = buildSidebarFlyoutData(inputs());
    const starred = configs.categories.starred ?? [];
    expect(starred.map(s => s.id)).toEqual(["a"]);
    expect(starred[0].slug).toBe("cat-a");
  });

  it("pulls Genres & Moods starred entries from favorited terms of the G&M taxonomy", () => {
    const configs = buildSidebarFlyoutData(inputs());
    const starred = configs["genres-moods"].starred ?? [];
    expect(starred.map(s => s.id)).toEqual(["t1"]);
  });

  it("builds a `taxonomy:${id}` entry per custom taxonomy with its favorited terms only", () => {
    const configs = buildSidebarFlyoutData(inputs());
    const starred = configs[`taxonomy:${CUSTOM_ID}`].starred ?? [];
    expect(starred.map(s => s.id)).toEqual(["t2"]);
    expect(configs[`taxonomy:${GM_ID}`]).toBeUndefined();
  });

  it("gives Groups/Languages/Locations their fixed shortcut links", () => {
    const configs = buildSidebarFlyoutData(inputs());
    expect((configs.groups.shortcuts ?? []).map(s => s.to)).toContain("/taxonomies/group-types");
    expect((configs.languages.shortcuts ?? []).map(s => s.to)).toContain("/taxonomies/language-usage-levels");
    expect((configs.locations.shortcuts ?? []).map(s => s.to)).toContain("/taxonomies/place-types");
  });
});
