import type { ComboboxOption } from "../components/Combobox";
import type { EntityWorkbench } from "../components/workbench/types";
import type { LayoutableEntityKind } from "@eesimple/types";

import { flattenTree } from "./tagTree";
import { ENTITY_DESCRIPTORS } from "../entities/registry";
import { useBookmarks } from "../hooks/useBookmarks";

/** Narrow an optional descriptor member we statically know is present (avoids a forbidden `!`). */
function req<T>(value: T | undefined): T {
  return value as T;
}

/** Map a flat entity list to picker options, labelled by the workbench's `name`. */
function toOptions<E extends { id: string }>(
  workbench: EntityWorkbench<E>,
  data: E[] | undefined,
): ComboboxOption[] {
  return (data ?? []).map(entity => ({
    value: entity.id,
    label: workbench.name(entity),
  }));
}

/** Map a tree of nodes to depth-indented picker options, labelled by the workbench's `name`. */
function treeToOptions<E extends { id: string }, N extends E & { children: N[] }>(
  workbench: EntityWorkbench<E>,
  nodes: N[] | undefined,
): ComboboxOption[] {
  return flattenTree(nodes ?? []).map(({
    node, depth,
  }) => ({
    value: node.id,
    label: workbench.name(node),
    depth,
  }));
}

/**
 * Real instances of every layout-driven kind, as picker options for the Page Layouts preview (#1225).
 * Mirrors `baseWorkbenchForKind`: each source list/tree hook is called **unconditionally**
 * (Rules of Hooks) and sourced from the entity's own `ENTITY_DESCRIPTORS` listing config — flat kinds
 * via `listing.useItems`, tree kinds via `treeListing.useTree` (flattened), with bookmarks (a bespoke
 * listing) read directly. Only exercised when the preview pane is mounted.
 */
export function usePreviewInstancesByKind(): Partial<Record<LayoutableEntityKind, ComboboxOption[]>> {
  const bookmarks = useBookmarks();

  const category = req(ENTITY_DESCRIPTORS.category.listing).useItems();
  const website = req(ENTITY_DESCRIPTORS.website.listing).useItems();
  const youtubeChannel = req(ENTITY_DESCRIPTORS["youtube-channel"].listing).useItems();
  const newsletter = req(ENTITY_DESCRIPTORS.newsletter.listing).useItems();
  const person = req(ENTITY_DESCRIPTORS.person.listing).useItems();
  const group = req(ENTITY_DESCRIPTORS.group.listing).useItems();
  const autofill = req(ENTITY_DESCRIPTORS.autofill.listing).useItems();
  const customProperty = req(ENTITY_DESCRIPTORS["custom-property"].listing).useItems();

  const tag = req(ENTITY_DESCRIPTORS.tag.treeListing).useTree();
  const mediaType = req(ENTITY_DESCRIPTORS["media-type"].treeListing).useTree();
  const genreMood = req(ENTITY_DESCRIPTORS["genre-mood"].treeListing).useTree();
  const location = req(ENTITY_DESCRIPTORS.location.treeListing).useTree();

  return {
    "bookmark": (bookmarks.data ?? []).map(bookmark => ({
      value: bookmark.id,
      label: bookmark.title ?? bookmark.url ?? bookmark.id,
    })),
    "category": toOptions(ENTITY_DESCRIPTORS.category.workbench, category.data),
    "website": toOptions(ENTITY_DESCRIPTORS.website.workbench, website.data),
    "youtube-channel": toOptions(ENTITY_DESCRIPTORS["youtube-channel"].workbench, youtubeChannel.data),
    "newsletter": toOptions(ENTITY_DESCRIPTORS.newsletter.workbench, newsletter.data),
    "person": toOptions(ENTITY_DESCRIPTORS.person.workbench, person.data),
    "group": toOptions(ENTITY_DESCRIPTORS.group.workbench, group.data),
    "autofill": toOptions(ENTITY_DESCRIPTORS.autofill.workbench, autofill.data),
    "custom-property": toOptions(ENTITY_DESCRIPTORS["custom-property"].workbench, customProperty.data),
    "tag": treeToOptions(ENTITY_DESCRIPTORS.tag.workbench, tag.data),
    "media-type": treeToOptions(ENTITY_DESCRIPTORS["media-type"].workbench, mediaType.data),
    "genre-mood": treeToOptions(ENTITY_DESCRIPTORS["genre-mood"].workbench, genreMood.data),
    "location": treeToOptions(ENTITY_DESCRIPTORS.location.workbench, location.data),
  };
}
