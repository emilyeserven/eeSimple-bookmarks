import type { BookmarkHierarchyNode } from "../lib/bookmarkHierarchy";
import type { FlatNode } from "../lib/tagTree";
import type { Bookmark, CardFieldZones, Category, CustomProperty, LocationNode, PropertyGroup } from "@eesimple/types";
import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

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

export type BookmarkDetailSectionId
  = | "general"
    | "gallery"
    | "video"
    | "relationships"
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
    label: "Details",
    content: (
      <div className="space-y-6">
        <LabeledSection title="Details">
          <dl className="space-y-3">
            <DetailField label="Description">
              {bookmark.description
                ? <p className="whitespace-pre-wrap">{bookmark.description}</p>
                : null}
            </DetailField>

            <DetailField label="Category">
              {category
                ? <BookmarkCategoryLink category={category} />
                : null}
            </DetailField>

            {bookmark.tags.length > 0
              ? (
                <DetailField label="Tags">
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
                <DetailField label="Locations">
                  <BookmarkLocationsBox locations={bookmark.locations} />
                </DetailField>
              )
              : null}

            <DetailField label="Website">
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

            <DetailField label="Media type">
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

            <DetailField label="Channel">
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
                <DetailField label="Person">
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
    label: "Gallery",
    content: <BookmarkGallery bookmark={bookmark} />,
  };
}

function videoSection(bookmark: Bookmark): BookmarkDetailSection | null {
  if (bookmark.reelArchive === null) return null;
  return {
    id: "video",
    label: "Video",
    content: <BookmarkReelArchivePlayer bookmark={bookmark} />,
  };
}

function relationshipsSection(bookmark: Bookmark): BookmarkDetailSection | null {
  if (bookmark.relationships.length === 0) return null;
  return {
    id: "relationships",
    label: "Relationships",
    content: (
      <LabeledSection title="Relationships">
        <ul className="space-y-2">
          {bookmark.relationships.map(rel => (
            <li key={`${rel.relationshipTypeId}:${rel.bookmark.id}`}>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/bookmarks/$bookmarkId"
                  params={{
                    bookmarkId: rel.bookmark.id,
                  }}
                  className="
                    text-sm font-medium
                    hover:underline
                  "
                >
                  {rel.bookmark.title}
                </Link>
                <Badge variant="secondary">{rel.relationshipTypeName}</Badge>
                {rel.directional
                  ? (
                    <Badge variant="outline">
                      {rel.role === "child" ? "child" : "parent"}
                    </Badge>
                  )
                  : null}
                {rel.label
                  ? <span className="text-xs text-muted-foreground">“{rel.label}”</span>
                  : null}
              </div>
              <p className="truncate text-xs text-muted-foreground">{rel.bookmark.url}</p>
            </li>
          ))}
        </ul>
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
    label: "Hierarchy",
    content: (
      <LabeledSection
        title="Hierarchy"
        description="Parent/child relationships above and below this bookmark."
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
    label: "Locations",
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
    label: "Metadata",
    content: (
      <LabeledSection title="Metadata">
        <dl className="space-y-3">
          <DetailField label="Priority">
            <span>{bookmark.priority}</span>
          </DetailField>

          <DetailField label="Created">
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
    label: "Debug",
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
    relationshipsSection(args.bookmark),
    hierarchySection(args.flatHierarchy),
    locationsSection(args.bookmark, args.locationTree),
    metadataSection(args.bookmark),
    debugSection(args.bookmark),
  ].filter((section): section is BookmarkDetailSection => section !== null);
}
