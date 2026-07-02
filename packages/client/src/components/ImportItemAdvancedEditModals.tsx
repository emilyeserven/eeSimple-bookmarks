import type { ImportItemAdvancedEditState } from "./useImportItemAdvancedEdit";

import { AddAuthorModal } from "./AddAuthorModal";
import { AddTagModal } from "./AddTagModal";

interface ImportItemAdvancedEditModalsProps {
  state: ImportItemAdvancedEditState;
  tagIds: string[];
  authorIds: string[];
  onTagsChange: (ids: string[]) => void;
  onAuthorsChange: (ids: string[]) => void;
}

/**
 * The still-manual "add new X" inline-create modals (Tag / Author) wired into
 * {@link ImportItemAdvancedEdit}, plus the mounted Category/Media Type/Publisher/Location
 * inline-create modals owned by `state`'s `useEntityCreateOption` calls.
 */
export function ImportItemAdvancedEditModals({
  state,
  tagIds,
  authorIds,
  onTagsChange,
  onAuthorsChange,
}: ImportItemAdvancedEditModalsProps) {
  return (
    <>
      <AddTagModal
        open={state.addModalState.addTagOpen}
        onOpenChange={state.addModalState.setAddTagOpen}
        onCreated={tag => onTagsChange([...tagIds, tag.id])}
      />
      <AddAuthorModal
        open={state.addModalState.addAuthorOpen}
        onOpenChange={state.addModalState.setAddAuthorOpen}
        onCreated={author => onAuthorsChange([...authorIds, author.id])}
      />
      {state.categoryCreate.modal}
      {state.mediaTypeCreate.modal}
      {state.publisherCreate.modal}
      {state.locationCreate.modal}
    </>
  );
}
