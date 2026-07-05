import type { MediaType } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { EntityAutofillSources } from "../EntityAutofillSources";
import { EntityNamesTabView } from "../entityNames/EntityNamesTab";
import { HierarchyView } from "../HierarchyView";
import { MediaTypeTreeList } from "../MediaTypeTreeList";

import { useExpandedSet } from "@/hooks/useExpandedSet";
import { useMediaTypes, useMediaTypeTree } from "@/hooks/useMediaTypes";
import { CategoryIcon } from "@/lib/icons";
import { findAncestorPath, flattenTree } from "@/lib/tagTree";

export function MediaTypeGeneralView({
  entity: mt,
}: {
  entity: MediaType;
}) {
  const {
    data: allMediaTypes,
  } = useMediaTypes();
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{t("Added")}</dt>
        <dd>{new Date(mt.createdAt).toLocaleDateString()}</dd>
        <dt className="text-muted-foreground">{t("Slug")}</dt>
        <dd className="font-mono">{mt.slug}</dd>
        {mt.parentId != null
          ? (
            <>
              <dt className="text-muted-foreground">{t("Parent")}</dt>
              <dd>{(allMediaTypes ?? []).find(m => m.id === mt.parentId)?.name ?? "—"}</dd>
            </>
          )
          : null}
        <dt className="text-muted-foreground">{t("Icon")}</dt>
        <dd>
          {mt.icon
            ? (
              <CategoryIcon
                name={mt.icon}
                className="size-4"
              />
            )
            : <span className="text-muted-foreground">{t("None")}</span>}
        </dd>
        <dt className="text-muted-foreground">{t("Sort order")}</dt>
        <dd>{mt.sortOrder}</dd>
        <dt className="text-muted-foreground">{t("Built-in")}</dt>
        <dd>{mt.builtIn ? t("Yes") : t("No")}</dd>
        {mt.bookmarkCount != null
          ? (
            <>
              <dt className="text-muted-foreground">{t("Bookmarks")}</dt>
              <dd>{mt.bookmarkCount}</dd>
            </>
          )
          : null}
      </dl>
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
          to="/taxonomies/media-types/$mediaTypeSlug/general"
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
