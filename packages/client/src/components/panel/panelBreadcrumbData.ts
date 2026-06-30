import type { DrawerContentType } from "@/lib/drawerSearch";

import { useAutofillRules } from "@/hooks/useAutofill";
import { useCategories } from "@/hooks/useCategories";
import { useCustomProperties } from "@/hooks/useCustomProperties";
import { useMediaTypeTree } from "@/hooks/useMediaTypes";
import { usePropertyGroups } from "@/hooks/usePropertyGroups";
import { useTagTree } from "@/hooks/useTags";
import { useWebsites } from "@/hooks/useWebsites";
import { useYouTubeChannels } from "@/hooks/useYouTubeChannels";
import { NEW_SENTINEL } from "@/lib/drawerSearch";
import { flattenTree } from "@/lib/tagTree";

export function usePanelItemLabel(dCT: DrawerContentType | null, dCId: string | null): string | null {
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: categories,
  } = useCategories();
  const {
    data: websites,
  } = useWebsites();
  const {
    data: mediaTypeTree,
  } = useMediaTypeTree();
  const {
    data: channels,
  } = useYouTubeChannels();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: groups,
  } = usePropertyGroups();
  const {
    data: rules,
  } = useAutofillRules();

  if (!dCId || dCId === NEW_SENTINEL || !dCT) return null;

  const resolvers: Partial<Record<DrawerContentType, () => string | null>> = {
    "tag": () => treeNodeName(tagTree, dCId),
    "category": () => flatItemName(categories, dCId),
    "website": () => websites?.find(w => w.id === dCId)?.siteName ?? null,
    "media-type": () => treeNodeName(mediaTypeTree, dCId),
    "youtube-channel": () => flatItemName(channels, dCId),
    "property": () => flatItemName(properties, dCId),
    "property-group": () => flatItemName(groups, dCId),
    "autofill": () => flatItemName(rules, dCId),
  };

  return resolvers[dCT]?.() ?? null;
}

/** Name of a flat-list entity matched by id, or null. */
function flatItemName(
  items: readonly { id: string;
    name: string; }[] | undefined,
  id: string,
): string | null {
  return items?.find(item => item.id === id)?.name ?? null;
}

/** Name of a tree node matched by id (searches the flattened subtree), or null. */
function treeNodeName<T extends { id: string;
  name: string;
  children: T[]; }>(
  tree: T[] | undefined,
  id: string,
): string | null {
  return flattenTree(tree ?? []).find(({
    node,
  }) => node.id === id)?.node.name ?? null;
}

export interface SwitcherItem {
  id: string;
  label: string;
}

export function usePanelSwitcherItems(dCT: DrawerContentType): { items: SwitcherItem[];
  isLoading: boolean; } {
  const categories = useCategories();
  const tagTree = useTagTree();
  const websites = useWebsites();
  const mediaTypeTree = useMediaTypeTree();
  const channels = useYouTubeChannels();
  const properties = useCustomProperties();
  const groups = usePropertyGroups();
  const rules = useAutofillRules();

  switch (dCT) {
    case "category":
      return {
        items: (categories.data ?? []).map(c => ({
          id: c.id,
          label: c.name,
        })),
        isLoading: categories.isLoading,
      };
    case "tag":
      return {
        items: flattenTree(tagTree.data ?? []).map(({
          node, depth,
        }) => ({
          id: node.id,
          label: `${"— ".repeat(depth)}${node.name}`,
        })),
        isLoading: tagTree.isLoading,
      };
    case "website":
      return {
        items: (websites.data ?? []).map(w => ({
          id: w.id,
          label: w.siteName,
        })),
        isLoading: websites.isLoading,
      };
    case "media-type":
      return {
        items: flattenTree(mediaTypeTree.data ?? []).map(({
          node,
        }) => ({
          id: node.id,
          label: node.name,
        })),
        isLoading: mediaTypeTree.isLoading,
      };
    case "youtube-channel":
      return {
        items: (channels.data ?? []).map(c => ({
          id: c.id,
          label: c.name,
        })),
        isLoading: channels.isLoading,
      };
    case "property":
      return {
        items: (properties.data ?? []).map(p => ({
          id: p.id,
          label: p.name,
        })),
        isLoading: properties.isLoading,
      };
    case "property-group":
      return {
        items: (groups.data ?? []).map(g => ({
          id: g.id,
          label: g.name,
        })),
        isLoading: groups.isLoading,
      };
    case "autofill":
      return {
        items: (rules.data ?? []).map(r => ({
          id: r.id,
          label: r.name,
        })),
        isLoading: rules.isLoading,
      };
    default:
      return {
        items: [],
        isLoading: false,
      };
  }
}
