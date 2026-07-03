import type {
  Album, Artist, Book, Category, CustomProperty, Episode, Group, GroupType, Language, Location,
  MediaProperty, MediaType, Movie, Newsletter, Person, PlaceType, PropertyGroup, Tag, Track, TvShow,
  Website, YouTubeChannel,
} from "@eesimple/types";
import type { ComponentType, ReactNode } from "react";

import { useState } from "react";

import { AddAlbumModal } from "./AddAlbumModal";
import { AddArtistModal } from "./AddArtistModal";
import { AddBookModal } from "./AddBookModal";
import { AddCategoryModal } from "./AddCategoryModal";
import { AddCustomPropertyModal } from "./AddCustomPropertyModal";
import { AddEpisodeModal } from "./AddEpisodeModal";
import { AddGroupModal } from "./AddGroupModal";
import { AddGroupTypeModal } from "./AddGroupTypeModal";
import { AddLanguageModal } from "./AddLanguageModal";
import { AddLocationModal } from "./AddLocationModal";
import { AddMediaPropertyModal } from "./AddMediaPropertyModal";
import { AddMediaTypeModal } from "./AddMediaTypeModal";
import { AddMovieModal } from "./AddMovieModal";
import { AddNewsletterModal } from "./AddNewsletterModal";
import { AddPersonModal } from "./AddPersonModal";
import { AddPlaceTypeModal } from "./AddPlaceTypeModal";
import { AddPropertyGroupModal } from "./AddPropertyGroupModal";
import { AddTagModal } from "./AddTagModal";
import { AddTrackModal } from "./AddTrackModal";
import { AddTvShowModal } from "./AddTvShowModal";
import { AddWebsiteModal } from "./AddWebsiteModal";
import { AddYouTubeChannelModal } from "./AddYouTubeChannelModal";

/** What each creatable entity's Add-modal hands back to the opener. */
interface CreatedByEntity {
  "tag": Tag;
  "person": Person;
  "place-type": PlaceType;
  "category": Category;
  "media-type": MediaType;
  "language": Language;
  "website": Website;
  "youtube-channel": YouTubeChannel;
  "group": Group;
  "group-type": GroupType;
  "newsletter": Newsletter;
  "property-group": PropertyGroup;
  "location": Location;
  "custom-property": CustomProperty;
  "media-property": MediaProperty;
  "book": Book;
  "movie": Movie;
  "tv-show": TvShow;
  "episode": Episode;
  "album": Album;
  "artist": Artist;
  "track": Track;
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
  "person": {
    createLabel: "Create person",
    Modal: AddPersonModal,
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
  "language": {
    createLabel: "Create language",
    Modal: AddLanguageModal,
  },
  "website": {
    createLabel: "Create website",
    Modal: AddWebsiteModal,
  },
  "youtube-channel": {
    createLabel: "Add channel",
    Modal: AddYouTubeChannelModal,
  },
  "group": {
    createLabel: "Create group",
    Modal: AddGroupModal,
  },
  "group-type": {
    createLabel: "Create group type",
    Modal: AddGroupTypeModal,
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
  "episode": {
    createLabel: "Create episode",
    Modal: AddEpisodeModal,
  },
  "album": {
    createLabel: "Create album",
    Modal: AddAlbumModal,
  },
  "artist": {
    createLabel: "Create artist",
    Modal: AddArtistModal,
  },
  "track": {
    createLabel: "Create track",
    Modal: AddTrackModal,
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
