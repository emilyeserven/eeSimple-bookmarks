import type { Website } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { HierarchyView } from "../HierarchyView";
import { WebsiteTreeList } from "../WebsiteTreeList";

import { useExpandedSet } from "@/hooks/useExpandedSet";
import { useWebsiteTree } from "@/hooks/useWebsites";
import { findAncestorPath } from "@/lib/tagTree";

export function WebsiteHierarchyView({
  entity: website,
}: {
  entity: Website;
}) {
  const {
    data,
  } = useWebsiteTree();
  const path = findAncestorPath(data ?? [], website.slug);
  const node = path?.at(-1);
  const children = node?.children ?? [];
  const ancestors = path ? path.slice(0, -1) : [];
  const {
    expanded, onToggle,
  } = useExpandedSet(children.map(c => c.id));
  const ancestorItems = ancestors.map(a => ({
    id: a.id,
    slug: a.slug,
    name: a.domain,
  }));

  return (
    <HierarchyView
      ancestors={ancestorItems}
      renderAncestorLink={ancestor => (
        <Link
          to="/taxonomies/websites/$websiteSlug/general"
          params={{
            websiteSlug: ancestor.slug,
          }}
          className="hover:underline"
        >
          {ancestor.name}
        </Link>
      )}
      hasChildren={children.length > 0}
      childrenEmptyLabel="No subdomains."
      childrenList={(
        <WebsiteTreeList
          tree={children}
          expanded={expanded}
          onToggle={onToggle}
          columns={1}
        />
      )}
    />
  );
}
