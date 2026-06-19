import type { Bookmark, Category, CustomProperty, PropertyGroup } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { BookmarkCategoryLink } from "./BookmarkCategoryLink";
import { BookmarkPropertySections } from "./BookmarkPropertySections";

import { DetailField } from "@/components/DetailField";
import { LabeledSection } from "@/components/LabeledSection";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface BookmarkDetailBodyProps {
  bookmark: Bookmark;
  /** All categories, used to resolve the bookmark's category name/icon/slug. */
  categories: Category[];
  /** Custom property definitions, used to label and unit-format the bookmark's values. */
  properties: CustomProperty[];
  /** Property groups, used to group property values under their group headings. */
  propertyGroups: PropertyGroup[];
}

/**
 * The right-hand content column of the bookmark detail view: the Details fields, Tags, the grouped
 * custom-property sections, and Metadata. Split out of `BookmarkDetail` so the page shell keeps a
 * lean import surface.
 */
export function BookmarkDetailBody({
  bookmark, categories, properties, propertyGroups,
}: BookmarkDetailBodyProps) {
  const category = categories.find(item => item.id === bookmark.categoryId);

  return (
    <div className="min-w-0 flex-1 space-y-6">
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

          <DetailField label="Website">
            {bookmark.website
              ? `${bookmark.website.siteName} (${bookmark.website.domain})`
              : null}
          </DetailField>

          <DetailField label="Media type">
            {bookmark.mediaType ? bookmark.mediaType.name : null}
          </DetailField>

          <DetailField label="Channel">
            {bookmark.youtubeChannel ? bookmark.youtubeChannel.name : null}
          </DetailField>
        </dl>
      </LabeledSection>

      {bookmark.tags.length > 0
        ? (
          <>
            <Separator />
            <LabeledSection title="Tags">
              <ul className="flex flex-wrap gap-1">
                {bookmark.tags.map(tag => (
                  <li key={tag.id}>
                    <Badge variant="secondary">{tag.name}</Badge>
                  </li>
                ))}
              </ul>
            </LabeledSection>
          </>
        )
        : null}

      {bookmark.relatedBookmarks.length > 0
        ? (
          <>
            <Separator />
            <LabeledSection title="Relationships">
              <ul className="space-y-1">
                {bookmark.relatedBookmarks.map(related => (
                  <li key={related.id}>
                    <Link
                      to="/bookmarks/$bookmarkId"
                      params={{
                        bookmarkId: related.id,
                      }}
                      className="
                        text-sm font-medium
                        hover:underline
                      "
                    >
                      {related.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">{related.url}</p>
                  </li>
                ))}
              </ul>
            </LabeledSection>
          </>
        )
        : null}

      <BookmarkPropertySections
        bookmark={bookmark}
        properties={properties}
        propertyGroups={propertyGroups}
      />

      <Separator />
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
    </div>
  );
}
