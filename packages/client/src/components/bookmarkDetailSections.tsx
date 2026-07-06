import type { BookmarkHierarchyNode } from "../lib/bookmarkHierarchy";
import type { RelatedBookmarkEntry } from "../lib/relatedBookmarks";
import type { FlatNode } from "../lib/tagTree";
import type { Bookmark, BookmarkRelationship, CardFieldZones, Category, CustomProperty, LocationNode, PropertyGroup } from "@eesimple/types";
import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

import { BookmarkCardGrid } from "./BookmarkCardGrid";
import { BookmarkCategoryLink } from "./BookmarkCategoryLink";
import { BookmarkDetailDebug } from "./BookmarkDetailDebug";
import { BookmarkGallery } from "./BookmarkGallery";
import { BookmarkKavitaDetailRow } from "./BookmarkKavitaField";
import { BookmarkLocationsBox } from "./BookmarkLocationsBox";
import { BookmarkLocationsTabContent } from "./BookmarkLocationsTabContent";
import { BookmarkPlexDetailRow } from "./BookmarkPlexField";
import { BookmarkPropertySections } from "./BookmarkPropertySections";
import { BookmarkReelArchivePlayer } from "./BookmarkReelArchive";
import { hasBookmarkPropertyRows } from "../lib/bookmarkProperties";

import { DetailField } from "@/components/DetailField";
import { LabeledSection } from "@/components/LabeledSection";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import i18n from "@/i18n";

export type BookmarkDetailSectionId
  = | "general"
    | "gallery"
    | "video"
    | "relationships"
    | "related"
    | "hierarchy"
    | "locations"
    | "metadata"
    | "debug";

/** One renderable section of the bookmark detail view, used by both the single-column and tabbed layouts. */
export interface BookmarkDetailSection {
  id: BookmarkDetailSectionId;
  /** Tab/heading label. */
  label: string;
  /** The section body, free of inter-section separators (the consumer owns those). */
  content: ReactNode;
}

interface BuildArgs {
  bookmark: Bookmark;
  /** All categories, used to resolve the bookmark's category name/icon/slug. */
  categories: Category[];
  /** Custom property definitions, used to label and unit-format the bookmark's values. */
  properties: CustomProperty[];
  /** Property groups, used to group property values under their group headings. */
  propertyGroups: PropertyGroup[];
  /** Flattened parent/child hierarchy around this bookmark (empty when it has no such relationships). */
  flatHierarchy: FlatNode<BookmarkHierarchyNode>[];
  /**
   * Bookmarks related to this one — explicit relationship partners pinned first (badged), then the
   * rest scored by the Bookmark Graph weights; empty = omit the section.
   */
  relatedBookmarks: RelatedBookmarkEntry[];
  /** When provided, boolean properties with `clickableInView` enabled render as toggles. */
  onSaveBoolean?: (propertyId: string, value: boolean) => void;
  /** The Default card display rule's field zones, resolving the per-card boolean display knobs. */
  defaultFieldZones?: CardFieldZones;
  /** Full location tree for the map + ancestor breadcrumb trail; undefined while loading. */
  locationTree?: LocationNode[];
}

function generalSection(args: BuildArgs, category: Category | undefined): BookmarkDetailSection {
  const {
    bookmark, properties, propertyGroups, onSaveBoolean, defaultFieldZones,
  } = args;
  const hasProperties = hasBookmarkPropertyRows(bookmark, properties, defaultFieldZones);
  return {
    id: "general",
    label: i18n.t("Details"),
    content: (
      <div className="space-y-6">
        <LabeledSection title={i18n.t("Details")}>
          <dl className="space-y-3">
            <DetailField label={i18n.t("Description")}>
              {bookmark.description
                ? <p className="whitespace-pre-wrap">{bookmark.description}</p>
                : null}
            </DetailField>

            <DetailField label={i18n.t("Category")}>
              {category
                ? <BookmarkCategoryLink category={category} />
                : null}
            </DetailField>

            {bookmark.tags.length > 0
              ? (
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
              )
              : null}

            {bookmark.locations.length > 0
              ? (
                <DetailField label={i18n.t("Locations")}>
                  <BookmarkLocationsBox locations={bookmark.locations} />
                </DetailField>
              )
              : null}

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

            {bookmark.people.length > 0
              ? (
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
              )
              : null}

            {bookmark.languageUsages.length > 0
              ? (
                <DetailField label={i18n.t("Languages")}>
                  <span className="flex flex-wrap gap-x-2 gap-y-1">
                    {bookmark.languageUsages.map(usage => (
                      <span key={usage.id}>
                        {usage.language.name}
                        {" — "}
                        {usage.level.name}
                        {usage.note ? ` (${usage.note})` : ""}
                      </span>
                    ))}
                  </span>
                </DetailField>
              )
              : null}

            <BookmarkKavitaDetailRow bookmark={bookmark} />

            <BookmarkPlexDetailRow bookmark={bookmark} />
          </dl>
        </LabeledSection>
        {hasProperties
          ? (
            <>
              <Separator />
              <BookmarkPropertySections
                bookmark={bookmark}
                properties={properties}
                propertyGroups={propertyGroups}
                onSaveBoolean={onSaveBoolean}
              />
            </>
          )
          : null}
      </div>
    ),
  };
}

function gallerySection(bookmark: Bookmark): BookmarkDetailSection | null {
  if (bookmark.images.length === 0 && bookmark.screenshot === null) return null;
  return {
    id: "gallery",
    label: i18n.t("Gallery"),
    content: <BookmarkGallery bookmark={bookmark} />,
  };
}

function videoSection(bookmark: Bookmark): BookmarkDetailSection | null {
  if (bookmark.reelArchive === null) return null;
  return {
    id: "video",
    label: i18n.t("Video"),
    content: <BookmarkReelArchivePlayer bookmark={bookmark} />,
  };
}

/** The relationship-type + directional-role + label badges for one explicit relationship edge. */
function relationshipBadges(relationship: BookmarkRelationship): ReactNode {
  return (
    <>
      <Badge variant="secondary">{relationship.relationshipTypeName}</Badge>
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

function relatedSection(args: BuildArgs): BookmarkDetailSection | null {
  if (args.relatedBookmarks.length === 0) return null;
  const relationshipByBookmarkId = new Map(
    args.relatedBookmarks
      .filter(entry => entry.relationship !== undefined)
      .map(entry => [entry.bookmark.id, entry.relationship as BookmarkRelationship]),
  );
  return {
    id: "related",
    label: i18n.t("Related"),
    content: (
      <LabeledSection
        title={i18n.t("Related bookmarks")}
        description={i18n.t("Explicitly related bookmarks are pinned first; the rest are scored by the weights in Settings → Display → Bookmark Graph.")}
      >
        <BookmarkCardGrid
          bookmarks={args.relatedBookmarks.map(entry => entry.bookmark)}
          properties={args.properties}
          columns={2}
          badgeFor={(bookmark) => {
            const relationship = relationshipByBookmarkId.get(bookmark.id);
            return relationship ? relationshipBadges(relationship) : null;
          }}
        />
      </LabeledSection>
    ),
  };
}

function hierarchySection(
  flatHierarchy: FlatNode<BookmarkHierarchyNode>[],
): BookmarkDetailSection | null {
  if (flatHierarchy.length === 0) return null;
  return {
    id: "hierarchy",
    label: i18n.t("Hierarchy"),
    content: (
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
    ),
  };
}

function locationsSection(
  bookmark: Bookmark,
  locationTree: LocationNode[] | undefined,
): BookmarkDetailSection | null {
  if (bookmark.locations.length === 0) return null;
  return {
    id: "locations",
    label: i18n.t("Locations"),
    content: (
      <BookmarkLocationsTabContent
        bookmarkId={bookmark.id}
        locations={bookmark.locations}
        locationTree={locationTree}
      />
    ),
  };
}

function metadataSection(bookmark: Bookmark): BookmarkDetailSection {
  return {
    id: "metadata",
    label: i18n.t("Metadata"),
    content: (
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
    ),
  };
}

function debugSection(bookmark: Bookmark): BookmarkDetailSection {
  return {
    id: "debug",
    label: i18n.t("Debug"),
    content: (
      <BookmarkDetailDebug
        bookmark={bookmark}
        showHeading={false}
      />
    ),
  };
}

/**
 * Build the list of present bookmark-detail sections (General, Tags, Relationships, Hierarchy,
 * Properties, Metadata, Debug) as `{ id, label, content }`. Empty sections are omitted. Shared by
 * `BookmarkDetailBody` (single column) and `BookmarkDetailTabbed` so both render identical content.
 *
 * Pure: callers compute `flatHierarchy` (via `useBookmarks()` + `buildBookmarkHierarchy` +
 * `flattenTree`) and pass it in.
 */
export function buildBookmarkDetailSections(args: BuildArgs): BookmarkDetailSection[] {
  const category = args.categories.find(item => item.id === args.bookmark.categoryId);
  return [
    generalSection(args, category),
    gallerySection(args.bookmark),
    videoSection(args.bookmark),
    relatedSection(args),
    hierarchySection(args.flatHierarchy),
    locationsSection(args.bookmark, args.locationTree),
    metadataSection(args.bookmark),
    debugSection(args.bookmark),
  ].filter((section): section is BookmarkDetailSection => section !== null);
}
