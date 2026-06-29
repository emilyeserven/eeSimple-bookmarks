import type {
  Category,
  CategoryCondition,
  ConditionNode,
  ConditionTree,
  CustomProperty,
  LocationCondition,
  MatchCondition,
  MediaTypeCondition,
  PropertyCondition,
  RelationshipTypeCondition,
  TagCondition,
  TagNode,
  WebsiteCondition,
  YouTubeChannelCondition,
} from "@eesimple/types";

import { ChevronDown } from "lucide-react";

import { CategoryConditionEditor } from "./CategoryConditionEditor";
import { LocationConditionEditor } from "./LocationConditionEditor";
import { MatchConditionEditor } from "./MatchConditionEditor";
import { MediaTypeConditionEditor } from "./MediaTypeConditionEditor";
import { PropertyConditionEditor } from "./PropertyConditionEditor";
import { RelationshipTypeConditionEditor } from "./RelationshipTypeConditionEditor";
import { TagConditionEditor } from "./TagConditionEditor";
import { WebsiteConditionEditor } from "./WebsiteConditionEditor";
import { YouTubeChannelConditionEditor } from "./YouTubeChannelConditionEditor";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface ConditionsFieldProps {
  value: ConditionTree;
  onChange: (next: ConditionTree) => void;
  categories: Category[];
  properties: CustomProperty[];
  tagTree: TagNode[];
  openCustomProperties?: boolean;
}

interface SectionProps {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/** A labelled collapsible group within the conditions builder. */
function Section({
  title, summary, defaultOpen, children,
}: SectionProps) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className="rounded-md border"
    >
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="
            flex w-full items-center justify-between gap-2 p-3 text-left text-sm
            font-medium
          "
        >
          <span>
            {title}
            {summary ? <span className="ml-2 font-normal text-muted-foreground">{summary}</span> : null}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-60" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t p-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * The composable "Conditions and Filter" builder. Renders the root condition group as four
 * collapsible sections (match / category / tags / custom properties) combined by a single
 * AND/OR toggle. The underlying value is a recursive {@link ConditionTree}, so nested groups can
 * be layered on later without changing the data shape.
 */
export function ConditionsField({
  value, onChange, categories, properties, tagTree, openCustomProperties,
}: ConditionsFieldProps) {
  const matches = value.children.filter((child): child is MatchCondition => child.type === "match");
  const categoryLeaf = value.children.find((child): child is CategoryCondition => child.type === "category");
  const websiteLeaf = value.children.find((child): child is WebsiteCondition => child.type === "website");
  const tagLeaf = value.children.find((child): child is TagCondition => child.type === "tag");
  const locationLeaf = value.children.find((child): child is LocationCondition => child.type === "location");
  const youtubeChannelLeaf = value.children.find((child): child is YouTubeChannelCondition => child.type === "youtube-channel");
  const mediaTypeLeaf = value.children.find((child): child is MediaTypeCondition => child.type === "media-type");
  const relationshipTypeLeaf = value.children.find((child): child is RelationshipTypeCondition => child.type === "relationship-type");
  const propertyLeaves = value.children.filter((child): child is PropertyCondition => child.type === "property");
  // Preserve any nested groups (not editable in this v1 UI) so the tree round-trips.
  const nestedGroups = value.children.filter(child => child.type === "group");

  function commit(next: {
    matches?: MatchCondition[];
    category?: CategoryCondition | null;
    website?: WebsiteCondition | null;
    tag?: TagCondition | null;
    location?: LocationCondition | null;
    youtubeChannel?: YouTubeChannelCondition | null;
    mediaType?: MediaTypeCondition | null;
    relationshipType?: RelationshipTypeCondition | null;
    properties?: PropertyCondition[];
  }) {
    const nextMatches = next.matches ?? matches;
    const nextCategory = next.category === undefined ? categoryLeaf : next.category;
    const nextWebsite = next.website === undefined ? websiteLeaf : next.website;
    const nextTag = next.tag === undefined ? tagLeaf : next.tag;
    const nextLocation = next.location === undefined ? locationLeaf : next.location;
    const nextYoutubeChannel = next.youtubeChannel === undefined ? youtubeChannelLeaf : next.youtubeChannel;
    const nextMediaType = next.mediaType === undefined ? mediaTypeLeaf : next.mediaType;
    const nextRelationshipType = next.relationshipType === undefined ? relationshipTypeLeaf : next.relationshipType;
    const nextProperties = next.properties ?? propertyLeaves;
    const children: ConditionNode[] = [
      ...nextMatches,
      ...(nextCategory && nextCategory.categoryIds.length > 0 ? [nextCategory] : []),
      ...(nextWebsite && nextWebsite.domains.length > 0 ? [nextWebsite] : []),
      ...(nextTag && nextTag.tagIds.length > 0 ? [nextTag] : []),
      ...(nextLocation && nextLocation.locationIds.length > 0 ? [nextLocation] : []),
      ...(nextYoutubeChannel && nextYoutubeChannel.channelIds.length > 0 ? [nextYoutubeChannel] : []),
      ...(nextMediaType && nextMediaType.mediaTypeIds.length > 0 ? [nextMediaType] : []),
      ...(nextRelationshipType && nextRelationshipType.relationshipTypeIds.length > 0 ? [nextRelationshipType] : []),
      ...nextProperties,
      ...nestedGroups,
    ];
    onChange({
      ...value,
      children,
    });
  }

  const categoryCount = categoryLeaf?.categoryIds.length ?? 0;
  const websiteCount = websiteLeaf?.domains.length ?? 0;
  const tagCount = tagLeaf?.tagIds.length ?? 0;
  const locationCount = locationLeaf?.locationIds.length ?? 0;
  const channelCount = youtubeChannelLeaf?.channelIds.length ?? 0;
  const mediaTypeCount = mediaTypeLeaf?.mediaTypeIds.length ?? 0;
  const relationshipTypeCount = relationshipTypeLeaf?.relationshipTypeIds.length ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Bookmarks must match</span>
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
          <ToggleGroupItem value="and">all (AND)</ToggleGroupItem>
          <ToggleGroupItem value="or">any (OR)</ToggleGroupItem>
        </ToggleGroup>
        <span className="text-sm text-muted-foreground">of the following:</span>
      </div>

      <Section
        title="Title / Name"
        summary={matches.length > 0 ? `${matches.length}` : undefined}
        defaultOpen={matches.length > 0}
      >
        <div className="space-y-3">
          {matches.map((match, index) => (
            <div

              key={index}
              className="space-y-2 rounded-md border p-2"
            >
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    commit({
                      matches: matches.filter((_, current) => current !== index),
                    })}
                >
                  Remove
                </Button>
              </div>
              <MatchConditionEditor
                value={match}
                onChange={next =>
                  commit({
                    matches: matches.map((existing, current) => (current === index ? next : existing)),
                  })}
              />
            </div>
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
            Add title condition
          </Button>
        </div>
      </Section>

      <Section
        title="Category"
        summary={categoryCount > 0 ? `${categoryCount} selected` : undefined}
        defaultOpen={categoryCount > 0}
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
      </Section>

      <Section
        title="Website"
        summary={websiteCount > 0 ? `${websiteCount} selected` : undefined}
        defaultOpen={websiteCount > 0}
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
      </Section>

      <Section
        title="YouTube Channel"
        summary={channelCount > 0 ? `${channelCount} selected` : undefined}
        defaultOpen={channelCount > 0}
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
      </Section>

      <Section
        title="Media Type"
        summary={mediaTypeCount > 0 ? `${mediaTypeCount} selected` : undefined}
        defaultOpen={mediaTypeCount > 0}
      >
        <MediaTypeConditionEditor
          value={mediaTypeLeaf ?? {
            type: "media-type",
            mediaTypeIds: [],
          }}
          onChange={next =>
            commit({
              mediaType: next.mediaTypeIds.length > 0 ? next : null,
            })}
        />
      </Section>

      <Section
        title="Relationship Type"
        summary={relationshipTypeCount > 0 ? `${relationshipTypeCount} selected` : undefined}
        defaultOpen={relationshipTypeCount > 0}
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
      </Section>

      <Section
        title="Tags"
        summary={tagCount > 0 ? `${tagCount} selected` : undefined}
        defaultOpen={tagCount > 0}
      >
        <TagConditionEditor
          value={tagLeaf ?? {
            type: "tag",
            tagIds: [],
          }}
          tagTree={tagTree}
          onChange={next =>
            commit({
              tag: next.tagIds.length > 0 ? next : null,
            })}
        />
      </Section>

      <Section
        title="Locations"
        summary={locationCount > 0 ? `${locationCount} selected` : undefined}
        defaultOpen={locationCount > 0}
      >
        <LocationConditionEditor
          value={locationLeaf ?? {
            type: "location",
            locationIds: [],
          }}
          onChange={next =>
            commit({
              location: next.locationIds.length > 0 ? next : null,
            })}
        />
      </Section>

      <Section
        title="Custom properties"
        summary={propertyLeaves.length > 0 ? `${propertyLeaves.length}` : undefined}
        defaultOpen={openCustomProperties || propertyLeaves.length > 0}
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
      </Section>
    </div>
  );
}
