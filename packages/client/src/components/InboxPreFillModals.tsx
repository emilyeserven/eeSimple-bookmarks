import type { InboxPreFillDefaults } from "@eesimple/types";

import { AddAuthorModal } from "./AddAuthorModal";
import { AddCategoryModal } from "./AddCategoryModal";
import { AddMediaTypeModal } from "./AddMediaTypeModal";
import { AddPublisherModal } from "./AddPublisherModal";

/**
 * The four inline "Add new X" creation modals rendered as siblings of the pre-fill box. Each writes
 * its created entity straight into the pre-fill defaults so it's selected immediately.
 */
export function InboxPreFillModals({
  preFill,
  setPreFill,
  addCategoryOpen,
  setAddCategoryOpen,
  addMediaTypeOpen,
  setAddMediaTypeOpen,
  addPublisherOpen,
  setAddPublisherOpen,
  addAuthorOpen,
  setAddAuthorOpen,
}: {
  preFill: InboxPreFillDefaults;
  setPreFill: (preFill: InboxPreFillDefaults) => void;
  addCategoryOpen: boolean;
  setAddCategoryOpen: (open: boolean) => void;
  addMediaTypeOpen: boolean;
  setAddMediaTypeOpen: (open: boolean) => void;
  addPublisherOpen: boolean;
  setAddPublisherOpen: (open: boolean) => void;
  addAuthorOpen: boolean;
  setAddAuthorOpen: (open: boolean) => void;
}) {
  return (
    <>
      <AddCategoryModal
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onCreated={c => setPreFill({
          ...preFill,
          categoryId: c.id,
        })}
      />
      <AddMediaTypeModal
        open={addMediaTypeOpen}
        onOpenChange={setAddMediaTypeOpen}
        onCreated={m => setPreFill({
          ...preFill,
          mediaTypeId: m.id,
        })}
      />
      <AddPublisherModal
        open={addPublisherOpen}
        onOpenChange={setAddPublisherOpen}
        onCreated={p => setPreFill({
          ...preFill,
          publisherId: p.id,
        })}
      />
      <AddAuthorModal
        open={addAuthorOpen}
        onOpenChange={setAddAuthorOpen}
        onCreated={a => setPreFill({
          ...preFill,
          authorIds: [...(preFill.authorIds ?? []), a.id],
        })}
      />
    </>
  );
}
