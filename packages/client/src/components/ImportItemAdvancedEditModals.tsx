import type { ImportItemAdvancedEditState } from "./useImportItemAdvancedEdit";

import { AddPersonModal } from "./AddPersonModal";
import { AddTagModal } from "./AddTagModal";

interface ImportItemAdvancedEditModalsProps {
  state: ImportItemAdvancedEditState;
  tagIds: string[];
  personIds: string[];
  onTagsChange: (ids: string[]) => void;
  onPeopleChange: (ids: string[]) => void;
}

/**
 * The still-manual "add new X" inline-create modals (Tag / Person) wired into
 * {@link ImportItemAdvancedEdit}, plus the mounted Category/Media Type/Publisher/Location
 * inline-create modals owned by `state`'s `useEntityCreateOption` calls.
 */
export function ImportItemAdvancedEditModals({
  state,
  tagIds,
  personIds,
  onTagsChange,
  onPeopleChange,
}: ImportItemAdvancedEditModalsProps) {
  return (
    <>
      <AddTagModal
        open={state.addModalState.addTagOpen}
        onOpenChange={state.addModalState.setAddTagOpen}
        onCreated={tag => onTagsChange([...tagIds, tag.id])}
      />
      <AddPersonModal
        open={state.addModalState.addPersonOpen}
        onOpenChange={state.addModalState.setAddPersonOpen}
        onCreated={person => onPeopleChange([...personIds, person.id])}
      />
      {state.categoryCreate.modal}
      {state.mediaTypeCreate.modal}
      {state.publisherCreate.modal}
      {state.locationCreate.modal}
    </>
  );
}
