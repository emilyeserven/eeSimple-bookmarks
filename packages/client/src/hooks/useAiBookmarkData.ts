import type {
  Bookmark,
  Category,
  CustomProperty,
  GenreMoodNode,
  Group,
  Language,
  MediaType,
  MediaTypeNode,
  Person,
  SavedFilter,
  Tag,
  TagNode,
  Website,
  YouTubeChannel,
} from "@eesimple/types";

import { useBookmarks } from "./useBookmarks";
import { useCategories } from "./useCategories";
import { useCustomProperties } from "./useCustomProperties";
import { useGenreMoodTree } from "./useGenreMoods";
import { useGroups } from "./useGroups";
import { useLanguages } from "./useLanguages";
import { useMediaTypes, useMediaTypeTree } from "./useMediaTypes";
import { usePeople } from "./usePeople";
import { useSavedFilters } from "./useSavedFilters";
import { useTags, useTagTree } from "./useTags";
import { useWebsites } from "./useWebsites";
import { useYouTubeChannels } from "./useYouTubeChannels";

/**
 * Everything an AI bookmark-targeting page (AI Bulk Edit, AI Prompt Builder) reads: full entity
 * lists, the subtree-expansion trees, the saved filters usable as targets, and custom properties.
 */
export interface AiBookmarkData {
  bookmarks: Bookmark[];
  properties: CustomProperty[];
  categories: Category[];
  tags: Tag[];
  mediaTypes: MediaType[];
  people: Person[];
  groups: Group[];
  languages: Language[];
  websites: Website[];
  youtubeChannels: YouTubeChannel[];
  savedFilters: SavedFilter[];
  /** Concrete node types (assignable to `AiBookmarkTargetTrees`) so the pickers keep their real shapes. */
  trees: {
    tagTree?: TagNode[];
    mediaTypeTree?: MediaTypeNode[];
    genreMoodTree?: GenreMoodNode[];
  };
}

/** The flat taxonomy/vocabulary lists shared by the pickers, the prompt, and the per-bookmark review. */
function useAiBookmarkLists(): Pick<AiBookmarkData, "categories" | "tags" | "mediaTypes" | "people" | "groups" | "languages" | "savedFilters"> {
  const {
    data: categories,
  } = useCategories();
  const {
    data: tags,
  } = useTags();
  const {
    data: mediaTypes,
  } = useMediaTypes();
  const {
    data: people,
  } = usePeople();
  const {
    data: groups,
  } = useGroups();
  const {
    data: languages,
  } = useLanguages();
  const {
    data: savedFilters,
  } = useSavedFilters();
  return {
    categories: categories ?? [],
    tags: tags ?? [],
    mediaTypes: mediaTypes ?? [],
    people: people ?? [],
    groups: groups ?? [],
    languages: languages ?? [],
    savedFilters: savedFilters ?? [],
  };
}

/**
 * Bundles an AI bookmark-targeting page's queries (the fallow hook-density split): the full hydrated
 * bookmark list (the established in-memory picker/matching backing), the flat lists, and the three
 * trees used for subtree expansion. Loading states resolve to empty lists — the page degrades to
 * empty pickers until the queries land.
 */
export function useAiBookmarkData(): AiBookmarkData {
  const lists = useAiBookmarkLists();
  const {
    data: bookmarks,
  } = useBookmarks();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: websites,
  } = useWebsites();
  const {
    data: youtubeChannels,
  } = useYouTubeChannels();
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: mediaTypeTree,
  } = useMediaTypeTree();
  const {
    data: genreMoodTree,
  } = useGenreMoodTree();
  return {
    ...lists,
    bookmarks: bookmarks ?? [],
    properties: properties ?? [],
    websites: websites ?? [],
    youtubeChannels: youtubeChannels ?? [],
    trees: {
      tagTree,
      mediaTypeTree,
      genreMoodTree,
    },
  };
}
