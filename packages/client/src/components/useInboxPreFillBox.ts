import type { CustomProperty, InboxPreFillDefaults, TagNode } from "@eesimple/types";

import { useState } from "react";

import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useMediaTypeTree } from "../hooks/useMediaTypes";
import { usePeople } from "../hooks/usePeople";
import { useTagTree } from "../hooks/useTags";
import { useBuiltInName } from "../lib/builtInName";
import { iconComboboxOptions, mediaTypeNodesToOptions } from "../lib/comboboxOptions";
import { sortFavoritesFirst } from "../lib/favoritesOrder";
import { INBOX_PREFILLABLE_TYPES } from "../lib/inboxPreFill";
import { buildSearchAlias } from "../lib/searchAlias";
import { flattenTree } from "../lib/tagTree";

/**
 * Loads the taxonomies the inbox pre-fill box offers as defaults, derives their combobox option
 * lists and the inbox-enabled custom properties, and owns the still-manual "Add person" modal
 * open-state (Category/Media Type own their inline-create via `useEntityCreateOption` in
 * `InboxPreFillBox` itself). Splitting the hook-dense data layer out of `InboxPreFillBox` keeps the
 * component thin.
 */
export function useInboxPreFillBox(preFill: InboxPreFillDefaults) {
  const [addPersonOpen, setAddPersonOpen] = useState(false);

  const {
    data: categories = [],
  } = useCategories();
  const {
    data: tagTree = [],
  } = useTagTree();
  const {
    data: mediaTypeTree = [],
  } = useMediaTypeTree();
  const {
    data: people = [],
  } = usePeople();
  const {
    data: allProperties = [],
  } = useCustomProperties();

  const inboxProperties = allProperties.filter(
    (p: CustomProperty) => p.enabledInInbox && p.enabled && INBOX_PREFILLABLE_TYPES.has(p.type),
  );

  const builtInName = useBuiltInName();
  const categoryOptions = iconComboboxOptions(sortFavoritesFirst(categories));
  const mediaTypeOptions = mediaTypeNodesToOptions(mediaTypeTree, builtInName);
  const personOptions = people.map(a => ({
    value: a.id,
    label: a.name,
    searchAlias: buildSearchAlias(a.names),
    names: a.names,
  }));
  const selectedTagIds = preFill.tagIds ?? [];

  // Flat tag list for displaying selected tag names as badges.
  const flatTags = flattenTree(tagTree as TagNode[]);
  const selectedTagNames = selectedTagIds
    .map(id => flatTags.find(t => t.node.id === id)?.node.name)
    .filter(Boolean) as string[];

  return {
    addPersonOpen,
    setAddPersonOpen,
    tagTree: tagTree as TagNode[],
    mediaTypeTree,
    people,
    inboxProperties,
    categoryOptions,
    mediaTypeOptions,
    personOptions,
    selectedTagNames,
  };
}
