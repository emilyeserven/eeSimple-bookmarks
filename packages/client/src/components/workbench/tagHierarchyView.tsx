import type { TagNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { HierarchyView } from "../HierarchyView";
import { RomanizedLabel } from "../RomanizedLabel";
import { TagTreeList } from "../TagTreeList";

import { useSortByRomanized } from "@/hooks/useAppSettings";
import { useExpandedSet } from "@/hooks/useExpandedSet";
import { useTagTree } from "@/hooks/useTags";
import { findAncestorPath, sortTagTreeByRomanized } from "@/lib/tagTree";

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
  const sortByRomanized = useSortByRomanized();
  const children = sortTagTreeByRomanized(node.children, sortByRomanized);
  const path = findAncestorPath(data ?? [], node.slug);
  const ancestors = path ? path.slice(0, -1) : [];
  return (
    <HierarchyView
      ancestors={ancestors}
      renderAncestorLink={ancestor => (
        <Link
          to="/tags/$tagSlug/general"
          params={{
            tagSlug: ancestor.slug,
          }}
          className="hover:underline"
        >
          <RomanizedLabel
            name={ancestor.name}
            romanized={ancestor.romanizedName}
          />
        </Link>
      )}
      hasChildren={node.children.length > 0}
      childrenEmptyLabel="No child tags."
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
