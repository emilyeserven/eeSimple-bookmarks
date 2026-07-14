import type { PrefillPropertyRow } from "./autofillPrefillRows";
import type {
  AutofillRule,
  Category,
  ConditionMatchOperator,
  ConditionNode,
  CustomProperty,
  Location,
  MediaType,
  Tag,
} from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { prefillPropertyRows } from "./autofillPrefillRows";
import { LabeledSection } from "./LabeledSection";
import { RuleGeneralFields } from "./RuleGeneralFields";
import { describePropertyPredicate } from "../lib/describePropertyPredicate";

import { Separator } from "@/components/ui/separator";
import i18n from "@/i18n";

const OPERATOR_VERBS: Record<ConditionMatchOperator, string> = {
  contains: "contains",
  starts_with: "starts with",
  regex: "matches",
  domain: "domain is",
};

function describeConditionNode(
  node: ConditionNode,
  categories: Category[],
  tags: Tag[],
  properties: CustomProperty[],
  locations: Location[],
): string {
  switch (node.type) {
    case "group": {
      if (node.children.length === 0) return i18n.t("(empty group)");
      const combLabel = node.combinator === "and" ? i18n.t("ALL") : i18n.t("ANY");
      const inner = node.children
        .map(c => describeConditionNode(c, categories, tags, properties, locations))
        .join(node.combinator === "and" ? ` ${i18n.t("AND")} ` : ` ${i18n.t("OR")} `);
      return i18n.t("{{combLabel}} of: ({{inner}})", {
        combLabel,
        inner,
      });
    }
    case "match":
      return node.operator === "domain"
        ? i18n.t("Domain is \"{{pattern}}\"", {
          pattern: node.pattern,
        })
        : i18n.t("{{field}} {{verb}} \"{{pattern}}\"", {
          field: node.field === "url" ? i18n.t("URL") : i18n.t("Title"),
          verb: i18n.t(OPERATOR_VERBS[node.operator]),
          pattern: node.pattern,
        });
    case "category": {
      const names = node.categoryIds.map(id => categories.find(c => c.id === id)?.name ?? id);
      return i18n.t("Category is one of: {{names}}", {
        names: names.join(", "),
      });
    }
    case "website":
      return node.domains.length === 1
        ? i18n.t("Website is: {{domain}}", {
          domain: node.domains[0],
        })
        : i18n.t("Website is one of: {{domains}}", {
          domains: node.domains.join(", "),
        });
    case "tag": {
      const names = node.tagIds.map(id => tags.find(t => t.id === id)?.name ?? id);
      return i18n.t("Tagged with any of: {{names}}", {
        names: names.join(", "),
      });
    }
    case "location": {
      const names = node.locationIds.map(id => locations.find(l => l.id === id)?.name ?? id);
      return i18n.t("Located in any of: {{names}}", {
        names: names.join(", "),
      });
    }
    case "youtube-channel":
      return node.channelIds.length === 1
        ? i18n.t("YouTube channel is (1)")
        : i18n.t("YouTube channel is one of ({{count}})", {
          count: node.channelIds.length,
        });
    case "media-type":
      return node.mediaTypeIds.length === 1
        ? i18n.t("media type is (1)")
        : i18n.t("media type is one of ({{count}})", {
          count: node.mediaTypeIds.length,
        });
    case "genre-mood":
      return node.genreMoodIds.length === 1
        ? i18n.t("Genres & Moods is (1)")
        : i18n.t("Genres & Moods is one of ({{count}})", {
          count: node.genreMoodIds.length,
        });
    case "taxonomy":
      return node.termIds.length === 1
        ? i18n.t("taxonomy term is (1)")
        : i18n.t("taxonomy term is one of ({{count}})", {
          count: node.termIds.length,
        });
    case "relationship-type":
      return node.relationshipTypeIds.length === 1
        ? i18n.t("has a relationship of type (1)")
        : i18n.t("has a relationship of one of ({{count}})", {
          count: node.relationshipTypeIds.length,
        });
    case "language-usage":
      return i18n.t("has a language usage ({{languageCount}} language / {{levelCount}} level)", {
        languageCount: node.languageIds.length,
        levelCount: node.usageLevelIds.length,
      });
    case "property": {
      const property = properties.find(p => p.id === node.propertyId);
      const name = property?.name ?? i18n.t("Unknown property");
      return `${name}: ${describePropertyPredicate(node.predicate, property)}`;
    }
    case "fillable-fields":
      return node.mode === "has"
        ? i18n.t("has fillable fields")
        : i18n.t("has nothing to fill");
    default: {
      const exhaustive: never = node;
      return String(exhaustive);
    }
  }
}

/** Body of the General view tab: description and metadata (name lives in the page header). */
export function AutofillGeneralFields({
  rule,
}: { rule: AutofillRule }) {
  return (
    <RuleGeneralFields
      description={rule.description}
      slug={rule.slug}
      createdAt={rule.createdAt}
      priorityLabel={rule.sortOrder}
    />
  );
}

/** Body of the Conditions view tab: detailed breakdown of the activation condition tree. */
export function AutofillConditionsFields({
  rule, categories, tags, properties, locations,
}: {
  rule: AutofillRule;
  categories: Category[];
  tags: Tag[];
  properties: CustomProperty[];
  locations: Location[];
}) {
  const {
    t,
  } = useTranslation();
  const tree = rule.conditions;
  if (tree.children.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("Always matches (no conditions set.)")}
      </p>
    );
  }
  const combinatorLabel = tree.combinator === "and" ? t("ALL") : t("ANY");
  return (
    <div className="space-y-2 text-sm">
      <p className="text-muted-foreground">
        {t("Matches")}
        {" "}
        {combinatorLabel}
        {" "}
        {t("of:")}
      </p>
      <ul className="space-y-1">
        {tree.children.map((child, index) => (

          <li
            key={index}
            className="flex gap-2"
          >
            <span className="text-muted-foreground">•</span>
            <span>{describeConditionNode(child, categories, tags, properties, locations)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** View block: the category the rule sets (or "leave unchanged"). */
export function PrefillCategoryBlock({
  categoryName,
}: { categoryName: string | null }) {
  const {
    t,
  } = useTranslation();
  return (
    <LabeledSection title={t("Category")}>
      {categoryName
        ? <p className="text-sm">{categoryName}</p>
        : <p className="text-sm text-muted-foreground">{t("— Leave unchanged —")}</p>}
    </LabeledSection>
  );
}

/** View block: the media type the rule sets (or "leave unchanged"). */
export function PrefillMediaTypeBlock({
  mediaTypeName,
}: { mediaTypeName: string | null }) {
  const {
    t,
  } = useTranslation();
  return (
    <LabeledSection title={t("Media type")}>
      {mediaTypeName
        ? <p className="text-sm">{mediaTypeName}</p>
        : <p className="text-sm text-muted-foreground">{t("— Leave unchanged —")}</p>}
    </LabeledSection>
  );
}

/** View block: the tags the rule applies. */
export function PrefillTagsBlock({
  tagNames,
}: { tagNames: string[] }) {
  const {
    t,
  } = useTranslation();
  return (
    <LabeledSection title={t("Tags")}>
      {tagNames.length > 0
        ? (
          <ul className="space-y-1 text-sm">
            {tagNames.map((name, i) => (

              <li key={i}>
                •
                {" "}
                {name}
              </li>
            ))}
          </ul>
        )
        : <p className="text-sm text-muted-foreground">{t("None")}</p>}
    </LabeledSection>
  );
}

/** View block: the locations the rule applies. */
export function PrefillLocationsBlock({
  locationNames,
}: { locationNames: string[] }) {
  const {
    t,
  } = useTranslation();
  return (
    <LabeledSection title={t("Locations")}>
      {locationNames.length > 0
        ? (
          <ul className="space-y-1 text-sm">
            {locationNames.map((name, i) => (

              <li key={i}>
                •
                {" "}
                {name}
              </li>
            ))}
          </ul>
        )
        : <p className="text-sm text-muted-foreground">{t("None")}</p>}
    </LabeledSection>
  );
}

/** View block: the custom-property values the rule sets. */
export function PrefillPropertiesBlock({
  propertyValues,
}: { propertyValues: PrefillPropertyRow[] }) {
  const {
    t,
  } = useTranslation();
  return (
    <LabeledSection title={t("Custom Properties")}>
      {propertyValues.length > 0
        ? (
          <ul className="space-y-1 text-sm">
            {propertyValues.map(pv => (
              <li key={pv.id}>
                •
                {" "}
                {pv.name}
                :
                {" "}
                {pv.display}
              </li>
            ))}
          </ul>
        )
        : <p className="text-sm text-muted-foreground">{t("None")}</p>}
    </LabeledSection>
  );
}

/**
 * Body of the Prefill view tab: what category/media type/tags/locations/properties the rule sets.
 * Recomposed (#1197) from the five presentational blocks above so its prop-driven story stays
 * unchanged while each block can be surfaced on its own Page Layouts view field.
 */
export function AutofillPrefillFields({
  rule, categories, mediaTypes, tags, properties, locations,
}: {
  rule: AutofillRule;
  categories: Category[];
  mediaTypes: MediaType[];
  tags: Tag[];
  properties: CustomProperty[];
  locations: Location[];
}) {
  const categoryName = rule.setCategoryId
    ? (categories.find(c => c.id === rule.setCategoryId)?.name ?? null)
    : null;

  const mediaTypeName = rule.setMediaTypeId
    ? (mediaTypes.find(m => m.id === rule.setMediaTypeId)?.name ?? null)
    : null;

  const tagNames = rule.tagIds.map(id => tags.find(tag => tag.id === id)?.name ?? id);

  const locationNames = rule.locationIds.map(id => locations.find(l => l.id === id)?.name ?? id);

  const propertyValues = prefillPropertyRows(rule, properties);

  return (
    <div className="space-y-6">
      <PrefillCategoryBlock categoryName={categoryName} />
      <Separator />
      <PrefillMediaTypeBlock mediaTypeName={mediaTypeName} />
      <Separator />
      <PrefillTagsBlock tagNames={tagNames} />
      <Separator />
      <PrefillLocationsBlock locationNames={locationNames} />
      <Separator />
      <PrefillPropertiesBlock propertyValues={propertyValues} />
    </div>
  );
}
