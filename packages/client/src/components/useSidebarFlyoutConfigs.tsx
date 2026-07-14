import type { FlyoutLink } from "./StarredFlyoutSidebarItem";
import type { SidebarEntityData } from "./useSidebarEntityData";
import type { ImportRule, Language, RelationshipType, Taxonomy, TaxonomyTerm } from "@eesimple/types";
import type { TFunction } from "i18next";
import type { ReactNode } from "react";

import { GENRES_MOODS_TAXONOMY_SLUG } from "@eesimple/types";
import {
  Building2,
  Captions,
  Drama,
  FileInput,
  Globe,
  Languages,
  ListFilter,
  Mail,
  MapPin,
  MapPinned,
  MonitorPlay,
  ScrollText,
  Shapes,
  Share2,
  SlidersHorizontal,
  Tags,
  UserRound,
  Wand2,
  Waypoints,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { useImportRules } from "../hooks/useImportRules";
import { useLanguages } from "../hooks/useLanguages";
import { useRelationshipTypes } from "../hooks/useRelationshipTypes";
import { useFavoriteTaxonomyTerms, useTaxonomies } from "../hooks/useTaxonomies";

import { CategoryIcon } from "@/lib/icons";

const SUB_ICON = "size-3.5 shrink-0 text-muted-foreground";

/** A starred member of an entity, resolved to its detail path (`${rootTo}/${slug}`) by the renderer. */
interface FlyoutStarredEntry {
  id: string;
  name: string;
  slug: string;
  icon: ReactNode;
  count?: number;
}

/** The variable half of a sidebar item's flyout — its fixed shortcut links and/or starred members. */
interface EntityFlyoutData {
  starredTitle: string;
  shortcuts?: FlyoutLink[];
  starred?: FlyoutStarredEntry[];
}

/** Keyed by the same `item.key` `ExpandableLinkSection.renderItem` switches on. */
export type SidebarFlyoutData = Record<string, EntityFlyoutData>;

/** Filter a list to its starred members and map to flyout entries. */
function starred<T extends { id: string;
  slug?: string | null;
  isFavorite?: boolean; }>(
  list: T[] | undefined,
  name: (item: T) => string,
  icon: (item: T) => ReactNode,
  count?: (item: T) => number | undefined,
): FlyoutStarredEntry[] {
  return (list ?? []).filter(item => item.isFavorite).map(item => ({
    id: item.id,
    name: name(item),
    slug: item.slug ?? "",
    icon: icon(item),
    count: count?.(item),
  }));
}

/** Starred terms of one taxonomy (Genres & Moods or a custom taxonomy), as flyout entries. */
function starredTerms(terms: TaxonomyTerm[], taxonomyId: string | undefined, icon: ReactNode): FlyoutStarredEntry[] {
  if (!taxonomyId) return [];
  return terms
    .filter(term => term.taxonomyId === taxonomyId && term.isFavorite)
    .map(term => ({
      id: term.id,
      name: term.name,
      slug: term.slug ?? "",
      icon,
      count: undefined,
    }));
}

export interface FlyoutInputs {
  t: TFunction;
  data: SidebarEntityData;
  languages: Language[];
  relationshipTypes: RelationshipType[];
  importRules: ImportRule[];
  favoriteTerms: TaxonomyTerm[];
  taxonomies: Taxonomy[];
}

/** Pure construction of every sidebar item's flyout data from the loaded lists. */
export function buildSidebarFlyoutData(inputs: FlyoutInputs): SidebarFlyoutData {
  const {
    t, data, languages, relationshipTypes, importRules, favoriteTerms, taxonomies,
  } = inputs;
  const link = (id: string, label: string, icon: ReactNode, to: string, count?: number): FlyoutLink => ({
    id,
    label,
    icon,
    to,
    count,
  });
  const gmId = taxonomies.find(taxonomy => taxonomy.slug === GENRES_MOODS_TAXONOMY_SLUG)?.id;

  const configs: SidebarFlyoutData = {
    "categories": {
      starredTitle: t("Starred Categories"),
      starred: starred(data.categories, c => c.name, c => (
        <CategoryIcon
          name={c.icon}
          className={SUB_ICON}
        />
      ), c => c.bookmarkCount),
    },
    "tags": {
      starredTitle: t("Starred Tags"),
      starred: starred(data.allTags, tag => tag.name, () => <Tags className={SUB_ICON} />, tag => tag.bookmarkCount),
    },
    "websites": {
      starredTitle: t("Starred Websites"),
      starred: starred(data.allWebsites, w => w.siteName, () => <Globe className={SUB_ICON} />, w => w.bookmarkCount),
    },
    "media-types": {
      starredTitle: t("Starred Media Types"),
      starred: starred(data.allMediaTypes, m => m.name, m => (
        <CategoryIcon
          name={m.icon}
          className={SUB_ICON}
        />
      ), m => m.bookmarkCount),
    },
    "genres-moods": {
      starredTitle: t("Starred Genres & Moods"),
      starred: starredTerms(favoriteTerms, gmId, <Drama className={SUB_ICON} />),
    },
    "languages": {
      starredTitle: t("Starred Languages"),
      shortcuts: [
        link("usage-levels", t("Usage Levels"), <Captions className={SUB_ICON} />, "/taxonomies/language-usage-levels"),
        link("translation-sources", t("Translation Sources"), <ScrollText className={SUB_ICON} />, "/taxonomies/translation-sources"),
      ],
      starred: starred(languages, l => l.name, () => <Languages className={SUB_ICON} />, l => l.bookmarkCount),
    },
    "locations": {
      starredTitle: t("Starred Locations"),
      shortcuts: [
        link("place-types", t("Place Types"), <MapPinned className={SUB_ICON} />, "/taxonomies/place-types", data.allPlaceTypes?.length),
        link("location-relations", t("Location Relations"), <Waypoints className={SUB_ICON} />, "/taxonomies/location-relations", data.allLocationRelations?.length),
      ],
      starred: starred(data.allLocations, loc => loc.name, () => <MapPin className={SUB_ICON} />, loc => loc.bookmarkCount),
    },
    "youtube-channels": {
      starredTitle: t("Starred YouTube Channels"),
      starred: starred(data.allChannels, c => c.name, () => <MonitorPlay className={SUB_ICON} />, c => c.bookmarkCount),
    },
    "newsletters": {
      starredTitle: t("Starred Imports"),
      starred: starred(data.allNewsletters, n => n.name, () => <Mail className={SUB_ICON} />, n => n.bookmarkCount),
    },
    "people": {
      starredTitle: t("Starred People"),
      starred: starred(data.allPeople, p => p.name, () => <UserRound className={SUB_ICON} />, p => p.bookmarkCount),
    },
    "groups": {
      starredTitle: t("Starred Groups"),
      shortcuts: [
        link("group-types", t("Group Types"), <Shapes className={SUB_ICON} />, "/taxonomies/group-types", data.allGroupTypes?.length),
      ],
      starred: starred(data.allGroups, g => g.name, () => <Building2 className={SUB_ICON} />, g => g.bookmarkCount),
    },
    "custom-properties": {
      starredTitle: t("Starred Custom Properties"),
      starred: starred(data.allCustomProperties, p => p.name, () => <SlidersHorizontal className={SUB_ICON} />),
    },
    "relationship-types": {
      starredTitle: t("Starred Relationship Types"),
      starred: starred(relationshipTypes, r => r.name, () => <Share2 className={SUB_ICON} />),
    },
    "autofill": {
      starredTitle: t("Starred Autofill Rules"),
      starred: starred(data.allAutofillRules, a => a.name, () => <Wand2 className={SUB_ICON} />),
    },
    "import-rules": {
      starredTitle: t("Starred Import Rules"),
      starred: starred(importRules, r => r.name, () => <FileInput className={SUB_ICON} />),
    },
    "saved-filters": {
      starredTitle: t("Starred Saved Filters"),
      starred: starred(data.savedFilters, f => f.name, () => <ListFilter className={SUB_ICON} />),
    },
  };

  // Custom (user-defined) taxonomies: starred terms per taxonomy, keyed by the sidebar `taxonomy:${id}`.
  for (const taxonomy of taxonomies) {
    if (taxonomy.slug === GENRES_MOODS_TAXONOMY_SLUG) continue;
    configs[`taxonomy:${taxonomy.id}`] = {
      starredTitle: t("Starred {{name}}", {
        name: taxonomy.name,
      }),
      starred: starredTerms(
        favoriteTerms,
        taxonomy.id, (
          <CategoryIcon
            name={taxonomy.icon}
            className={SUB_ICON}
          />
        ),
      ),
    };
  }

  return configs;
}

/**
 * Build every sidebar item's flyout data (fixed shortcut links + starred members) from the loaded
 * entity lists. Extra lists not already in the sidebar data (languages, relationship types, import
 * rules, favorited taxonomy terms, taxonomies) are loaded here; everything else comes from `data`.
 */
export function useSidebarFlyoutConfigs(data: SidebarEntityData): SidebarFlyoutData {
  const {
    t,
  } = useTranslation();
  const {
    data: languages = [],
  } = useLanguages();
  const {
    data: relationshipTypes = [],
  } = useRelationshipTypes();
  const {
    data: importRules = [],
  } = useImportRules();
  const {
    data: favoriteTerms = [],
  } = useFavoriteTaxonomyTerms();
  const {
    data: taxonomies = [],
  } = useTaxonomies();
  return buildSidebarFlyoutData({
    t,
    data,
    languages,
    relationshipTypes,
    importRules,
    favoriteTerms,
    taxonomies,
  });
}
