import type {
  AutofillRule,
  Bookmark,
  Category,
  CustomProperty,
  ImportRule,
  LocationNode,
  MediaTypeNode,
  PropertyGroup,
  TagNode,
  Website,
  YouTubeChannel,
} from "@eesimple/types";

import * as React from "react";

import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronsUpDown } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAutofillRules } from "@/hooks/useAutofill";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useCategories } from "@/hooks/useCategories";
import { useCustomProperties } from "@/hooks/useCustomProperties";
import { useImportRules } from "@/hooks/useImportRules";
import { useLocationTree } from "@/hooks/useLocations";
import { useMediaTypeTree } from "@/hooks/useMediaTypes";
import { usePropertyGroups } from "@/hooks/usePropertyGroups";
import { useTagTree } from "@/hooks/useTags";
import { useWebsites } from "@/hooks/useWebsites";
import { useYouTubeChannels } from "@/hooks/useYouTubeChannels";
import { flattenTree } from "@/lib/tagTree";
import { cn } from "@/lib/utils";

/** The flat (non-tree) slug-routed taxonomies a breadcrumb name crumb can switch among. */
export type TaxonomyEntity
  = | "website"
    | "youtube-channel"
    | "custom-property"
    | "property-group"
    | "autofill"
    | "import-rule";

/**
 * Describes what a switchable breadcrumb crumb switches among. Builders in `-appHeader.tsx` attach a
 * spec to a crumb; the component resolves the sibling list (from already-cached queries) on its own.
 */
export type SwitcherSpec
  = | { kind: "category";
    currentSlug: string; }
    | { kind: "bookmark";
      categoryId: string;
      currentId: string; }
      | { kind: "treeSiblings";
        tree: "tag" | "media-type" | "location";
        parentId: string | null;
        currentSlug: string; }
        | { kind: "taxonomy";
          entity: TaxonomyEntity;
          currentSlug: string; };

interface SwitcherOption {
  /** Stable identity used to mark the current item (slug for most, id for bookmarks). */
  value: string;
  label: string;
  /** Plain-string path navigated to on select. */
  href: string;
}

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

function categoryOptions(categories: Category[] | undefined): SwitcherOption[] {
  return (categories ?? []).map(c => ({
    value: c.slug,
    label: c.name,
    href: `/categories/${c.slug}`,
  }));
}

function bookmarkOptions(bookmarks: Bookmark[] | undefined, categoryId: string): SwitcherOption[] {
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

interface TaxonomyLists {
  websites: Website[] | undefined;
  channels: YouTubeChannel[] | undefined;
  properties: CustomProperty[] | undefined;
  groups: PropertyGroup[] | undefined;
  rules: AutofillRule[] | undefined;
  importRules: ImportRule[] | undefined;
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
function useSwitcherOptions(spec: SwitcherSpec): {
  options: SwitcherOption[];
  currentValue: string;
  isLoading: boolean;
} {
  const categories = useCategories();
  const bookmarks = useBookmarks();
  const tagTree = useTagTree();
  const mediaTypeTree = useMediaTypeTree();
  const locationTree = useLocationTree();
  const websites = useWebsites();
  const channels = useYouTubeChannels();
  const properties = useCustomProperties();
  const groups = usePropertyGroups();
  const rules = useAutofillRules();
  const importRules = useImportRules();

  switch (spec.kind) {
    case "category":
      return {
        options: categoryOptions(categories.data),
        currentValue: spec.currentSlug,
        isLoading: categories.isLoading,
      };
    case "bookmark":
      return {
        options: bookmarkOptions(bookmarks.data, spec.categoryId),
        currentValue: spec.currentId,
        isLoading: bookmarks.isLoading,
      };
    case "treeSiblings": {
      const treeQuery = spec.tree === "tag"
        ? tagTree
        : spec.tree === "location" ? locationTree : mediaTypeTree;
      return {
        options: treeSiblingOptions(treeQuery.data, spec.parentId, spec.tree),
        currentValue: spec.currentSlug,
        isLoading: treeQuery.isLoading,
      };
    }
    case "taxonomy": {
      const loadingByEntity: Record<TaxonomyEntity, boolean> = {
        "website": websites.isLoading,
        "youtube-channel": channels.isLoading,
        "custom-property": properties.isLoading,
        "property-group": groups.isLoading,
        "autofill": rules.isLoading,
        "import-rule": importRules.isLoading,
      };
      return {
        options: taxonomyOptions(spec.entity, {
          websites: websites.data,
          channels: channels.data,
          properties: properties.data,
          groups: groups.data,
          rules: rules.data,
          importRules: importRules.data,
        }),
        currentValue: spec.currentSlug,
        isLoading: loadingByEntity[spec.entity],
      };
    }
  }
}

/**
 * The hover-revealed "switch to a sibling" button beside a switchable breadcrumb crumb. The crumb's
 * label is still rendered by the breadcrumb loop; this renders only the button + the searchable
 * Popover/Command flyout. Selecting a sibling navigates immediately. Renders nothing when there is no
 * sibling to switch to.
 */
export function BreadcrumbSwitcher({
  spec,
}: { spec: SwitcherSpec }) {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const {
    options, currentValue, isLoading,
  } = useSwitcherOptions(spec);

  // No point in a switcher with only the current item (count is known eagerly — all lists are cached).
  if (!isLoading && options.length <= 1) return null;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          data-slot="breadcrumb-switcher"
          aria-label="Switch to a related page"
          className={cn(`
            ml-0.5 inline-flex items-center rounded-sm p-0.5
            text-muted-foreground opacity-0 transition-opacity
            group-hover/crumb:opacity-100
            hover:text-foreground
            focus-visible:opacity-100
            data-[state=open]:opacity-100
          `)}
        >
          <ChevronsUpDown className="size-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search…" />
          <CommandList>
            <CommandEmpty>{isLoading ? "Loading…" : "No matches."}</CommandEmpty>
            <CommandGroup>
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  // Combine label + id so cmdk's value stays unique (bookmark titles can repeat) while
                  // still matching a search on the label. Navigation keys off the closure, not this.
                  value={`${option.label} ${option.value}`}
                  onSelect={() => {
                    setOpen(false);
                    void navigate({
                      to: option.href,
                    });
                  }}
                >
                  <span className="truncate">{option.label}</span>
                  <Check
                    className={cn(
                      "ml-auto",
                      option.value === currentValue
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
