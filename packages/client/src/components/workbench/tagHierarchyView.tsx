import type { TagNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import i18n from "../../i18n";
import { HierarchyView } from "../HierarchyView";
import { LocalizedNameLabel } from "../LocalizedNameLabel";
import { TagTreeList } from "../TagTreeList";

import { useExpandedSet } from "@/hooks/useExpandedSet";
import { useTagTree } from "@/hooks/useTags";
import { useInterfaceTitleSort } from "@/hooks/useTitleSortContext";
import { findAncestorPath, sortTagTree } from "@/lib/tagTree";

export function TagHierarchyView({
  entity: node,
}: {
  entity: TagNode;
}) {
  const {
    data,
  } = useTagTree();
  const {
    expanded, onToggle,
  } = useExpandedSet(node.children.map(c => c.id));
  // TagTreeList no longer sorts internally (the listing scaffold owns that); sort here instead.
  const titleSort = useInterfaceTitleSort();
  const children = sortTagTree(node.children, titleSort);
  const path = findAncestorPath(data ?? [], node.slug);
  const ancestors = path ? path.slice(0, -1) : [];
  return (
    <HierarchyView
      ancestors={ancestors}
      renderAncestorLink={ancestor => (
        <Link
          to="/tags/$tagSlug/info"
          params={{
            tagSlug: ancestor.slug,
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
      childrenEmptyLabel={i18n.t("No child tags.")}
      childrenList={(
        <TagTreeList
          tree={children}
          expanded={expanded}
          onToggle={onToggle}
          columns={1}
        />
      )}
    />
  );
}
