import type { TaxonomyName } from "./-appHeaderData";

import { useAuthorBySlug } from "@/hooks/useAuthors";
import { useAutofillRuleBySlug } from "@/hooks/useAutofill";
import { useBookBySlug } from "@/hooks/useBooks";
import { useCardDisplayRuleBySlug } from "@/hooks/useCardDisplayRules";
import { usePropertyBySlug } from "@/hooks/useCustomProperties";
import { useImportRuleBySlug } from "@/hooks/useImportRules";
import { useMediaPropertyBySlug } from "@/hooks/useMediaProperties";
import { useNewsletterBySlug } from "@/hooks/useNewsletters";
import { usePlaceTypeBySlug } from "@/hooks/usePlaceTypes";
import { usePropertyGroupBySlug } from "@/hooks/usePropertyGroups";
import { usePublisherBySlug } from "@/hooks/usePublishers";
import { useRelationshipTypeBySlug } from "@/hooks/useRelationshipTypes";
import { useSavedFilterBySlug } from "@/hooks/useSavedFilters";

/** The per-prefix slugs the named-entity hooks resolve. The caller computes these (it already owns
 * `slugFor`), so this module stays free of that dependency. An empty slug short-circuits its hook. */
export interface TaxonomyNameSlugs {
  newsletter: string;
  author: string;
  publisher: string;
  placeType: string;
  propertyGroup: string;
  mediaProperty: string;
  book: string;
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
    author,
  } = useAuthorBySlug(slugs.author);
  const {
    publisher,
  } = usePublisherBySlug(slugs.publisher);
  const {
    placeType,
  } = usePlaceTypeBySlug(slugs.placeType);
  const {
    propertyGroup,
  } = usePropertyGroupBySlug(slugs.propertyGroup);
  const {
    mediaProperty,
  } = useMediaPropertyBySlug(slugs.mediaProperty);
  const {
    book,
  } = useBookBySlug(slugs.book);
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
    "/taxonomies/authors": {
      name: author?.name,
      romanized: author?.romanizedName,
    },
    "/taxonomies/publishers": {
      name: publisher?.name,
      romanized: publisher?.romanizedName,
    },
    "/taxonomies/place-types": {
      name: placeType?.name,
    },
    "/taxonomies/property-groups": {
      name: propertyGroup?.name,
    },
    "/taxonomies/media-properties": {
      name: mediaProperty?.name,
    },
    "/taxonomies/books": {
      name: book?.name,
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
