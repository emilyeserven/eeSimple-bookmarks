import type { TaxonomyName } from "./-appHeaderData";

import { useAutofillRuleBySlug } from "@/hooks/useAutofill";
import { useCardDisplayRuleBySlug } from "@/hooks/useCardDisplayRules";
import { usePropertyBySlug } from "@/hooks/useCustomProperties";
import { useGenreMoodBySlug } from "@/hooks/useGenreMoods";
import { useGroupBySlug } from "@/hooks/useGroups";
import { useGroupTypeBySlug } from "@/hooks/useGroupTypes";
import { useImportRuleBySlug } from "@/hooks/useImportRules";
import { useLanguageBySlug } from "@/hooks/useLanguages";
import { useLocationRelationBySlug } from "@/hooks/useLocationRelations";
import { useNewsletterBySlug } from "@/hooks/useNewsletters";
import { usePersonBySlug } from "@/hooks/usePeople";
import { usePlaceTypeBySlug } from "@/hooks/usePlaceTypes";
import { useRelationshipTypeBySlug } from "@/hooks/useRelationshipTypes";
import { useSavedFilterBySlug } from "@/hooks/useSavedFilters";

/** The per-prefix slugs the named-entity hooks resolve. The caller computes these (it already owns
 * `slugFor`), so this module stays free of that dependency. An empty slug short-circuits its hook. */
export interface TaxonomyNameSlugs {
  newsletter: string;
  person: string;
  group: string;
  groupType: string;
  genreMood: string;
  language: string;
  placeType: string;
  locationRelation: string;
  relationshipType: string;
  property: string;
  autofill: string;
  importRule: string;
  savedFilter: string;
  cardDisplayRule: string;
}

/**
 * Resolves the `List → Name` crumb names for the slug-routed entities the header only *names* (it
 * never needs their raw record for a pin / add-child control). The four entities that the pin /
 * add-child controls do consume (category, website, media type, channel) resolve in
 * `useTaxonomyCrumbData` instead. Each by-slug hook short-circuits on an empty slug, so only the
 * entity whose page is active actually looks anything up.
 */
export function useTaxonomyNameMap(
  slugs: TaxonomyNameSlugs,
): Record<string, TaxonomyName | undefined> {
  const {
    newsletter,
  } = useNewsletterBySlug(slugs.newsletter);
  const {
    person,
  } = usePersonBySlug(slugs.person);
  const {
    group,
  } = useGroupBySlug(slugs.group);
  const {
    groupType,
  } = useGroupTypeBySlug(slugs.groupType);
  const {
    genreMood,
  } = useGenreMoodBySlug(slugs.genreMood);
  const {
    language,
  } = useLanguageBySlug(slugs.language);
  const {
    placeType,
  } = usePlaceTypeBySlug(slugs.placeType);
  const {
    locationRelation,
  } = useLocationRelationBySlug(slugs.locationRelation);
  const {
    relationshipType,
  } = useRelationshipTypeBySlug(slugs.relationshipType);
  const {
    property,
  } = usePropertyBySlug(slugs.property);
  const {
    rule,
  } = useAutofillRuleBySlug(slugs.autofill);
  const {
    rule: importRule,
  } = useImportRuleBySlug(slugs.importRule);
  const {
    savedFilter,
  } = useSavedFilterBySlug(slugs.savedFilter);
  const {
    rule: cardDisplayRule,
  } = useCardDisplayRuleBySlug(slugs.cardDisplayRule);

  return {
    "/taxonomies/newsletters": {
      name: newsletter?.name,
    },
    "/taxonomies/people": {
      name: person?.name,
      names: person?.names,
    },
    "/taxonomies/groups": {
      name: group?.name,
      names: group?.names,
    },
    "/taxonomies/group-types": {
      name: groupType?.name,
    },
    "/taxonomies/genres-moods": {
      name: genreMood?.name,
      names: genreMood?.names,
    },
    "/taxonomies/languages": {
      name: language?.name,
    },
    "/taxonomies/place-types": {
      name: placeType?.name,
    },
    "/taxonomies/location-relations": {
      name: locationRelation?.name,
    },
    "/taxonomies/relationship-types": {
      name: relationshipType?.name,
    },
    "/custom-properties": {
      name: property?.name,
    },
    "/autofill": {
      name: rule?.name,
    },
    "/import-rules": {
      name: importRule?.name,
    },
    "/saved-filters": {
      name: savedFilter?.name,
    },
    "/card-display-rules": {
      name: cardDisplayRule?.name,
    },
  };
}
