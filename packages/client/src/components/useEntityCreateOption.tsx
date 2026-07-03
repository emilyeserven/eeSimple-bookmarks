import type {
  Author, Book, Category, CustomProperty, Location, MediaProperty, MediaType, Movie, Newsletter,
  PlaceType, Publisher, PropertyGroup, Tag, TvShow, Website, YouTubeChannel,
} from "@eesimple/types";
import type { ComponentType, ReactNode } from "react";

import { useState } from "react";

import { AddAuthorModal } from "./AddAuthorModal";
import { AddBookModal } from "./AddBookModal";
import { AddCategoryModal } from "./AddCategoryModal";
import { AddCustomPropertyModal } from "./AddCustomPropertyModal";
import { AddLocationModal } from "./AddLocationModal";
import { AddMediaPropertyModal } from "./AddMediaPropertyModal";
import { AddMediaTypeModal } from "./AddMediaTypeModal";
import { AddMovieModal } from "./AddMovieModal";
import { AddNewsletterModal } from "./AddNewsletterModal";
import { AddPlaceTypeModal } from "./AddPlaceTypeModal";
import { AddPropertyGroupModal } from "./AddPropertyGroupModal";
import { AddPublisherModal } from "./AddPublisherModal";
import { AddTagModal } from "./AddTagModal";
import { AddTvShowModal } from "./AddTvShowModal";
import { AddWebsiteModal } from "./AddWebsiteModal";
import { AddYouTubeChannelModal } from "./AddYouTubeChannelModal";

/** What each creatable entity's Add-modal hands back to the opener. */
interface CreatedByEntity {
  "tag": Tag;
  "author": Author;
  "place-type": PlaceType;
  "category": Category;
  "media-type": MediaType;
  "website": Website;
  "youtube-channel": YouTubeChannel;
  "publisher": Publisher;
  "newsletter": Newsletter;
  "property-group": PropertyGroup;
  "location": Location;
  "custom-property": CustomProperty;
  "media-property": MediaProperty;
  "book": Book;
  "movie": Movie;
  "tv-show": TvShow;
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
 * see the `combobox-new-entity-creation` skill.
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
  "category": {
    createLabel: "Create category",
    Modal: AddCategoryModal,
  },
  "media-type": {
    createLabel: "Create media type",
    Modal: AddMediaTypeModal,
  },
  "website": {
    createLabel: "Create website",
    Modal: AddWebsiteModal,
  },
  "youtube-channel": {
    createLabel: "Add channel",
    Modal: AddYouTubeChannelModal,
  },
  "publisher": {
    createLabel: "Create publisher",
    Modal: AddPublisherModal,
  },
  "newsletter": {
    createLabel: "Create import group",
    Modal: AddNewsletterModal,
  },
  "property-group": {
    createLabel: "Create group…",
    Modal: AddPropertyGroupModal,
  },
  "location": {
    createLabel: "Create location",
    Modal: AddLocationModal,
  },
  "custom-property": {
    createLabel: "Create property",
    Modal: AddCustomPropertyModal,
  },
  "media-property": {
    createLabel: "Create media property",
    Modal: AddMediaPropertyModal,
  },
  "book": {
    createLabel: "Create book",
    Modal: AddBookModal,
  },
  "movie": {
    createLabel: "Create movie",
    Modal: AddMovieModal,
  },
  "tv-show": {
    createLabel: "Create TV show",
    Modal: AddTvShowModal,
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
