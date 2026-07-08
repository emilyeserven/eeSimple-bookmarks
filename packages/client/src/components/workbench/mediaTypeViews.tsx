import type { MediaType } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityAutofillSources } from "../EntityAutofillSources";
import { EntityNamesTabView, PrimaryLanguageTabView } from "../entityNames/EntityNamesTab";
import { HierarchyView } from "../HierarchyView";
import { MediaTypeTreeList } from "../MediaTypeTreeList";

import { DetailField } from "@/components/DetailField";
import { useExpandedSet } from "@/hooks/useExpandedSet";
import { useMediaTypes, useMediaTypeTree } from "@/hooks/useMediaTypes";
import { CategoryIcon } from "@/lib/icons";
import { findAncestorPath, flattenTree } from "@/lib/tagTree";

interface MediaTypeViewProps {
  mediaType: MediaType;
}

/** "Added" (created date) row. */
export function MediaTypeAddedView({
  mediaType,
}: MediaTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Added")}>{new Date(mediaType.createdAt).toLocaleDateString()}</DetailField>;
}

/** "Slug" row (monospace). */
export function MediaTypeSlugView({
  mediaType,
}: MediaTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Slug")}>
      <span className="font-mono">{mediaType.slug}</span>
    </DetailField>
  );
}

/** "Description" row — self-hiding when empty. */
export function MediaTypeDescriptionView({
  mediaType,
}: MediaTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Description")}>{mediaType.description || null}</DetailField>;
}

/** "Parent" row — self-hiding for a root type; resolves the parent's name from the flat list. */
export function MediaTypeParentView({
  mediaType,
}: MediaTypeViewProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: allMediaTypes,
  } = useMediaTypes();
  if (mediaType.parentId == null) return null;
  const parentName = (allMediaTypes ?? []).find(m => m.id === mediaType.parentId)?.name ?? "—";
  return <DetailField label={t("Parent")}>{parentName}</DetailField>;
}

/** "Icon" row — the icon glyph, or a muted "None". */
export function MediaTypeIconView({
  mediaType,
}: MediaTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Icon")}>
      {mediaType.icon
        ? (
          <CategoryIcon
            name={mediaType.icon}
            className="size-4"
          />
        )
        : <span className="text-muted-foreground">{t("None")}</span>}
    </DetailField>
  );
}

/** "Sort order" row. */
export function MediaTypeSortOrderView({
  mediaType,
}: MediaTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Sort order")}>{mediaType.sortOrder}</DetailField>;
}

/** "Built-in" (Yes/No) row. */
export function MediaTypeBuiltInView({
  mediaType,
}: MediaTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Built-in")}>{mediaType.builtIn ? t("Yes") : t("No")}</DetailField>;
}

/** "Bookmarks" (count) row — self-hiding when the count wasn't hydrated. */
export function MediaTypeBookmarksView({
  mediaType,
}: MediaTypeViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Bookmarks")}>{mediaType.bookmarkCount ?? null}</DetailField>;
}

/**
 * The General view tab, recomposed from the same placeable per-row {@link DetailField} components the
 * media type workbench registry uses — so this whole-view shell (used by `mediaTypeViews.stories.tsx`)
 * stays in lockstep with the layout-driven General tab.
 */
export function MediaTypeGeneralView({
  entity: mt,
}: {
  entity: MediaType;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <MediaTypeAddedView mediaType={mt} />
        <MediaTypeSlugView mediaType={mt} />
        <MediaTypeDescriptionView mediaType={mt} />
        <MediaTypeParentView mediaType={mt} />
        <MediaTypeIconView mediaType={mt} />
        <MediaTypeSortOrderView mediaType={mt} />
        <MediaTypeBuiltInView mediaType={mt} />
        <MediaTypeBookmarksView mediaType={mt} />
      </div>
      <PrimaryLanguageTabView
        ownerType="mediaType"
        ownerId={mt.id}
      />
      <EntityNamesTabView
        ownerType="mediaType"
        ownerId={mt.id}
      />
      <EntityAutofillSources
        match={{
          kind: "media-type",
          mediaTypeId: mt.id,
        }}
      />
    </div>
  );
}

export function MediaTypeHierarchyView({
  entity: mt,
}: {
  entity: MediaType;
}) {
  const {
    data, isLoading,
  } = useMediaTypeTree();
  const {
    t,
  } = useTranslation();
  const tree = data ?? [];
  const node = flattenTree(tree).find(flat => flat.node.slug === mt.slug)?.node;
  const {
    expanded, onToggle,
  } = useExpandedSet(node?.children.map(c => c.id) ?? []);

  if (isLoading && !node) return <p className="text-muted-foreground">{t("Loading…")}</p>;
  if (!node) return <p className="text-destructive">{t("Media type not found.")}</p>;

  const path = findAncestorPath(tree, mt.slug);
  const ancestors = path ? path.slice(0, -1) : [];

  return (
    <HierarchyView
      ancestors={ancestors}
      renderAncestorLink={ancestor => (
        <Link
          to="/taxonomies/media-types/$mediaTypeSlug/info"
          params={{
            mediaTypeSlug: ancestor.slug,
          }}
          className="hover:underline"
        >
          {ancestor.name}
        </Link>
      )}
      hasChildren={node.children.length > 0}
      childrenEmptyLabel={t("No child media types.")}
      childrenList={(
        <MediaTypeTreeList
          tree={node.children}
          expanded={expanded}
          onToggle={onToggle}
          columns={1}
        />
      )}
    />
  );
}
