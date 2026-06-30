import type { Bookmark, Category, CustomProperty, PropertyGroup } from "@eesimple/types";

import { Fragment } from "react";

import { buildBookmarkDetailSections } from "./bookmarkDetailSections";
import { useBookmarks } from "../hooks/useBookmarks";
import { useLocationTree } from "../hooks/useLocations";
import { useDefaultFieldZones } from "../lib/bookmarkCardFields";
import { buildBookmarkHierarchy } from "../lib/bookmarkHierarchy";
import { flattenTree } from "../lib/tagTree";

import { Separator } from "@/components/ui/separator";

interface BookmarkDetailBodyProps {
  bookmark: Bookmark;
  /** All categories, used to resolve the bookmark's category name/icon/slug. */
  categories: Category[];
  /** Custom property definitions, used to label and unit-format the bookmark's values. */
  properties: CustomProperty[];
  /** Property groups, used to group property values under their group headings. */
  propertyGroups: PropertyGroup[];
  /** When provided, boolean properties with `clickableInView` enabled render as toggles. */
  onSaveBoolean?: (propertyId: string, value: boolean) => void;
}

/**
 * The right-hand content column of the bookmark detail view: the Details fields, Tags, Relationships,
 * Hierarchy, the grouped custom-property sections, and Metadata, stacked and divided by separators.
 * Sections come from the shared `buildBookmarkDetailSections` builder (shared with the tabbed layout).
 */
export function BookmarkDetailBody({
  bookmark, categories, properties, propertyGroups, onSaveBoolean,
}: BookmarkDetailBodyProps) {
  const {
    data: allBookmarks,
  } = useBookmarks();
  const {
    data: locationTree,
  } = useLocationTree();
  const flatHierarchy = flattenTree(buildBookmarkHierarchy(bookmark.id, allBookmarks ?? []));
  const defaultFieldZones = useDefaultFieldZones();

  const sections = buildBookmarkDetailSections({
    bookmark,
    categories,
    properties,
    propertyGroups,
    flatHierarchy,
    onSaveBoolean,
    defaultFieldZones,
    locationTree,
  });

  return (
    <div className="min-w-0 flex-1 space-y-6">
      {sections.map((section, index) => (
        <Fragment key={section.id}>
          {index > 0
            ? <Separator />
            : null}
          {section.content}
        </Fragment>
      ))}
    </div>
  );
}
