import { usePanelControls } from "./usePanelControls";
import { useCreateTag } from "../../hooks/useTags";
import { TagForm } from "../TagForm";

/**
 * Create a new root tag in the panel, then close it. Existing tags are viewed/edited through the
 * shared `EntityWorkbenchPanel` (the `tagWorkbench`); only the create flow keeps its submit form.
 */
export function TagCreateForm() {
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
