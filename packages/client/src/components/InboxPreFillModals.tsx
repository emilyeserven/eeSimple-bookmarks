import type { InboxPreFillDefaults } from "@eesimple/types";

import { AddPersonModal } from "./AddPersonModal";

/**
 * The still-manual "Add person" creation modal rendered as a sibling of the pre-fill box (Category /
 * Media Type / Group own their inline-create via `useEntityCreateOption` in `InboxPreFillBox`
 * itself). Writes the created person straight into the pre-fill defaults so it's selected
 * immediately.
 */
export function InboxPreFillModals({
  preFill,
  setPreFill,
  addPersonOpen,
  setAddPersonOpen,
}: {
  preFill: InboxPreFillDefaults;
  setPreFill: (preFill: InboxPreFillDefaults) => void;
  addPersonOpen: boolean;
  setAddPersonOpen: (open: boolean) => void;
}) {
  return (
    <AddPersonModal
      open={addPersonOpen}
      onOpenChange={setAddPersonOpen}
      onCreated={a => setPreFill({
        ...preFill,
        personIds: [...(preFill.personIds ?? []), a.id],
      })}
    />
  );
}
