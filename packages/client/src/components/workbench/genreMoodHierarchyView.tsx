import type { GenreMoodNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { GenreMoodTreeList } from "../GenreMoodTreeList";
import { HierarchyView } from "../HierarchyView";
import { LocalizedNameLabel } from "../LocalizedNameLabel";

import { useExpandedSet } from "@/hooks/useExpandedSet";
import { useGenreMoodTree } from "@/hooks/useGenreMoods";
import { findAncestorPath, flattenTree } from "@/lib/tagTree";

export function GenreMoodHierarchyView({
  entity: gm,
}: {
  entity: GenreMoodNode;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data, isLoading,
  } = useGenreMoodTree();
  const tree = data ?? [];
  const node = flattenTree(tree).find(flat => flat.node.slug === gm.slug)?.node;
  const {
    expanded, onToggle,
  } = useExpandedSet(node?.children.map(c => c.id) ?? []);

  if (isLoading && !node) return <p className="text-muted-foreground">{t("Loading…")}</p>;
  if (!node) return <p className="text-destructive">{t("Entry not found.")}</p>;

  const path = findAncestorPath(tree, gm.slug);
  const ancestors = path ? path.slice(0, -1) : [];

  return (
    <HierarchyView
      ancestors={ancestors}
      renderAncestorLink={ancestor => (
        <Link
          to="/taxonomies/genres-moods/$genreMoodSlug/general"
          params={{
            genreMoodSlug: ancestor.slug,
          }}
          className="hover:underline"
        >
          <LocalizedNameLabel
            names={ancestor.names ?? []}
            base={ancestor.name}
          />
        </Link>
      )}
      hasChildren={node.children.length > 0}
      childrenEmptyLabel={t("No child entries.")}
      childrenList={(
        <GenreMoodTreeList
          tree={node.children}
          expanded={expanded}
          onToggle={onToggle}
          columns={1}
        />
      )}
    />
  );
}
