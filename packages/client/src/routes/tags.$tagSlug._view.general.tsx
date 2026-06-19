import { createFileRoute } from "@tanstack/react-router";

import { TabWrapper } from "../components/TabWrapper";
import { useNewAutofillRule } from "../hooks/useNewAutofillRule";
import { useTagBySlug } from "../hooks/useTags";
import { flattenTree } from "../lib/tagTree";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/tags/$tagSlug/_view/general")({
  component: GeneralViewTab,
});

function GeneralViewTab() {
  const {
    tagSlug,
  } = Route.useParams();
  const {
    tag, data, isLoading,
  } = useTagBySlug(tagSlug);
  const newRule = useNewAutofillRule();

  return (
    <TabWrapper
      entity={tag}
      isLoading={isLoading}
      notFoundMessage="Tag not found."
      title="General"
      description="Name, parent, and tag details."
    >
      {(node) => {
        const parent = node.parentId
          ? flattenTree(data ?? []).find(item => item.node.id === node.parentId)?.node
          : null;
        return (
          <>
            <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Parent</dt>
              <dd>{parent ? parent.name : "(root)"}</dd>
              <dt className="text-muted-foreground">Children</dt>
              <dd>{node.children.length}</dd>
              <dt className="text-muted-foreground">Slug</dt>
              <dd className="font-mono">{node.slug}</dd>
              <dt className="text-muted-foreground">Bookmarks</dt>
              <dd>{node.bookmarkCount ?? 0}</dd>
              {node.children.length > 0 && (node.ownBookmarkCount ?? 0) > 0
                ? (
                  <>
                    <dt className="text-muted-foreground/70 italic">No Child</dt>
                    <dd className="text-muted-foreground/70 italic">{node.ownBookmarkCount}</dd>
                  </>
                )
                : null}
              <dt className="text-muted-foreground">Created</dt>
              <dd>{new Date(node.createdAt).toLocaleDateString()}</dd>
            </dl>
            <div className="pt-2">
              <p className="mb-2 text-sm font-medium">Autofill</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={newRule.onClick}
              >
                New Autofill Rule
              </Button>
              {newRule.modal}
            </div>
          </>
        );
      }}
    </TabWrapper>
  );
}
