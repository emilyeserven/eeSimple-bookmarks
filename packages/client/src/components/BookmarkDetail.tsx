import type { Bookmark, Category, CustomProperty, PropertyGroup } from "@eesimple/types";

import { youtubeEmbedUrl } from "@eesimple/types";
import { Link } from "@tanstack/react-router";

import { useViewPanelClick } from "./panel/useEditPanelClick";
import { formatDateTime, formatNumber } from "../lib/bookmarkFormat";

import { DetailField } from "@/components/DetailField";
import { LabeledSection } from "@/components/LabeledSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CategoryIcon } from "@/lib/icons";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

interface BookmarkDetailProps {
  bookmark: Bookmark;
  /** All categories, used to resolve the bookmark's category name/icon/slug. */
  categories?: Category[];
  /** Custom property definitions, used to label and unit-format the bookmark's values. */
  properties?: CustomProperty[];
  /** Property groups, used to group property values under their group headings. */
  propertyGroups?: PropertyGroup[];
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * The full view of a single bookmark, showing every field including each custom-property value.
 * Shared by the bookmark detail page and the right panel's bookmark view so the two stay identical.
 * Presentational: pass `categories`/`properties` for labels and `onEdit`/`onDelete` for actions.
 */
export function BookmarkDetail({
  bookmark, categories = [], properties = [], propertyGroups = [], onEdit, onDelete,
}: BookmarkDetailProps) {
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  const category = categories.find(item => item.id === bookmark.categoryId);
  const byId = new Map(properties.map(property => [property.id, property]));

  const numberRows = bookmark.numberValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      return property
        ? {
          id: entry.propertyId,
          name: property.name,
          groupId: property.propertyGroupId,
          isCalculated: property.type === "calculate",
          value: formatNumber(entry.value, property),
        }
        : null;
    })
    .filter((row): row is { id: string;
      name: string;
      groupId: string | null;
      isCalculated: boolean;
      value: string; } => row !== null);

  const booleanRows = bookmark.booleanValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      return property
        ? {
          id: entry.propertyId,
          name: property.name,
          groupId: property.propertyGroupId,
          value: entry.value ? "Yes" : "No",
        }
        : null;
    })
    .filter((row): row is { id: string;
      name: string;
      groupId: string | null;
      value: string; } => row !== null);

  const dateTimeRows = bookmark.dateTimeValues
    .map((entry) => {
      const property = byId.get(entry.propertyId);
      return property
        ? {
          id: entry.propertyId,
          name: property.name,
          groupId: property.propertyGroupId,
          value: formatDateTime(entry.value, property),
        }
        : null;
    })
    .filter((row): row is { id: string;
      name: string;
      groupId: string | null;
      value: string; } => row !== null);

  const hasProperties = numberRows.length > 0 || booleanRows.length > 0 || dateTimeRows.length > 0;

  // Partition the property rows by group. Groups with rows render first (ordered by priority then
  // name) under their own heading; everything ungrouped (or whose group is unknown) falls into a
  // trailing "Properties" section. A row belongs to the ungrouped bucket when its `groupId` is null
  // or doesn't resolve to a known group.
  const knownGroupIds = new Set(propertyGroups.map(group => group.id));
  const inGroup = (groupId: string | null, target: string | null): boolean =>
    target === null
      ? groupId === null || !knownGroupIds.has(groupId)
      : groupId === target;
  const sortedGroups = [...propertyGroups]
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
  const propertySections = [
    ...sortedGroups.map(group => ({
      key: group.id,
      title: group.name,
      target: group.id as string | null,
    })),
    {
      key: "__ungrouped__",
      title: "Properties",
      target: null as string | null,
    },
  ].filter(section =>
    numberRows.some(row => inGroup(row.groupId, section.target))
    || booleanRows.some(row => inGroup(row.groupId, section.target))
    || dateTimeRows.some(row => inGroup(row.groupId, section.target)));
  // For YouTube bookmarks, show a playable embed in place of the static thumbnail.
  const embedUrl = youtubeEmbedUrl(bookmark.url);

  return (
    <div className="@container space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-bold">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noreferrer"
              className="
                text-primary
                hover:underline
              "
            >
              {bookmark.title}
            </a>
          </h1>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noreferrer"
            className="
              block truncate text-sm text-muted-foreground
              hover:underline
            "
          >
            {bookmark.url}
          </a>
        </div>
        {onEdit || onDelete
          ? (
            <div className="flex shrink-0 items-center gap-1">
              {onEdit
                ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                  >
                    Edit
                  </Button>
                )
                : null}
              {onDelete
                ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="
                      text-destructive
                      hover:text-destructive
                    "
                  >
                    Delete
                  </Button>
                )
                : null}
            </div>
          )
          : null}
      </div>

      <div
        className="
          flex flex-col gap-6
          @2xl:flex-row @2xl:items-start
        "
      >
        {embedUrl
          ? (
            <div
              className="
                aspect-video w-full overflow-hidden rounded-md border
                @2xl:w-96 @2xl:shrink-0
              "
            >
              <iframe
                src={embedUrl}
                title={bookmark.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                className="size-full"
              />
            </div>
          )
          : bookmark.image
            ? (
              <img
                src={bookmark.image.url}
                alt=""
                loading="lazy"
                className="
                  max-h-72 w-full rounded-md border object-contain
                  @2xl:w-72 @2xl:shrink-0
                "
              />
            )
            : null}

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
                  ? (
                    <Link
                      to="/categories/$categorySlug"
                      params={{
                        categorySlug: category.slug,
                      }}
                      title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
                      onClick={event => viewClick(event, "category", category.id)}
                      className="
                        inline-flex items-center gap-1.5 text-primary
                        hover:underline
                      "
                    >
                      <CategoryIcon
                        name={category.icon}
                        className="size-4 shrink-0"
                      />
                      {category.name}
                    </Link>
                  )
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

          {hasProperties
            ? propertySections.map(section => (
              <div key={section.key}>
                <Separator className="mb-6" />
                <LabeledSection title={section.title}>
                  <dl className="space-y-1">
                    {numberRows.filter(row => inGroup(row.groupId, section.target)).map(row => (
                      <div
                        key={row.id}
                        className="flex items-baseline gap-2"
                      >
                        <dt className="text-muted-foreground">
                          {row.name}
                          {row.isCalculated
                            ? <span className="text-xs"> (calculated)</span>
                            : null}
                          :
                        </dt>
                        <dd>{row.value}</dd>
                      </div>
                    ))}
                    {booleanRows.filter(row => inGroup(row.groupId, section.target)).map(row => (
                      <div
                        key={row.id}
                        className="flex items-baseline gap-2"
                      >
                        <dt className="text-muted-foreground">
                          {row.name}
                          :
                        </dt>
                        <dd>{row.value}</dd>
                      </div>
                    ))}
                    {dateTimeRows.filter(row => inGroup(row.groupId, section.target)).map(row => (
                      <div
                        key={row.id}
                        className="flex items-baseline gap-2"
                      >
                        <dt className="text-muted-foreground">
                          {row.name}
                          :
                        </dt>
                        <dd>{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </LabeledSection>
              </div>
            ))
            : null}

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
      </div>
    </div>
  );
}
