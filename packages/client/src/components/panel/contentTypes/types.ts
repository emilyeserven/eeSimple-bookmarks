import type { DrawerContentType } from "@/lib/drawerSearch";
import type { LucideIcon } from "lucide-react";
import type { FC } from "react";

/** A single row in a content type's searchable list. */
export interface PanelListItem {
  id: string;
  label: string;
  sublabel?: string;
  /**
   * Optional romanized form of `label`. When present it renders through the shared, toggle-aware
   * `RomanizedLabel` beside the primary label (respecting "Show Romanized by default"), rather than
   * as a raw sublabel. Still included in the search haystack.
   */
  romanized?: string | null;
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
