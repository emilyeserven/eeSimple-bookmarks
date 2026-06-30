import type { TaxonomyLists } from "./breadcrumbSwitcherTaxonomyData";
import type { SwitcherOption, SwitcherSpec, TaxonomyEntity } from "./breadcrumbSwitcherTypes";
import type { LocationNode, MediaTypeNode, TagNode } from "@eesimple/types";

import { useCategoryBookmarkData, useTreeSwitcherData } from "./breadcrumbSwitcherData";
import { useTaxonomySwitcherData } from "./breadcrumbSwitcherTaxonomyData";

import { flattenTree } from "@/lib/tagTree";

export type { SwitcherOption, SwitcherSpec, TaxonomyEntity } from "./breadcrumbSwitcherTypes";

const TREE_HREF_PREFIX = {
  "tag": "/tags",
  "media-type": "/taxonomies/media-types",
  "location": "/taxonomies/locations",
} as const;

const TAXONOMY_HREF_PREFIX: Record<TaxonomyEntity, string> = {
  "website": "/taxonomies/websites",
  "youtube-channel": "/taxonomies/youtube-channels",
  "custom-property": "/custom-properties",
  "property-group": "/taxonomies/property-groups",
  "autofill": "/autofill",
  "import-rule": "/import-rules",
};

function categoryOptions(categories: { slug: string;
  name: string; }[] | undefined): SwitcherOption[] {
  return (categories ?? []).map(c => ({
    value: c.slug,
    label: c.name,
    href: `/categories/${c.slug}`,
  }));
}

function bookmarkOptions(
  bookmarks: { id: string;
    title: string;
    categoryId: string; }[] | undefined,
  categoryId: string,
): SwitcherOption[] {
  return (bookmarks ?? [])
    .filter(b => b.categoryId === categoryId)
    .map(b => ({
      value: b.id,
      label: b.title,
      href: `/bookmarks/${b.id}`,
    }));
}

/** Siblings of the node identified by `parentId` (its parent's children, or the roots when null). */
function treeSiblingOptions(
  roots: (TagNode | MediaTypeNode | LocationNode)[] | undefined,
  parentId: string | null,
  tree: "tag" | "media-type" | "location",
): SwitcherOption[] {
  const nodes = roots ?? [];
  const siblings = parentId === null
    ? nodes
    : (flattenTree(nodes).find(f => f.node.id === parentId)?.node.children ?? []);
  const prefix = TREE_HREF_PREFIX[tree];
  return siblings.map(n => ({
    value: n.slug,
    label: n.name,
    href: `${prefix}/${n.slug}`,
  }));
}

function taxonomyOptions(entity: TaxonomyEntity, lists: TaxonomyLists): SwitcherOption[] {
  const prefix = TAXONOMY_HREF_PREFIX[entity];
  switch (entity) {
    case "website":
      return (lists.websites ?? []).map(w => ({
        value: w.slug,
        label: w.siteName,
        href: `${prefix}/${w.slug}`,
      }));
    case "youtube-channel":
      return (lists.channels ?? []).map(c => ({
        value: c.slug,
        label: c.name,
        href: `${prefix}/${c.slug}`,
      }));
    case "custom-property":
      return (lists.properties ?? []).map(p => ({
        value: p.slug,
        label: p.name,
        href: `${prefix}/${p.slug}`,
      }));
    case "property-group":
      return (lists.groups ?? []).map(g => ({
        value: g.slug,
        label: g.name,
        href: `${prefix}/${g.slug}`,
      }));
    case "autofill":
      return (lists.rules ?? []).map(r => ({
        value: r.slug,
        label: r.name,
        href: `${prefix}/${r.slug}`,
      }));
    case "import-rule":
      return (lists.importRules ?? []).map(r => ({
        value: r.slug,
        label: r.name,
        href: `${prefix}/${r.slug}`,
      }));
  }
}

/**
 * Resolve the sibling options + current value + load state for a spec. Every list it reads is already
 * fetched app-wide by the sidebar, so these are cache hits — no spec triggers a fresh request on its
 * own. Hooks are called unconditionally (rules of hooks); the `switch` only picks which result to use.
 */
export function useSwitcherOptions(spec: SwitcherSpec): {
  options: SwitcherOption[];
  currentValue: string;
  isLoading: boolean;
} {
  const categoryBookmark = useCategoryBookmarkData();
  const treeData = useTreeSwitcherData(spec.kind === "treeSiblings" ? spec.tree : "tag");
  const taxonomy = useTaxonomySwitcherData();

  switch (spec.kind) {
    case "category":
      return {
        options: categoryOptions(categoryBookmark.categories),
        currentValue: spec.currentSlug,
        isLoading: categoryBookmark.categoriesLoading,
      };
    case "bookmark":
      return {
        options: bookmarkOptions(categoryBookmark.bookmarks, spec.categoryId),
        currentValue: spec.currentId,
        isLoading: categoryBookmark.bookmarksLoading,
      };
    case "treeSiblings":
      return {
        options: treeSiblingOptions(treeData.roots, spec.parentId, spec.tree),
        currentValue: spec.currentSlug,
        isLoading: treeData.isLoading,
      };
    case "taxonomy":
      return {
        options: taxonomyOptions(spec.entity, taxonomy.lists),
        currentValue: spec.currentSlug,
        isLoading: taxonomy.loadingByEntity[spec.entity],
      };
  }
}
