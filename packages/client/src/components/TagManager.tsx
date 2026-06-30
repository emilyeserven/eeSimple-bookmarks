import { TaxonomyBulkBar } from "./bulk/TaxonomyBulkBar";
import { TagListBody } from "./TagListBody";
import { useRegisterBulkSelect } from "../hooks/useRegisterBulkSelect";
import { useBulkDeleteTags, useTagTree } from "../hooks/useTags";
import { flattenTree } from "../lib/tagTree";
import { useListSelection } from "../lib/useListSelection";

interface TagManagerProps {
  onNew?: () => void;
}

/** Read-only tag taxonomy with a collapsible tree; editing happens inside per-tag drawers. */
export function TagManager({
  onNew,
}: TagManagerProps) {
  const {
    data: tree, isLoading, error,
  } = useTagTree();

  const deletableIds = flattenTree(tree ?? []).map(({
    node,
  }) => node.id);
  const selection = useListSelection("tags-listing", deletableIds);
  useRegisterBulkSelect("tags-listing");
  const bulkDelete = useBulkDeleteTags();

  return (
    <section className="space-y-4">
      {isLoading ? <p className="text-muted-foreground">Loading tags&#8230;</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {!isLoading && tree && tree.length === 0
        ? (
          <p className="text-muted-foreground">
            {"No tags yet. "}
            <button
              type="button"
              className="
                underline
                hover:no-underline
              "
              onClick={onNew}
            >
              Add your first tag.
            </button>
          </p>
        )
        : null}

      <TaxonomyBulkBar
        selection={selection}
        totalSelectable={deletableIds.length}
        bulkDelete={bulkDelete}
        noun={["tag", "tags"]}
      />

      {tree && tree.length > 0
        ? (
          <TagListBody
            tree={tree}
            selection={selection}
          />
        )
        : null}

    </section>
  );
}
