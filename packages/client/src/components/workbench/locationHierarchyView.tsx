import type { LocationNode } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { HierarchyView } from "../HierarchyView";
import { LocalizedNameLabel } from "../LocalizedNameLabel";
import { LocationTreeList } from "../LocationTreeList";

import { useExpandedSet } from "@/hooks/useExpandedSet";
import { useLocationTree } from "@/hooks/useLocations";
import { findAncestorPath } from "@/lib/tagTree";

export function LocationHierarchyView({
  entity: node,
}: {
  entity: LocationNode;
}) {
  const {
    data,
  } = useLocationTree();
  const {
    expanded, onToggle,
  } = useExpandedSet(node.children.map(c => c.id));
  const path = findAncestorPath(data ?? [], node.slug);
  const ancestors = path ? path.slice(0, -1) : [];
  const {
    t,
  } = useTranslation();
  return (
    <HierarchyView
      ancestors={ancestors}
      renderAncestorLink={ancestor => (
        <Link
          to="/taxonomies/locations/$locationSlug/info"
          params={{
            locationSlug: ancestor.slug,
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
      childrenEmptyLabel={t("No child locations.")}
      childrenList={(
        <LocationTreeList
          tree={node.children}
          expanded={expanded}
          onToggle={onToggle}
          columns={1}
        />
      )}
    />
  );
}
