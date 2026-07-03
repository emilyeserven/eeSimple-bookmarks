import { useState } from "react";

/**
 * The inline "Create X" modal open-flags used by the bookmark edit (General) form's still-manual
 * pickers (Tag / Person). Grouped into one hook so the form controller stays under the cognitive cap
 * (fallow counts one point per hook call); see CLAUDE.md → "spread the hooks, not just the handlers".
 * Category / Media Type / Publisher / Location now own their inline-create state via
 * `useEntityCreateOption`, called directly in the field components.
 */
export function useBookmarkInlineCreateModals() {
  const [addTagOpen, setAddTagOpen] = useState(false);
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  return {
    addTagOpen,
    setAddTagOpen,
    addPersonOpen,
    setAddPersonOpen,
  };
}
