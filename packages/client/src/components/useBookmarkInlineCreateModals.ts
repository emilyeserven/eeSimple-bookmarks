import { useState } from "react";

/**
 * The five inline "Create X" modal open-flags used by the bookmark edit (General) form — each opened
 * from its combobox (Media Type / Tag / Author / Category / Publisher). Grouped into one hook so the
 * form controller stays under the cognitive cap (fallow counts one point per hook call); see
 * CLAUDE.md → "spread the hooks, not just the handlers".
 */
export function useBookmarkInlineCreateModals() {
  const [addMediaTypeOpen, setAddMediaTypeOpen] = useState(false);
  const [addTagOpen, setAddTagOpen] = useState(false);
  const [addAuthorOpen, setAddAuthorOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addPublisherOpen, setAddPublisherOpen] = useState(false);
  return {
    addMediaTypeOpen,
    setAddMediaTypeOpen,
    addTagOpen,
    setAddTagOpen,
    addAuthorOpen,
    setAddAuthorOpen,
    addCategoryOpen,
    setAddCategoryOpen,
    addPublisherOpen,
    setAddPublisherOpen,
  };
}
