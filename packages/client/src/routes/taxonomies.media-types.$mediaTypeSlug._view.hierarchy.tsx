import { Link, createFileRoute } from "@tanstack/react-router";

import { HierarchyView } from "../components/HierarchyView";
import { MediaTypeTreeList } from "../components/MediaTypeTreeList";
import { TabWrapper } from "../components/TabWrapper";
import { useExpandedSet } from "../hooks/useExpandedSet";
import { useMediaTypeTree } from "../hooks/useMediaTypes";
import { findAncestorPath, flattenTree } from "../lib/tagTree";

export const Route = createFileRoute("/taxonomies/media-types/$mediaTypeSlug/_view/hierarchy")({
  component: HierarchyViewTab,
});

function HierarchyViewTab() {
  const {
    mediaTypeSlug,
  } = Route.useParams();
  const {
    data, isLoading,
  } = useMediaTypeTree();
  const tree = data ?? [];
  const node = flattenTree(tree).find(flat => flat.node.slug === mediaTypeSlug)?.node;
  const {
    expanded, onToggle,
  } = useExpandedSet(node?.children.map(c => c.id) ?? []);

  return (
    <TabWrapper
      entity={node}
      isLoading={isLoading}
      notFoundMessage="Media type not found."
      title="Hierarchy"
      description="Parent and child media types."
    >
      {(current) => {
        const path = findAncestorPath(tree, mediaTypeSlug);
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
            hasChildren={current.children.length > 0}
            childrenEmptyLabel="No child media types."
            childrenList={(
              <MediaTypeTreeList
                tree={current.children}
                expanded={expanded}
                onToggle={onToggle}
                columns={1}
              />
            )}
          />
        );
      }}
    </TabWrapper>
  );
}
