import type { DrawerMode } from "@/lib/drawerSearch";

import { TagEditor } from "./TagEditor";
import { usePanelControls } from "./usePanelControls";
import { useCreateTag, useTagTree } from "../../hooks/useTags";
import { flattenTree } from "../../lib/tagTree";
import { TagForm } from "../TagForm";

import { NEW_SENTINEL } from "@/lib/drawerSearch";

interface TagPanelProps {
  /** The tag id to view/edit, or `NEW_SENTINEL` to create a new root tag. */
  tagId: string;
  /** Mode the editor opens in (from the panel's `dMode`); defaults to read-only `view`. */
  initialMode?: DrawerMode;
}

/** Tag create/view/edit body for the shared panel (was `TagDrawer` / `TagCreateDrawer`). */
export function TagPanel({
  tagId, initialMode = "view",
}: TagPanelProps) {
  const {
    data: tree, isLoading, error,
  } = useTagTree();

  if (tagId === NEW_SENTINEL) return <TagCreateForm />;

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (error) return <p className="text-destructive">{error.message}</p>;

  const allTags = tree ?? [];
  const node = flattenTree(allTags).find(item => item.node.id === tagId)?.node;
  if (!node) return <p className="text-destructive">Tag not found.</p>;

  return (
    <TagEditor
      node={node}
      allTags={allTags}
      initialMode={initialMode}
    />
  );
}

/** Create a new root tag, then close the panel. */
function TagCreateForm() {
  const {
    close,
  } = usePanelControls();
  const createTag = useCreateTag();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">New tag</h2>
      <TagForm
        allTags={[]}
        showParent={false}
        submitLabel="Add tag"
        pendingLabel="Adding…"
        isError={createTag.isError}
        errorMessage={createTag.error?.message}
        onSubmit={({
          name,
        }) => createTag.mutate(
          {
            name,
            parentId: null,
          },
          {
            onSuccess: close,
          },
        )}
      />
    </div>
  );
}
