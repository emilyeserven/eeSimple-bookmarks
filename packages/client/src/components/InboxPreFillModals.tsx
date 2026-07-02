import type { InboxPreFillDefaults } from "@eesimple/types";

import { AddAuthorModal } from "./AddAuthorModal";

/**
 * The still-manual "Add author" creation modal rendered as a sibling of the pre-fill box (Category /
 * Media Type / Publisher own their inline-create via `useEntityCreateOption` in `InboxPreFillBox`
 * itself). Writes the created author straight into the pre-fill defaults so it's selected
 * immediately.
 */
export function InboxPreFillModals({
  preFill,
  setPreFill,
  addAuthorOpen,
  setAddAuthorOpen,
}: {
  preFill: InboxPreFillDefaults;
  setPreFill: (preFill: InboxPreFillDefaults) => void;
  addAuthorOpen: boolean;
  setAddAuthorOpen: (open: boolean) => void;
}) {
  return (
    <AddAuthorModal
      open={addAuthorOpen}
      onOpenChange={setAddAuthorOpen}
      onCreated={a => setPreFill({
        ...preFill,
        authorIds: [...(preFill.authorIds ?? []), a.id],
      })}
    />
  );
}
