import type { Category, ConditionTree, CustomProperty, MatchCondition, TagNode } from "@eesimple/types";
import type { ReactNode } from "react";

import {
  CategoryConditionEditor,
  GenreMoodConditionEditor,
  LanguageUsageConditionEditor,
  LocationConditionEditor,
  MatchConditionEditor,
  MediaTypeConditionEditor,
  PropertyConditionEditor,
  RelationshipTypeConditionEditor,
  TagConditionEditor,
  WebsiteConditionEditor,
  YouTubeChannelConditionEditor,
} from "./conditionEditors";
import { Section } from "./ConditionsFieldSection";
import { buildRootChildren, splitRootConditions } from "./conditionsFieldTree";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import i18n from "@/i18n";

interface ConditionsFieldProps {
  value: ConditionTree;
  onChange: (next: ConditionTree) => void;
  categories: Category[];
  properties: CustomProperty[];
  tagTree: TagNode[];
  openCustomProperties?: boolean;
}

/** A collapsible section whose "N selected" summary and default-open state derive from a count. */
function CountSection({
  title,
  count,
  bareCount = false,
  forceOpen = false,
  children,
}: {
  title: string;
  count: number;
  /** Pass true for a bare count with no "selected" suffix. */
  bareCount?: boolean;
  /** Open the section even when nothing is selected yet (e.g. a deep link into properties). */
  forceOpen?: boolean;
  children: ReactNode;
}) {
  const summary = count > 0
    ? bareCount
      ? `${count}`
      : i18n.t("{{count}} selected", {
        count,
      })
    : undefined;
  return (
    <Section
      title={title}
      summary={summary}
      defaultOpen={forceOpen || count > 0}
    >
      {children}
    </Section>
  );
}

/** One editable Title/Name match row with its Remove button. */
function MatchConditionRow({
  match,
  onChange,
  onRemove,
}: {
  match: MatchCondition;
  onChange: (next: MatchCondition) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-2 rounded-md border p-2">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
        >
          {i18n.t("Remove")}
        </Button>
      </div>
      <MatchConditionEditor
        value={match}
        onChange={onChange}
      />
    </div>
  );
}

/**
 * The composable "Conditions and Filter" builder. Renders the root condition group as
 * collapsible sections (match / category / tags / custom properties / …) combined by a single
 * AND/OR toggle. The underlying value is a recursive {@link ConditionTree}, so nested groups can
 * be layered on later without changing the data shape.
 */
export function ConditionsField({
  value, onChange, categories, properties, tagTree, openCustomProperties,
}: ConditionsFieldProps) {
  const leaves = splitRootConditions(value);
  const {
    matches, categoryLeaf, websiteLeaf, tagLeaf, locationLeaf, youtubeChannelLeaf, mediaTypeLeaf,
    genreMoodLeaf, relationshipTypeLeaf, languageUsageLeaf, propertyLeaves, counts,
  } = leaves;

  const commit = (next: Parameters<typeof buildRootChildren>[1]) =>
    onChange({
      ...value,
      children: buildRootChildren(leaves, next),
    });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{i18n.t("Bookmarks must match")}</span>
        <ToggleGroup
          type="single"
          size="sm"
          value={value.combinator}
          onValueChange={(next) => {
            if (next === "and" || next === "or") {
              onChange({
                ...value,
                combinator: next,
              });
            }
          }}
        >
          <ToggleGroupItem value="and">{i18n.t("all (AND)")}</ToggleGroupItem>
          <ToggleGroupItem value="or">{i18n.t("any (OR)")}</ToggleGroupItem>
        </ToggleGroup>
        <span className="text-sm text-muted-foreground">{i18n.t("of the following:")}</span>
      </div>

      <CountSection
        title={i18n.t("Title / Name")}
        count={matches.length}
        bareCount
      >
        <div className="space-y-3">
          {matches.map((match, index) => (
            <MatchConditionRow
              key={index}
              match={match}
              onChange={next =>
                commit({
                  matches: matches.map((existing, current) => (current === index ? next : existing)),
                })}
              onRemove={() =>
                commit({
                  matches: matches.filter((_, current) => current !== index),
                })}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              commit({
                matches: [...matches, {
                  type: "match",
                  field: "title",
                  operator: "contains",
                  pattern: "",
                }],
              })}
          >
            {i18n.t("Add title condition")}
          </Button>
        </div>
      </CountSection>

      <CountSection
        title={i18n.t("Category")}
        count={counts.category}
      >
        <CategoryConditionEditor
          value={categoryLeaf ?? {
            type: "category",
            categoryIds: [],
          }}
          categories={categories}
          onChange={next =>
            commit({
              category: next.categoryIds.length > 0 ? next : null,
            })}
        />
      </CountSection>

      <CountSection
        title={i18n.t("Website")}
        count={counts.website}
      >
        <WebsiteConditionEditor
          value={websiteLeaf ?? {
            type: "website",
            domains: [],
          }}
          onChange={next =>
            commit({
              website: next.domains.length > 0 ? next : null,
            })}
        />
      </CountSection>

      <CountSection
        title={i18n.t("YouTube Channel")}
        count={counts.youtubeChannel}
      >
        <YouTubeChannelConditionEditor
          value={youtubeChannelLeaf ?? {
            type: "youtube-channel",
            channelIds: [],
          }}
          onChange={next =>
            commit({
              youtubeChannel: next.channelIds.length > 0 ? next : null,
            })}
        />
      </CountSection>

      <CountSection
        title={i18n.t("Media Type")}
        count={counts.mediaType}
      >
        <MediaTypeConditionEditor
          value={mediaTypeLeaf ?? {
            type: "media-type",
            mediaTypeIds: [],
            cascadeMediaTypeIds: [],
          }}
          onChange={next =>
            commit({
              mediaType: next.mediaTypeIds.length > 0 ? next : null,
            })}
        />
      </CountSection>

      <CountSection
        title={i18n.t("Genres & Moods")}
        count={counts.genreMood}
      >
        <GenreMoodConditionEditor
          value={genreMoodLeaf ?? {
            type: "genre-mood",
            genreMoodIds: [],
            cascadeGenreMoodIds: [],
          }}
          onChange={next =>
            commit({
              genreMood: next.genreMoodIds.length > 0 ? next : null,
            })}
        />
      </CountSection>

      <CountSection
        title={i18n.t("Relationship Type")}
        count={counts.relationshipType}
      >
        <RelationshipTypeConditionEditor
          value={relationshipTypeLeaf ?? {
            type: "relationship-type",
            relationshipTypeIds: [],
          }}
          onChange={next =>
            commit({
              relationshipType: next.relationshipTypeIds.length > 0 ? next : null,
            })}
        />
      </CountSection>

      <CountSection
        title={i18n.t("Language Usage")}
        count={counts.languageUsage}
      >
        <LanguageUsageConditionEditor
          value={languageUsageLeaf ?? {
            type: "language-usage",
            languageIds: [],
            usageLevelIds: [],
          }}
          onChange={next =>
            commit({
              languageUsage: next.languageIds.length > 0 || next.usageLevelIds.length > 0 ? next : null,
            })}
        />
      </CountSection>

      <CountSection
        title={i18n.t("Tags")}
        count={counts.tag}
      >
        <TagConditionEditor
          value={tagLeaf ?? {
            type: "tag",
            tagIds: [],
            cascadeTagIds: [],
          }}
          tagTree={tagTree}
          onChange={next =>
            commit({
              tag: next.tagIds.length > 0 ? next : null,
            })}
        />
      </CountSection>

      <CountSection
        title={i18n.t("Locations")}
        count={counts.location}
      >
        <LocationConditionEditor
          value={locationLeaf ?? {
            type: "location",
            locationIds: [],
            cascadeLocationIds: [],
          }}
          onChange={next =>
            commit({
              location: next.locationIds.length > 0 ? next : null,
            })}
        />
      </CountSection>

      <CountSection
        title={i18n.t("Custom properties")}
        count={propertyLeaves.length}
        bareCount
        forceOpen={openCustomProperties}
      >
        <PropertyConditionEditor
          value={propertyLeaves}
          properties={properties}
          categories={categories}
          selectedCategoryIds={categoryLeaf?.categoryIds ?? []}
          onChange={next =>
            commit({
              properties: next,
            })}
        />
      </CountSection>
    </div>
  );
}
