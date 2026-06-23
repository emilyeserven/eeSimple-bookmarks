import type { BookmarkHierarchyNode } from "../lib/bookmarkHierarchy";
import type { FlatNode } from "../lib/tagTree";
import type { Bookmark, CardFieldZones, Category, CustomProperty, PropertyGroup } from "@eesimple/types";
import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

import { BookmarkCategoryLink } from "./BookmarkCategoryLink";
import { BookmarkPropertySections } from "./BookmarkPropertySections";
import { hasBookmarkPropertyRows } from "../lib/bookmarkProperties";

import { DetailField } from "@/components/DetailField";
import { LabeledSection } from "@/components/LabeledSection";
import { Badge } from "@/components/ui/badge";

export type BookmarkDetailSectionId
  = | "general"
    | "tags"
    | "relationships"
    | "hierarchy"
    | "properties"
    | "metadata";

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
}

function generalSection(bookmark: Bookmark, category: Category | undefined): BookmarkDetailSection {
  return {
    id: "general",
    label: "Details",
    content: (
      <LabeledSection title="Details">
        <dl className="space-y-3">
          <DetailField label="Description">
            {bookmark.description
              ? <p className="whitespace-pre-wrap">{bookmark.description}</p>
              : null}
          </DetailField>

          {bookmark.newsletterContext
            ? (
              <DetailField label="Newsletter Context">
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">{bookmark.newsletterContext}</p>
              </DetailField>
            )
            : null}

          <DetailField label="Category">
            {category
              ? <BookmarkCategoryLink category={category} />
              : null}
          </DetailField>

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
        </dl>
      </LabeledSection>
    ),
  };
}

function tagsSection(bookmark: Bookmark): BookmarkDetailSection | null {
  if (bookmark.tags.length === 0) return null;
  return {
    id: "tags",
    label: "Tags",
    content: (
      <LabeledSection title="Tags">
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
      </LabeledSection>
    ),
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

function propertiesSection(args: BuildArgs): BookmarkDetailSection | null {
  const {
    bookmark, properties, propertyGroups, onSaveBoolean, defaultFieldZones,
  } = args;
  if (!hasBookmarkPropertyRows(bookmark, properties, defaultFieldZones)) return null;
  return {
    id: "properties",
    label: "Properties",
    content: (
      <BookmarkPropertySections
        bookmark={bookmark}
        properties={properties}
        propertyGroups={propertyGroups}
        onSaveBoolean={onSaveBoolean}
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

/**
 * Build the list of present bookmark-detail sections (General, Tags, Relationships, Hierarchy,
 * Properties, Metadata) as `{ id, label, content }`. Empty sections are omitted. Shared by
 * `BookmarkDetailBody` (single column) and `BookmarkDetailTabbed` so both render identical content.
 *
 * Pure: callers compute `flatHierarchy` (via `useBookmarks()` + `buildBookmarkHierarchy` +
 * `flattenTree`) and pass it in.
 */
export function buildBookmarkDetailSections(args: BuildArgs): BookmarkDetailSection[] {
  const category = args.categories.find(item => item.id === args.bookmark.categoryId);
  return [
    generalSection(args.bookmark, category),
    tagsSection(args.bookmark),
    relationshipsSection(args.bookmark),
    hierarchySection(args.flatHierarchy),
    propertiesSection(args),
    metadataSection(args.bookmark),
  ].filter((section): section is BookmarkDetailSection => section !== null);
}
