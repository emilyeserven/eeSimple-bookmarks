import type { Author, PlaceType, Tag } from "@eesimple/types";
import type { ComponentType, ReactNode } from "react";

import { useState } from "react";

import { AddAuthorModal } from "./AddAuthorModal";
import { AddPlaceTypeModal } from "./AddPlaceTypeModal";
import { AddTagModal } from "./AddTagModal";

/** What each creatable entity's Add-modal hands back to the opener. */
interface CreatedByEntity {
  "tag": Tag;
  "author": Author;
  "place-type": PlaceType;
}

export type CreatableEntityKind = keyof CreatedByEntity;

interface CreateModalProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (created: T) => void;
}

/**
 * The creatable-entity registry: one entry per entity kind an entity picker can mint inline.
 * Growing it is one line here (the Add-modals all share the open/onOpenChange/onCreated contract) —
 * see the `combobox-new-entity-creation` skill. Issue #A migrates the remaining wired pickers.
 */
const CREATABLE_ENTITY_PICKERS: {
  [K in CreatableEntityKind]: {
    createLabel: string;
    Modal: ComponentType<CreateModalProps<CreatedByEntity[K]>>;
  };
} = {
  "tag": {
    createLabel: "Create tag",
    Modal: AddTagModal,
  },
  "author": {
    createLabel: "Create author",
    Modal: AddAuthorModal,
  },
  "place-type": {
    createLabel: "Create place type",
    Modal: AddPlaceTypeModal,
  },
};

/**
 * The one sanctioned way to give a Combobox/MultiCombobox/TreeMultiCombobox inline entity
 * creation: returns the `createOption` to pass to the picker and the mounted Add-modal element to
 * render beside it, wired to the registry's modal for `entity`. A picker for a user-creatable
 * entity must use this rather than hand-rolling modal state (or omitting create entirely).
 */
export function useEntityCreateOption<K extends CreatableEntityKind>(
  entity: K,
  onCreated: (created: CreatedByEntity[K]) => void,
): {
  createOption: { label: string;
    onSelect: () => void; };
  modal: ReactNode;
} {
  const [open, setOpen] = useState(false);
  const {
    createLabel, Modal,
  } = CREATABLE_ENTITY_PICKERS[entity];
  return {
    createOption: {
      label: createLabel,
      onSelect: () => setOpen(true),
    },
    modal: (
      <Modal
        open={open}
        onOpenChange={setOpen}
        onCreated={onCreated}
      />
    ),
  };
}
