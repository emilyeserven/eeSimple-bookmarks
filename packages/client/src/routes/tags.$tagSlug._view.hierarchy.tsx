import { Link, createFileRoute } from "@tanstack/react-router";

import { HierarchyView } from "../components/HierarchyView";
import { TabWrapper } from "../components/TabWrapper";
import { TagTreeList } from "../components/TagTreeList";
import { useExpandedSet } from "../hooks/useExpandedSet";
import { useTagBySlug } from "../hooks/useTags";
import { findAncestorPath } from "../lib/tagTree";

export const Route = createFileRoute("/tags/$tagSlug/_view/hierarchy")({
  component: HierarchyViewTab,
});

function HierarchyViewTab() {
  const {
    tagSlug,
  } = Route.useParams();
  const {
    tag, data, isLoading,
  } = useTagBySlug(tagSlug);
  const {
    expanded, onToggle,
  } = useExpandedSet(tag?.children.map(c => c.id) ?? []);

  return (
    <TabWrapper
      entity={tag}
      isLoading={isLoading}
      notFoundMessage="Tag not found."
      title="Hierarchy"
      description="Parent and child tags."
    >
      {(node) => {
        const path = findAncestorPath(data ?? [], tagSlug);
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
                {ancestor.name}
              </Link>
            )}
            hasChildren={node.children.length > 0}
            childrenEmptyLabel="No child tags."
            childrenList={(
              <TagTreeList
                tree={node.children}
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
