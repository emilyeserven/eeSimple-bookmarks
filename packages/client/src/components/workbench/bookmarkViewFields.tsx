/* eslint-disable react-refresh/only-export-components -- this module pairs the bookmark view-field
   components with the small shared helpers (relationshipBadges, MEDIA_SOURCE_FIELD_LABELS) they use */
import type { MediaSourceMatchGroup } from "../../hooks/useBookmarksSharingMediaSource";
import type { Bookmark, BookmarkRelationship } from "@eesimple/types";
import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

import { useBookmarks, useUpdateBookmark } from "../../hooks/useBookmarks";
import { useBookmarksSharingMediaSource } from "../../hooks/useBookmarksSharingMediaSource";
import { useCategories } from "../../hooks/useCategories";
import { useCustomProperties } from "../../hooks/useCustomProperties";
import { useLocationTree } from "../../hooks/useLocations";
import { usePropertyGroups } from "../../hooks/usePropertyGroups";
import { useRelatedBookmarks } from "../../hooks/useRelatedBookmarks";
import { useDefaultFieldZones } from "../../lib/bookmarkCardFields";
import { mergeBooleanValue } from "../../lib/bookmarkFormat";
import { buildBookmarkHierarchy } from "../../lib/bookmarkHierarchy";
import { hasBookmarkPropertyRows } from "../../lib/bookmarkProperties";
import { withMediaSourceMatch } from "../../lib/bookmarkSearch";
import { flattenTree } from "../../lib/tagTree";
import { BookmarkCardGrid } from "../BookmarkCardGrid";
import { BookmarkCategoryLink } from "../BookmarkCategoryLink";
import { BookmarkLocationsBox } from "../BookmarkLocationsBox";
import { BookmarkLocationsTabContent } from "../BookmarkLocationsTabContent";
import { BookmarkPropertySections } from "../BookmarkPropertySections";

import { DetailField } from "@/components/DetailField";
import { LabeledSection } from "@/components/LabeledSection";
import { Badge } from "@/components/ui/badge";
import i18n from "@/i18n";
import { builtInName } from "@/lib/builtInName";

/**
 * The read-only bookmark **view** field components for the field registry (`workbench/bookmark.tsx`,
 * #1163). Each is a self-contained component that loads its own data via (cached) react-query hooks —
 * `LayoutDrivenTabBody` invokes a field's `view` renderer as a plain call, so every hook must live
 * inside a mounted component (isolated fiber). These reproduce the JSX that used to live in the opaque
 * `buildBookmarkDetailSections` section factories; the whole-tab empty-omission (Related / Properties)
 * is handled once in the bookmark detail bodies, while each sub-block still returns `null` when empty.
 */

/**
 * The core "Details" block, now split into **one per-field view component per row** (#1163 field
 * extraction) so each row is an independently-placeable layout field. The rows with an editable
 * counterpart pair with their edit field in `BookmarkGeneralForm` (Description/Category/Tags/Media
 * type/Website); the view-only rows (Locations/Channel/Person, plus the Kavita/Plex rows reused from
 * their own field components) are their own view-only registry fields — there is intentionally **no**
 * catch-all "Other details" residual field. Each returns a self-hiding `DetailField` (or null), so the
 * layout seam's `space-y-6` stack applies gaps only between rows that actually render.
 */

/** Description row. */
export function BookmarkDescriptionDetailView({
  bookmark,
}: {
  bookmark: Bookmark;
}) {
  return (
    <DetailField label={i18n.t("Description")}>
      {bookmark.description
        ? <p className="whitespace-pre-wrap">{bookmark.description}</p>
        : null}
    </DetailField>
  );
}

/** Category link row. */
export function BookmarkCategoryDetailView({
  bookmark,
}: {
  bookmark: Bookmark;
}) {
  const {
    data: categories,
  } = useCategories();
  const category = (categories ?? []).find(item => item.id === bookmark.categoryId);
  return (
    <DetailField label={i18n.t("Category")}>
      {category
        ? <BookmarkCategoryLink category={category} />
        : null}
    </DetailField>
  );
}

/** Tags row (badge links), or null when the bookmark has no tags. */
export function BookmarkTagsDetailView({
  bookmark,
}: {
  bookmark: Bookmark;
}) {
  if (bookmark.tags.length === 0) return null;
  return (
    <DetailField label={i18n.t("Tags")}>
      <ul className="flex flex-wrap gap-1">
        {bookmark.tags.map(tag => (
          <li key={tag.id}>
            <Link
              to="/tags/$tagSlug"
              params={{
                tagSlug: tag.slug,
              }}
            >
              <Badge
                variant="secondary"
                className="
                  cursor-pointer
                  hover:opacity-80
                "
              >
                {tag.name}
              </Badge>
            </Link>
          </li>
        ))}
      </ul>
    </DetailField>
  );
}

/** Media type link row. */
export function BookmarkMediaTypeDetailView({
  bookmark,
}: {
  bookmark: Bookmark;
}) {
  return (
    <DetailField label={i18n.t("Media type")}>
      {bookmark.mediaType
        ? (
          <Link
            to="/taxonomies/media-types/$mediaTypeSlug"
            params={{
              mediaTypeSlug: bookmark.mediaType.slug,
            }}
            className="hover:underline"
          >
            {bookmark.mediaType.name}
          </Link>
        )
        : null}
    </DetailField>
  );
}

/** Website link row — the view side of the URL field. */
export function BookmarkWebsiteDetailView({
  bookmark,
}: {
  bookmark: Bookmark;
}) {
  return (
    <DetailField label={i18n.t("Website")}>
      {bookmark.website
        ? (
          <Link
            to="/taxonomies/websites/$websiteSlug"
            params={{
              websiteSlug: bookmark.website.slug,
            }}
            className="hover:underline"
          >
            {bookmark.website.siteName} ({bookmark.website.domain})
          </Link>
        )
        : null}
    </DetailField>
  );
}

/** Locations row (compact box), or null when the bookmark has no locations. Distinct from the Related
 *  tab's full `BookmarkLocationsMapView`. */
export function BookmarkLocationsDetailView({
  bookmark,
}: {
  bookmark: Bookmark;
}) {
  if (bookmark.locations.length === 0) return null;
  return (
    <DetailField label={i18n.t("Locations")}>
      <BookmarkLocationsBox locations={bookmark.locations} />
    </DetailField>
  );
}

/** YouTube channel link row. */
export function BookmarkChannelDetailView({
  bookmark,
}: {
  bookmark: Bookmark;
}) {
  return (
    <DetailField label={i18n.t("Channel")}>
      {bookmark.youtubeChannel
        ? (
          <Link
            to="/taxonomies/youtube-channels/$channelSlug"
            params={{
              channelSlug: bookmark.youtubeChannel.slug,
            }}
            className="hover:underline"
          >
            {bookmark.youtubeChannel.name}
          </Link>
        )
        : null}
    </DetailField>
  );
}

/** People links row, or null when the bookmark credits no people. */
export function BookmarkPersonDetailView({
  bookmark,
}: {
  bookmark: Bookmark;
}) {
  if (bookmark.people.length === 0) return null;
  return (
    <DetailField label={i18n.t("Person")}>
      <span className="flex flex-wrap gap-x-1">
        {bookmark.people.map((person, i) => (
          <span key={person.id}>
            {i > 0 && <span className="mr-1">,</span>}
            <Link
              to="/taxonomies/people/$personSlug"
              params={{
                personSlug: person.slug,
              }}
              className="hover:underline"
            >
              {person.name}
            </Link>
          </span>
        ))}
      </span>
    </DetailField>
  );
}

/** The grouped custom-property sections + the in-view boolean toggle handler. Returns null when this
 *  bookmark has no property rows (the detail bodies also drop the whole Properties tab when empty). */
export function BookmarkPropertiesView({
  bookmark,
}: {
  bookmark: Bookmark;
}) {
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: propertyGroups,
  } = usePropertyGroups();
  const defaultFieldZones = useDefaultFieldZones();
  const updateBookmark = useUpdateBookmark();

  if (!hasBookmarkPropertyRows(bookmark, properties ?? [], defaultFieldZones)) return null;

  function saveBoolean(propertyId: string, value: boolean) {
    updateBookmark.mutate({
      id: bookmark.id,
      input: {
        booleanValues: mergeBooleanValue(bookmark.booleanValues, propertyId, value),
      },
    });
  }

  return (
    <BookmarkPropertySections
      bookmark={bookmark}
      properties={properties ?? []}
      propertyGroups={propertyGroups ?? []}
      onSaveBoolean={saveBoolean}
    />
  );
}

/** The relationship-type + directional-role + label badges for one explicit relationship edge. */
export function relationshipBadges(relationship: BookmarkRelationship): ReactNode {
  return (
    <>
      <Badge variant="secondary">
        {builtInName({
          name: relationship.relationshipTypeName,
          builtIn: relationship.relationshipTypeBuiltIn,
        }, i18n.t)}
      </Badge>
      {relationship.directional
        ? (
          <Badge variant="outline">
            {relationship.role === "child" ? i18n.t("child") : i18n.t("parent")}
          </Badge>
        )
        : null}
      {relationship.label
        ? <span className="text-xs text-muted-foreground">“{relationship.label}”</span>
        : null}
    </>
  );
}

/** The "Related bookmarks" card grid, or null when this bookmark has no related bookmarks. */
export function BookmarkRelatedBookmarksView({
  bookmark,
}: {
  bookmark: Bookmark;
}) {
  const {
    data: properties,
  } = useCustomProperties();
  const relatedBookmarks = useRelatedBookmarks(bookmark);
  if (relatedBookmarks.length === 0) return null;

  const relationshipByBookmarkId = new Map(
    relatedBookmarks
      .filter(entry => entry.relationship !== undefined)
      .map(entry => [entry.bookmark.id, entry.relationship as BookmarkRelationship]),
  );
  return (
    <LabeledSection
      title={i18n.t("Related bookmarks")}
      description={i18n.t("Explicitly related bookmarks are pinned first; the rest are scored by the weights in Settings → Display → Bookmark Graph.")}
    >
      <BookmarkCardGrid
        bookmarks={relatedBookmarks.map(entry => entry.bookmark)}
        properties={properties ?? []}
        columns={2}
        badgeFor={(item) => {
          const relationship = relationshipByBookmarkId.get(item.id);
          return relationship ? relationshipBadges(relationship) : null;
        }}
      />
    </LabeledSection>
  );
}

/** The parent/child hierarchy tree, or null when this bookmark has no such relationships. */
export function BookmarkHierarchyView({
  bookmark,
}: {
  bookmark: Bookmark;
}) {
  const {
    data: allBookmarks,
  } = useBookmarks();
  const flatHierarchy = flattenTree(buildBookmarkHierarchy(bookmark.id, allBookmarks ?? []));
  if (flatHierarchy.length === 0) return null;
  return (
    <LabeledSection
      title={i18n.t("Hierarchy")}
      description={i18n.t("Parent/child relationships above and below this bookmark.")}
    >
      <ul className="space-y-1">
        {flatHierarchy.map(({
          node, depth,
        }) => (
          <li
            key={node.bookmark.id}
            style={{
              paddingLeft: `${depth * 1.25}rem`,
            }}
          >
            {node.isTarget
              ? (
                <span className="text-sm font-semibold">{node.bookmark.title}</span>
              )
              : (
                <Link
                  to="/bookmarks/$bookmarkId"
                  params={{
                    bookmarkId: node.bookmark.id,
                  }}
                  className="
                    text-sm
                    hover:underline
                  "
                >
                  {node.bookmark.title}
                </Link>
              )}
          </li>
        ))}
      </ul>
    </LabeledSection>
  );
}

/** The bookmark-detail label for each shareable media-source identity field. */
export const MEDIA_SOURCE_FIELD_LABELS: Record<MediaSourceMatchGroup["field"], () => string> = {
  plexRatingKey: () => i18n.t("Plex item"),
  kavitaSeriesId: () => i18n.t("Kavita series"),
  isbn: () => i18n.t("ISBN"),
  feedUrl: () => i18n.t("podcast feed"),
};

/** Cross-links to other bookmarks sharing a Plex/Kavita/ISBN/feed identity, or null when none. */
export function BookmarkMediaSourceView({
  bookmark,
}: {
  bookmark: Bookmark;
}) {
  const mediaSourceMatches = useBookmarksSharingMediaSource(bookmark);
  if (mediaSourceMatches.length === 0) return null;
  return (
    <LabeledSection
      title={i18n.t("Shared media source")}
      description={i18n.t("Other bookmarks that carry the same Plex, Kavita, ISBN, or podcast-feed identity.")}
    >
      <ul className="space-y-1 text-sm">
        {mediaSourceMatches.map((group) => {
          const count = group.bookmarks.length;
          const label = MEDIA_SOURCE_FIELD_LABELS[group.field]();
          return (
            <li key={group.field}>
              <Link
                to="/bookmarks"
                search={withMediaSourceMatch(group.field, group.value)}
                className="hover:underline"
              >
                {count === 1
                  ? i18n.t("1 other bookmark shares this {{label}}", {
                    label,
                  })
                  : i18n.t("{{count}} other bookmarks share this {{label}}", {
                    count,
                    label,
                  })}
              </Link>
            </li>
          );
        })}
      </ul>
    </LabeledSection>
  );
}

/** The full locations map + ancestor breadcrumb trail, or null when the bookmark has no locations. */
export function BookmarkLocationsMapView({
  bookmark,
}: {
  bookmark: Bookmark;
}) {
  const {
    data: locationTree,
  } = useLocationTree();
  if (bookmark.locations.length === 0) return null;
  return (
    <BookmarkLocationsTabContent
      bookmarkId={bookmark.id}
      locations={bookmark.locations}
      locationTree={locationTree}
    />
  );
}

/** The read-only Metadata block (Priority + Created). Always present, matching the old view. */
export function BookmarkMetadataView({
  bookmark,
}: {
  bookmark: Bookmark;
}) {
  return (
    <LabeledSection title={i18n.t("Metadata")}>
      <dl className="space-y-3">
        <DetailField label={i18n.t("Priority")}>
          <span>{bookmark.priority}</span>
        </DetailField>

        <DetailField label={i18n.t("Created")}>
          <span>{new Date(bookmark.createdAt).toLocaleString()}</span>
        </DetailField>
      </dl>
    </LabeledSection>
  );
}
