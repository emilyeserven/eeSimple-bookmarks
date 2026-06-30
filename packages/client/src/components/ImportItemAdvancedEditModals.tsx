import type { ImportItemAdvancedEditAddModalState } from "./useImportItemAdvancedEdit";

import { AddAuthorModal } from "./AddAuthorModal";
import { AddCategoryModal } from "./AddCategoryModal";
import { AddLocationModal } from "./AddLocationModal";
import { AddMediaTypeModal } from "./AddMediaTypeModal";
import { AddPublisherModal } from "./AddPublisherModal";
import { AddTagModal } from "./AddTagModal";

interface ImportItemAdvancedEditModalsProps {
  state: ImportItemAdvancedEditAddModalState;
  tagIds: string[];
  locationIds: string[];
  authorIds: string[];
  onCategoryChange: (id: string | undefined) => void;
  onMediaTypeChange: (id: string | undefined) => void;
  onTagsChange: (ids: string[]) => void;
  onLocationsChange: (ids: string[]) => void;
  onAuthorsChange: (ids: string[]) => void;
  onPublisherChange: (id: string | undefined) => void;
}

/** The six "add new X" inline-create modals wired into {@link ImportItemAdvancedEdit}. */
export function ImportItemAdvancedEditModals({
  state,
  tagIds,
  locationIds,
  authorIds,
  onCategoryChange,
  onMediaTypeChange,
  onTagsChange,
  onLocationsChange,
  onAuthorsChange,
  onPublisherChange,
}: ImportItemAdvancedEditModalsProps) {
  return (
    <>
      <AddTagModal
        open={state.addTagOpen}
        onOpenChange={state.setAddTagOpen}
        onCreated={tag => onTagsChange([...tagIds, tag.id])}
      />
      <AddLocationModal
        open={state.addLocationOpen}
        onOpenChange={state.setAddLocationOpen}
        onCreated={location => onLocationsChange([...locationIds, location.id])}
      />
      <AddCategoryModal
        open={state.addCategoryOpen}
        onOpenChange={state.setAddCategoryOpen}
        onCreated={category => onCategoryChange(category.id)}
      />
      <AddMediaTypeModal
        open={state.addMediaTypeOpen}
        onOpenChange={state.setAddMediaTypeOpen}
        onCreated={mediaType => onMediaTypeChange(mediaType.id)}
      />
      <AddAuthorModal
        open={state.addAuthorOpen}
        onOpenChange={state.setAddAuthorOpen}
        onCreated={author => onAuthorsChange([...authorIds, author.id])}
      />
      <AddPublisherModal
        open={state.addPublisherOpen}
        onOpenChange={state.setAddPublisherOpen}
        onCreated={publisher => onPublisherChange(publisher.id)}
      />
    </>
  );
}
