import type { InboxItem } from "@eesimple/types";

import { useMemo, useState } from "react";

import { normalizeDomain } from "@eesimple/types";

import { useAuthors } from "../hooks/useAuthors";
import { useCategories } from "../hooks/useCategories";
import { useLocationTree } from "../hooks/useLocations";
import { useMediaTypeTree } from "../hooks/useMediaTypes";
import { usePublishers } from "../hooks/usePublishers";
import { useTagTree } from "../hooks/useTags";
import { useWebsites } from "../hooks/useWebsites";

interface UseImportItemAdvancedEditParams {
  item: InboxItem;
  tagIds: string[];
  locationIds: string[];
  onTagsChange: (ids: string[]) => void;
  onLocationsChange: (ids: string[]) => void;
}

/**
 * State + data orchestration for {@link ImportItemAdvancedEdit}: the six "add new X" modal flags,
 * the taxonomy queries, the URL → website/YouTube derivation, and the tag/location toggle handlers.
 * Extracted to keep the component's import surface and hook density low.
 */
export function useImportItemAdvancedEdit({
  item,
  tagIds,
  locationIds,
  onTagsChange,
  onLocationsChange,
}: UseImportItemAdvancedEditParams) {
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addMediaTypeOpen, setAddMediaTypeOpen] = useState(false);
  const [addPublisherOpen, setAddPublisherOpen] = useState(false);
  const [addAuthorOpen, setAddAuthorOpen] = useState(false);
  const [addTagOpen, setAddTagOpen] = useState(false);
  const [addLocationOpen, setAddLocationOpen] = useState(false);

  const {
    data: categories = [],
  } = useCategories();
  const {
    data: mediaTypeTree = [],
  } = useMediaTypeTree();
  const {
    data: tagTree = [],
  } = useTagTree();
  const {
    data: locationTree = [],
  } = useLocationTree();
  const {
    data: authors = [],
  } = useAuthors();
  const {
    data: publishers = [],
  } = usePublishers();
  const {
    data: websites = [],
  } = useWebsites();

  const urlDomain = useMemo(() => {
    try {
      return normalizeDomain(new URL(item.url ?? "").hostname);
    }
    catch {
      return null;
    }
  }, [item.url]);

  const matchedWebsite = urlDomain ? websites.find(w => w.domain === urlDomain) : null;
  const isYouTube = urlDomain === "youtube.com" || urlDomain === "youtu.be";

  function handleTagToggle(id: string) {
    const next = tagIds.includes(id)
      ? tagIds.filter(t => t !== id)
      : [...tagIds, id];
    onTagsChange(next);
  }

  function handleLocationToggle(id: string) {
    const next = locationIds.includes(id)
      ? locationIds.filter(l => l !== id)
      : [...locationIds, id];
    onLocationsChange(next);
  }

  return {
    categories,
    mediaTypeTree,
    tagTree,
    locationTree,
    authors,
    publishers,
    matchedWebsite,
    isYouTube,
    handleTagToggle,
    handleLocationToggle,
    addModalState: {
      addCategoryOpen,
      setAddCategoryOpen,
      addMediaTypeOpen,
      setAddMediaTypeOpen,
      addPublisherOpen,
      setAddPublisherOpen,
      addAuthorOpen,
      setAddAuthorOpen,
      addTagOpen,
      setAddTagOpen,
      addLocationOpen,
      setAddLocationOpen,
    },
  };
}

export type ImportItemAdvancedEditState = ReturnType<typeof useImportItemAdvancedEdit>;
export type ImportItemAdvancedEditAddModalState = ImportItemAdvancedEditState["addModalState"];
