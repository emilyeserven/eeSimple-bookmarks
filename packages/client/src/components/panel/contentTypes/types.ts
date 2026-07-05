import type { DrawerContentType } from "@/lib/drawerSearch";
import type { EntityName } from "@eesimple/types";
import type { LucideIcon } from "lucide-react";
import type { FC } from "react";

/** A single row in a content type's searchable list. */
export interface PanelListItem {
  id: string;
  label: string;
  sublabel?: string;
  /**
   * Optional multilingual names for `label`. When present it renders through the shared
   * `LocalizedNameLabel` beside the primary label, rather than as a raw sublabel. Still included in
   * the search haystack (each name's value).
   */
  names?: EntityName[];
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
