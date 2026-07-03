import type { InboxItem } from "@eesimple/types";

import { useMemo, useState } from "react";

import { normalizeDomain } from "@eesimple/types";

import { useEntityCreateOption } from "./useEntityCreateOption";
import { useCategories } from "../hooks/useCategories";
import { useGroups } from "../hooks/useGroups";
import { useLocationTree } from "../hooks/useLocations";
import { useMediaTypeTree } from "../hooks/useMediaTypes";
import { usePeople } from "../hooks/usePeople";
import { useTagTree } from "../hooks/useTags";
import { useWebsites } from "../hooks/useWebsites";

interface UseImportItemAdvancedEditParams {
  item: InboxItem;
  tagIds: string[];
  locationIds: string[];
  onTagsChange: (ids: string[]) => void;
  onLocationsChange: (ids: string[]) => void;
  onCategoryChange: (id: string | undefined) => void;
  onMediaTypeChange: (id: string | undefined) => void;
  onGroupChange: (id: string | undefined) => void;
}

/**
 * State + data orchestration for {@link ImportItemAdvancedEdit}: the still-manual "add new X" modal
 * flags (Tag / Person), the Category/Media Type/Group/Location inline-create (via
 * `useEntityCreateOption`), the taxonomy queries, the URL → website/YouTube derivation, and the
 * tag/location toggle handlers. Extracted to keep the component's import surface and hook density low.
 */
export function useImportItemAdvancedEdit({
  item,
  tagIds,
  locationIds,
  onTagsChange,
  onLocationsChange,
  onCategoryChange,
  onMediaTypeChange,
  onGroupChange,
}: UseImportItemAdvancedEditParams) {
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const [addTagOpen, setAddTagOpen] = useState(false);
  const categoryCreate = useEntityCreateOption("category", category => onCategoryChange(category.id));
  const mediaTypeCreate = useEntityCreateOption("media-type", mediaType => onMediaTypeChange(mediaType.id));
  const groupCreate = useEntityCreateOption("group", group => onGroupChange(group.id));
  const locationCreate = useEntityCreateOption("location", location => onLocationsChange([...locationIds, location.id]));

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
    data: people = [],
  } = usePeople();
  const {
    data: groups = [],
  } = useGroups();
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
    people,
    groups,
    matchedWebsite,
    isYouTube,
    handleTagToggle,
    handleLocationToggle,
    categoryCreate,
    mediaTypeCreate,
    groupCreate,
    locationCreate,
    addModalState: {
      addPersonOpen,
      setAddPersonOpen,
      addTagOpen,
      setAddTagOpen,
    },
  };
}

export type ImportItemAdvancedEditState = ReturnType<typeof useImportItemAdvancedEdit>;
export type ImportItemAdvancedEditAddModalState = ImportItemAdvancedEditState["addModalState"];
