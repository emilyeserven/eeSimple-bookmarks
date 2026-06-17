// This module is the panel's content-type registry: it pairs each type's view/edit components and
// list adapter with the exported registry array/lookup its consumers iterate over.
/* eslint-disable react-refresh/only-export-components */
import type { DrawerContentType } from "@/lib/drawerSearch";
import type { LucideIcon } from "lucide-react";
import type { FC, ReactNode } from "react";

import { useMemo } from "react";

import { Bookmark, Folder, Globe, SlidersHorizontal, Sparkles, Tags } from "lucide-react";

import { AutofillRulePanel } from "./AutofillRulePanel";
import { TagPanel } from "./TagPanel";
import { usePanelControls } from "./usePanelControls";
import { usePanelDismissAfterDelete } from "./usePanelDismissAfterDelete";
import { useAutofillRules } from "../../hooks/useAutofill";
import { useBookmarks, useDeleteBookmark } from "../../hooks/useBookmarks";
import { useCategories } from "../../hooks/useCategories";
import { useCustomProperties } from "../../hooks/useCustomProperties";
import { useTagTree } from "../../hooks/useTags";
import { useWebsites } from "../../hooks/useWebsites";
import { flattenTree } from "../../lib/tagTree";
import { BookmarkDetail } from "../BookmarkDetail";
import { BookmarkForm } from "../BookmarkForm";
import { CategoryCard } from "../CategoryManager";
import { PropertyCard } from "../CustomPropertyManager";
import { WebsiteRow } from "../WebsiteManager";

/** A single row in a content type's searchable list. */
export interface PanelListItem {
  id: string;
  label: string;
  sublabel?: string;
}

/** Describes one browsable content type: its list adapter and its view/edit bodies. */
export interface PanelContentTypeDef {
  type: DrawerContentType;
  /** Plural display name, e.g. "Bookmarks". */
  label: string;
  /** Singular display name, e.g. "Bookmark". */
  singular: string;
  icon: LucideIcon;
  /** Adapts the type's list query into uniform, filterable rows. */
  useList: () => { items: PanelListItem[];
    isLoading: boolean;
    error: Error | null; };
  /** Read-only body for a single item. */
  View: FC<{ id: string }>;
  /** Editor body for a single item (may equal `View` when the main app has one combined component). */
  Edit: FC<{ id: string }>;
}

/** Shared loading / error / not-found status line, matching the existing panel bodies. */
function Loading() {
  return <p className="text-muted-foreground">Loading…</p>;
}
function Problem({
  children,
}: {
  children: ReactNode;
}) {
  return <p className="text-destructive">{children}</p>;
}

// --- Bookmark -----------------------------------------------------------------------------------

function useBookmarkList() {
  const {
    data, isLoading, error,
  } = useBookmarks();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(bookmark => ({
      id: bookmark.id,
      label: bookmark.title,
      sublabel: bookmark.url,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only bookmark, reusing the same `BookmarkDetail` the full detail page renders. */
function BookmarkView({
  id,
}: {
  id: string;
}) {
  const {
    data: bookmarks, isLoading, error,
  } = useBookmarks();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: categories,
  } = useCategories();
  const {
    openItem,
  } = usePanelControls();
  const dismiss = usePanelDismissAfterDelete();
  const deleteBookmark = useDeleteBookmark();

  if (isLoading) return <Loading />;
  if (error) return <Problem>{error.message}</Problem>;
  const bookmark = (bookmarks ?? []).find(item => item.id === id);
  if (!bookmark) return <Problem>Bookmark not found.</Problem>;

  return (
    <BookmarkDetail
      bookmark={bookmark}
      categories={categories ?? []}
      properties={properties ?? []}
      onEdit={() => openItem("bookmark", id, "edit")}
      onDelete={() => deleteBookmark.mutate(id, {
        onSuccess: dismiss,
      })}
    />
  );
}

/** Edit a bookmark with the same `BookmarkForm` the main app uses. */
function BookmarkEdit({
  id,
}: {
  id: string;
}) {
  const {
    data: bookmarks, isLoading, error,
  } = useBookmarks();
  const {
    openItem,
  } = usePanelControls();

  if (isLoading) return <Loading />;
  if (error) return <Problem>{error.message}</Problem>;
  const bookmark = (bookmarks ?? []).find(item => item.id === id);
  if (!bookmark) return <Problem>Bookmark not found.</Problem>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Edit bookmark</h2>
      <BookmarkForm
        bookmark={bookmark}
        onDone={() => openItem("bookmark", id, "view")}
      />
    </div>
  );
}

// --- Tag ----------------------------------------------------------------------------------------

function useTagList() {
  const {
    data, isLoading, error,
  } = useTagTree();
  const items = useMemo<PanelListItem[]>(
    () => flattenTree(data ?? []).map(({
      node, depth,
    }) => ({
      id: node.id,
      label: `${"— ".repeat(depth)}${node.name}`,
      sublabel: node.children.length > 0 ? `${node.children.length} children` : undefined,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

const TagView: FC<{ id: string }> = ({
  id,
}) => (
  <TagPanel
    tagId={id}
    initialMode="view"
  />
);
const TagEdit: FC<{ id: string }> = ({
  id,
}) => (
  <TagPanel
    tagId={id}
    initialMode="edit"
  />
);

// --- Category -----------------------------------------------------------------------------------

function useCategoryList() {
  const {
    data, isLoading, error,
  } = useCategories();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(category => ({
      id: category.id,
      label: category.name,
      sublabel: category.slug,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** A category, reusing the settings page's `CategoryCard` (inline-editable, links to full edit). */
function CategoryItem({
  id,
}: {
  id: string;
}) {
  const {
    data, isLoading, error,
  } = useCategories();
  const dismiss = usePanelDismissAfterDelete();
  if (isLoading) return <Loading />;
  if (error) return <Problem>{error.message}</Problem>;
  const category = (data ?? []).find(item => item.id === id);
  if (!category) return <Problem>Category not found.</Problem>;
  return (
    <CategoryCard
      category={category}
      onDeleted={dismiss}
    />
  );
}

// --- Custom property ----------------------------------------------------------------------------

function usePropertyList() {
  const {
    data, isLoading, error,
  } = useCustomProperties();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(property => ({
      id: property.id,
      label: property.name,
      sublabel: property.type,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** A custom property, reusing the settings page's inline-editable `PropertyCard`. */
function PropertyItem({
  id,
}: {
  id: string;
}) {
  const {
    data: properties, isLoading, error,
  } = useCustomProperties();
  const {
    data: categories,
  } = useCategories();
  const dismiss = usePanelDismissAfterDelete();
  if (isLoading) return <Loading />;
  if (error) return <Problem>{error.message}</Problem>;
  const property = (properties ?? []).find(item => item.id === id);
  if (!property) return <Problem>Property not found.</Problem>;
  return (
    <PropertyCard
      property={property}
      categories={categories ?? []}
      allProperties={properties ?? []}
      onDeleted={dismiss}
    />
  );
}

// --- Website ------------------------------------------------------------------------------------

function useWebsiteList() {
  const {
    data, isLoading, error,
  } = useWebsites();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(website => ({
      id: website.id,
      label: website.siteName,
      sublabel: website.domain,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** A website, reusing the settings page's inline-editable `WebsiteRow` (a list item). */
function WebsiteItem({
  id,
}: {
  id: string;
}) {
  const {
    data, isLoading, error,
  } = useWebsites();
  if (isLoading) return <Loading />;
  if (error) return <Problem>{error.message}</Problem>;
  const website = (data ?? []).find(item => item.id === id);
  if (!website) return <Problem>Website not found.</Problem>;
  return <WebsiteRow website={website} />;
}

// --- Autofill rule ------------------------------------------------------------------------------

function useAutofillList() {
  const {
    data, isLoading, error,
  } = useAutofillRules();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(rule => ({
      id: rule.id,
      label: rule.name,
      sublabel: `${rule.field} ${rule.operator} ${rule.pattern}`,
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

const AutofillItem: FC<{ id: string }> = ({
  id,
}) => <AutofillRulePanel ruleId={id} />;

// --- Registry -----------------------------------------------------------------------------------

/** Every content type the panel can browse, in tile/list display order. */
export const PANEL_CONTENT_TYPES: PanelContentTypeDef[] = [
  {
    type: "bookmark",
    label: "Bookmarks",
    singular: "Bookmark",
    icon: Bookmark,
    useList: useBookmarkList,
    View: BookmarkView,
    Edit: BookmarkEdit,
  },
  {
    type: "tag",
    label: "Tags",
    singular: "Tag",
    icon: Tags,
    useList: useTagList,
    View: TagView,
    Edit: TagEdit,
  },
  {
    type: "category",
    label: "Categories",
    singular: "Category",
    icon: Folder,
    useList: useCategoryList,
    View: CategoryItem,
    Edit: CategoryItem,
  },
  {
    type: "property",
    label: "Custom Properties",
    singular: "Custom Property",
    icon: SlidersHorizontal,
    useList: usePropertyList,
    View: PropertyItem,
    Edit: PropertyItem,
  },
  {
    type: "website",
    label: "Websites",
    singular: "Website",
    icon: Globe,
    useList: useWebsiteList,
    View: WebsiteItem,
    Edit: WebsiteItem,
  },
  {
    type: "autofill",
    label: "Autofill Rules",
    singular: "Autofill Rule",
    icon: Sparkles,
    useList: useAutofillList,
    View: AutofillItem,
    Edit: AutofillItem,
  },
];

/** Look up a content type's definition. */
export function getContentType(type: DrawerContentType): PanelContentTypeDef {
  const def = PANEL_CONTENT_TYPES.find(candidate => candidate.type === type);
  if (!def) throw new Error(`Unknown panel content type: ${type}`);
  return def;
}
