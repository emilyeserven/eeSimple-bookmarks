import type { useBookmarkTaxonomyContext } from "./useBookmarkTaxonomyContext";
import type { FlatNode } from "@/lib/tagTree";
import type { Person, Bookmark, CardDisplayRule, Category, CustomProperty, Group, LocationNode, MediaTypeNode, Newsletter, TagNode } from "@eesimple/types";

import { useMemo } from "react";

import {
  ArrowLeftIcon,
  CheckIcon,
  LayoutGridIcon,
  PlusIcon,
  TagIcon,
} from "lucide-react";

import { RomanizedLabel } from "./RomanizedLabel";

import {
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { useCategoryRootTags } from "@/hooks/useCategories";
import { subtreeIds } from "@/lib/tagTree";

export type TaxonomyMode = "category" | "media-type" | "tags" | "locations" | "people" | "groups" | "newsletter" | "choices-property" | "rating-property";

function useTagsPalette(
  flatTags: FlatNode<TagNode>[],
  pendingTagIds: string[],
  categoryId: string | undefined,
) {
  const {
    data: allowedRootIds,
  } = useCategoryRootTags(categoryId ?? "");

  const allTagsById = useMemo(
    () => new Map(flatTags.map(({
      node,
    }) => [node.id, node])),
    [flatTags],
  );

  const filteredFlatTags = useMemo(() => {
    if (allowedRootIds === undefined) return flatTags;
    if (allowedRootIds.length === 0) return [];
    const allowedSet = new Set(allowedRootIds);
    return flatTags.filter(({
      node,
    }) => {
      let current: TagNode | undefined = node;
      while (current?.parentId) current = allTagsById.get(current.parentId);
      return current !== undefined && allowedSet.has(current.id);
    });
  }, [flatTags, allowedRootIds, allTagsById]);

  const {
    priorityTags, otherTags,
  } = useMemo(() => {
    if (pendingTagIds.length === 0) return {
      priorityTags: [],
      otherTags: filteredFlatTags,
    };
    const priorityIds = new Set<string>();
    for (const tagId of pendingTagIds) {
      priorityIds.add(tagId);
      let current = allTagsById.get(tagId);
      while (current?.parentId) {
        priorityIds.add(current.parentId);
        current = allTagsById.get(current.parentId);
      }
      const node = allTagsById.get(tagId);
      if (node) subtreeIds(node).forEach(id => priorityIds.add(id));
    }
    return {
      priorityTags: filteredFlatTags.filter(({
        node,
      }) => priorityIds.has(node.id)),
      otherTags: filteredFlatTags.filter(({
        node,
      }) => !priorityIds.has(node.id)),
    };
  }, [filteredFlatTags, pendingTagIds, allTagsById]);

  return {
    priorityTags,
    otherTags,
  };
}

export function CategorySubPalette({
  categories,
  currentCategoryId,
  onBack,
  onSelect,
  onCreateNew,
}: {
  categories: Category[];
  currentCategoryId: string | null | undefined;
  onBack: () => void;
  onSelect: (categoryId: string) => void;
  onCreateNew: () => void;
}) {
  return (
    <>
      <CommandGroup heading="Category">
        <CommandItem
          value="back"
          onSelect={onBack}
        >
          <ArrowLeftIcon />
          Back
        </CommandItem>
        <CommandItem
          value="new category"
          onSelect={onCreateNew}
        >
          <PlusIcon />
          New category…
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Select category">
        {categories.map(category => (
          <CommandItem
            key={category.id}
            value={category.name}
            onSelect={() => onSelect(category.id)}
          >
            {currentCategoryId === category.id && (
              <CheckIcon className="text-primary" />
            )}
            {category.name}
          </CommandItem>
        ))}
      </CommandGroup>
    </>
  );
}

export function MediaTypeSubPalette({
  flatMediaTypes,
  currentMediaTypeId,
  onBack,
  onSelect,
  onCreateNew,
}: {
  flatMediaTypes: FlatNode<MediaTypeNode>[];
  currentMediaTypeId: string | null | undefined;
  onBack: () => void;
  onSelect: (mediaTypeId: string | null) => void;
  onCreateNew: () => void;
}) {
  return (
    <>
      <CommandGroup heading="Media Type">
        <CommandItem
          value="back"
          onSelect={onBack}
        >
          <ArrowLeftIcon />
          Back
        </CommandItem>
        <CommandItem
          value="new media type"
          onSelect={onCreateNew}
        >
          <PlusIcon />
          New media type…
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Select media type">
        <CommandItem
          value="None"
          onSelect={() => onSelect(null)}
        >
          {currentMediaTypeId == null && (
            <CheckIcon className="text-primary" />
          )}
          None
        </CommandItem>
        {flatMediaTypes.map(({
          node: mt, depth,
        }) => (
          <CommandItem
            key={mt.id}
            value={mt.name}
            onSelect={() => onSelect(mt.id)}
          >
            {currentMediaTypeId === mt.id && (
              <CheckIcon className="text-primary" />
            )}
            <span
              style={{
                paddingLeft: depth > 0 ? `${depth}rem` : undefined,
              }}
            >
              {mt.name}
            </span>
          </CommandItem>
        ))}
      </CommandGroup>
    </>
  );
}

export function TagsSubPalette({
  flatTags,
  categoryId,
  pendingTagIds,
  onToggleTag,
  onBack,
  onDone,
  onCreateNew,
}: {
  flatTags: FlatNode<TagNode>[];
  categoryId: string | undefined;
  pendingTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onBack: () => void;
  onDone: (tagIds: string[]) => void;
  onCreateNew: () => void;
}) {
  const {
    priorityTags, otherTags,
  } = useTagsPalette(flatTags, pendingTagIds, categoryId);

  const renderTagItem = ({
    node: tag, depth,
  }: FlatNode<TagNode>) => {
    const selected = pendingTagIds.includes(tag.id);
    return (
      <CommandItem
        key={tag.id}
        value={`${tag.name} ${tag.romanizedName ?? ""}`.trim()}
        onSelect={() => onToggleTag(tag.id)}
      >
        <span
          style={{
            paddingLeft: depth > 0 ? `${depth}rem` : undefined,
          }}
        >
          <RomanizedLabel
            name={tag.name}
            romanized={tag.romanizedName}
          />
        </span>
        {selected && (
          <CheckIcon
            className="ml-auto text-primary"
          />
        )}
      </CommandItem>
    );
  };

  return (
    <>
      <CommandGroup heading="Tags">
        <CommandItem
          value="back"
          onSelect={onBack}
        >
          <ArrowLeftIcon />
          Back
        </CommandItem>
        <CommandItem
          value="new tag"
          onSelect={onCreateNew}
        >
          <PlusIcon />
          New tag…
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      {priorityTags.length > 0
        ? (
          <>
            <CommandGroup heading="Selected & related">
              {priorityTags.map(renderTagItem)}
            </CommandGroup>
            {otherTags.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Other tags">
                  {otherTags.map(renderTagItem)}
                </CommandGroup>
              </>
            )}
          </>
        )
        : (
          <CommandGroup heading="Toggle tags">
            {otherTags.map(renderTagItem)}
          </CommandGroup>
        )}
      <CommandSeparator />
      <CommandGroup>
        <CommandItem
          value="done save tags"
          onSelect={() => onDone(pendingTagIds)}
        >
          <CheckIcon />
          {`Done (${pendingTagIds.length.toString()} selected)`}
        </CommandItem>
      </CommandGroup>
    </>
  );
}

export function LocationsSubPalette({
  flatLocations,
  pendingLocationIds,
  onToggleLocation,
  onBack,
  onDone,
  onCreateNew,
}: {
  flatLocations: FlatNode<LocationNode>[];
  pendingLocationIds: string[];
  onToggleLocation: (locationId: string) => void;
  onBack: () => void;
  onDone: (locationIds: string[]) => void;
  onCreateNew: () => void;
}) {
  const renderLocationItem = ({
    node: location, depth,
  }: FlatNode<LocationNode>) => {
    const selected = pendingLocationIds.includes(location.id);
    return (
      <CommandItem
        key={location.id}
        value={`${location.name} ${location.romanizedName ?? ""}`.trim()}
        onSelect={() => onToggleLocation(location.id)}
      >
        <span
          style={{
            paddingLeft: depth > 0 ? `${depth}rem` : undefined,
          }}
        >
          <RomanizedLabel
            name={location.name}
            romanized={location.romanizedName}
          />
        </span>
        {selected && (
          <CheckIcon
            className="ml-auto text-primary"
          />
        )}
      </CommandItem>
    );
  };

  return (
    <>
      <CommandGroup heading="Locations">
        <CommandItem
          value="back"
          onSelect={onBack}
        >
          <ArrowLeftIcon />
          Back
        </CommandItem>
        <CommandItem
          value="new location"
          onSelect={onCreateNew}
        >
          <PlusIcon />
          New location…
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Toggle locations">
        {flatLocations.map(renderLocationItem)}
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup>
        <CommandItem
          value="done save locations"
          onSelect={() => onDone(pendingLocationIds)}
        >
          <CheckIcon />
          {`Done (${pendingLocationIds.length.toString()} selected)`}
        </CommandItem>
      </CommandGroup>
    </>
  );
}

export function PeopleSubPalette({
  people,
  pendingPersonIds,
  onTogglePerson,
  onBack,
  onDone,
  onCreateNew,
}: {
  people: Person[];
  pendingPersonIds: string[];
  onTogglePerson: (personId: string) => void;
  onBack: () => void;
  onDone: (personIds: string[]) => void;
  onCreateNew: () => void;
}) {
  return (
    <>
      <CommandGroup heading="People">
        <CommandItem
          value="back"
          onSelect={onBack}
        >
          <ArrowLeftIcon />
          Back
        </CommandItem>
        <CommandItem
          value="new person"
          onSelect={onCreateNew}
        >
          <PlusIcon />
          New person…
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Toggle people">
        {people.map((person) => {
          const selected = pendingPersonIds.includes(person.id);
          return (
            <CommandItem
              key={person.id}
              value={person.name}
              onSelect={() => onTogglePerson(person.id)}
            >
              {selected && <CheckIcon className="text-primary" />}
              {person.name}
            </CommandItem>
          );
        })}
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup>
        <CommandItem
          value="done save people"
          onSelect={() => onDone(pendingPersonIds)}
        >
          <CheckIcon />
          {`Done (${pendingPersonIds.length.toString()} selected)`}
        </CommandItem>
      </CommandGroup>
    </>
  );
}

export function GroupsSubPalette({
  groups,
  pendingGroupIds,
  onToggleGroup,
  onBack,
  onDone,
  onCreateNew,
}: {
  groups: Group[];
  pendingGroupIds: string[];
  onToggleGroup: (groupId: string) => void;
  onBack: () => void;
  onDone: (groupIds: string[]) => void;
  onCreateNew: () => void;
}) {
  return (
    <>
      <CommandGroup heading="Groups">
        <CommandItem
          value="back"
          onSelect={onBack}
        >
          <ArrowLeftIcon />
          Back
        </CommandItem>
        <CommandItem
          value="new group"
          onSelect={onCreateNew}
        >
          <PlusIcon />
          New group…
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Toggle groups">
        {groups.map((group) => {
          const selected = pendingGroupIds.includes(group.id);
          return (
            <CommandItem
              key={group.id}
              value={group.name}
              onSelect={() => onToggleGroup(group.id)}
            >
              {selected && <CheckIcon className="text-primary" />}
              {group.name}
            </CommandItem>
          );
        })}
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup>
        <CommandItem
          value="done save groups"
          onSelect={() => onDone(pendingGroupIds)}
        >
          <CheckIcon />
          {`Done (${pendingGroupIds.length.toString()} selected)`}
        </CommandItem>
      </CommandGroup>
    </>
  );
}

export function ChoicesSubPalette({
  prop,
  pendingValues,
  onToggleValue,
  onBack,
  onSelectSingle,
  onDoneMultiple,
}: {
  prop: CustomProperty | undefined;
  pendingValues: string[];
  onToggleValue: (value: string) => void;
  onBack: () => void;
  onSelectSingle: (value: string) => void;
  onDoneMultiple: (values: string[]) => void;
}) {
  if (!prop) return null;
  return (
    <>
      <CommandGroup heading={prop.name}>
        <CommandItem
          value="back"
          onSelect={onBack}
        >
          <ArrowLeftIcon />
          Back
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading={`Select ${prop.name}`}>
        {prop.choicesItems.map((item) => {
          const selected = pendingValues.includes(item.value);
          return (
            <CommandItem
              key={item.value}
              value={item.label}
              onSelect={() => {
                if (prop.choicesMultiple) {
                  onToggleValue(item.value);
                }
                else {
                  onSelectSingle(item.value);
                }
              }}
            >
              {selected && <CheckIcon className="text-primary" />}
              {item.label}
            </CommandItem>
          );
        })}
      </CommandGroup>
      {prop.choicesMultiple && (
        <>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem
              value="done save choices"
              onSelect={() => onDoneMultiple(pendingValues)}
            >
              <CheckIcon />
              {`Done (${pendingValues.length.toString()} selected)`}
            </CommandItem>
          </CommandGroup>
        </>
      )}
    </>
  );
}

export function RatingSubPalette({
  prop,
  currentValue,
  onBack,
  onSelect,
}: {
  prop: CustomProperty | undefined;
  currentValue: number | null;
  onBack: () => void;
  onSelect: (value: number | null) => void;
}) {
  if (!prop) return null;
  const max = prop.ratingMax ?? 5;
  const allowZero = prop.ratingAllowZero ?? false;
  const options = Array.from({
    length: max,
  }, (_, i) => i + 1);
  return (
    <>
      <CommandGroup heading={prop.name}>
        <CommandItem
          value="back"
          onSelect={onBack}
        >
          <ArrowLeftIcon />
          Back
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading={`Select ${prop.name}`}>
        {allowZero && (
          <CommandItem
            value="No rating"
            onSelect={() => onSelect(null)}
          >
            {currentValue === null && (
              <CheckIcon className="text-primary" />
            )}
            No rating
          </CommandItem>
        )}
        {options.map(n => (
          <CommandItem
            key={n}
            value={`${n.toString()} ${n === 1 ? "star" : "stars"}`}
            onSelect={() => onSelect(n)}
          >
            {currentValue === n && <CheckIcon className="text-primary" />}
            {"★".repeat(n)}
            {"☆".repeat(max - n)}
          </CommandItem>
        ))}
      </CommandGroup>
    </>
  );
}

export function NewsletterSubPalette({
  newsletters,
  currentNewsletterId,
  onBack,
  onSelect,
  onCreateNew,
}: {
  newsletters: Newsletter[];
  currentNewsletterId: string | null | undefined;
  onBack: () => void;
  onSelect: (newsletterId: string | null) => void;
  onCreateNew: () => void;
}) {
  return (
    <>
      <CommandGroup heading="Newsletter">
        <CommandItem
          value="back"
          onSelect={onBack}
        >
          <ArrowLeftIcon />
          Back
        </CommandItem>
        <CommandItem
          value="new newsletter"
          onSelect={onCreateNew}
        >
          <PlusIcon />
          New newsletter…
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Select newsletter">
        <CommandItem
          value="None"
          onSelect={() => onSelect(null)}
        >
          {currentNewsletterId == null && (
            <CheckIcon className="text-primary" />
          )}
          None
        </CommandItem>
        {newsletters.map(nl => (
          <CommandItem
            key={nl.id}
            value={nl.name}
            onSelect={() => onSelect(nl.id)}
          >
            {currentNewsletterId === nl.id && (
              <CheckIcon className="text-primary" />
            )}
            {nl.name}
          </CommandItem>
        ))}
      </CommandGroup>
    </>
  );
}

/**
 * The bookmark quick-edit commands (category / tags / media type / people / newsletter / boolean /
 * choices / rating / other properties). Rendered either at the top of the palette when a card is
 * hovered, or in its in-page position on a bookmark detail page.
 */
export function BookmarkTaxonomiesGroup({
  bookmark,
  bookmarkId,
  isBookmarkViewPage,
  currentCategoryName,
  people,
  groups,
  booleanProperties,
  choicesProperties,
  ratingProperties,
  editableProperties,
  updateBookmark,
  onEnterMode,
  onEnterChoicesMode,
  onEnterRatingMode,
  onNavigateProperties,
  onClose,
}: {
  bookmark: Bookmark;
  bookmarkId: string;
  isBookmarkViewPage: boolean;
  currentCategoryName: string | null;
  people: Person[];
  groups: Group[];
  booleanProperties: CustomProperty[];
  choicesProperties: CustomProperty[];
  ratingProperties: CustomProperty[];
  editableProperties: CustomProperty[];
  updateBookmark: ReturnType<typeof useBookmarkTaxonomyContext>["updateBookmark"];
  onEnterMode: (mode: TaxonomyMode) => void;
  onEnterChoicesMode: (propId: string) => void;
  onEnterRatingMode: (propId: string) => void;
  onNavigateProperties: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <CommandGroup
        heading={isBookmarkViewPage
          ? "Bookmark Taxonomies"
          : `Bookmark Taxonomies — ${bookmark.title}`}
      >
        <CommandItem
          value="Change Category"
          onSelect={() => onEnterMode("category")}
        >
          <TagIcon />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span>Change Category</span>
            <span className="text-xs text-muted-foreground">
              {currentCategoryName}
            </span>
          </span>
        </CommandItem>
        <CommandItem
          value="Change Tags"
          onSelect={() => onEnterMode("tags")}
        >
          <TagIcon />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span>Change Tags</span>
            <span className="text-xs text-muted-foreground">
              {`${bookmark.tags.length.toString()} selected`}
            </span>
          </span>
        </CommandItem>
        <CommandItem
          value="Change Locations"
          onSelect={() => onEnterMode("locations")}
        >
          <TagIcon />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span>Change Locations</span>
            <span className="text-xs text-muted-foreground">
              {`${bookmark.locations.length.toString()} selected`}
            </span>
          </span>
        </CommandItem>
        <CommandItem
          value="Change Media Type"
          onSelect={() => onEnterMode("media-type")}
        >
          <TagIcon />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span>Change Media Type</span>
            <span className="text-xs text-muted-foreground">
              {bookmark.mediaType?.name ?? "None"}
            </span>
          </span>
        </CommandItem>
        {people.length > 0 && (
          <CommandItem
            value="Change People"
            onSelect={() => onEnterMode("people")}
          >
            <TagIcon />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span>Change People</span>
              <span className="text-xs text-muted-foreground">
                {`${bookmark.people.length.toString()} selected`}
              </span>
            </span>
          </CommandItem>
        )}
        {groups.length > 0 && (
          <CommandItem
            value="Change Groups"
            onSelect={() => onEnterMode("groups")}
          >
            <TagIcon />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span>Change Groups</span>
              <span className="text-xs text-muted-foreground">
                {`${bookmark.groups.length.toString()} selected`}
              </span>
            </span>
          </CommandItem>
        )}
        <CommandItem
          value="Change Newsletter"
          onSelect={() => onEnterMode("newsletter")}
        >
          <TagIcon />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span>Change Newsletter</span>
            <span className="text-xs text-muted-foreground">
              {bookmark.newsletter?.name ?? "None"}
            </span>
          </span>
        </CommandItem>
        {booleanProperties.map((p) => {
          const current
            = bookmark.booleanValues.find(v => v.propertyId === p.id)?.value
              ?? false;
          return (
            <CommandItem
              key={p.id}
              value={`Toggle ${p.name}`}
              onSelect={() => {
                updateBookmark.mutate({
                  id: bookmarkId,
                  input: {
                    booleanValues: [
                      ...bookmark.booleanValues.filter(
                        v => v.propertyId !== p.id,
                      ),
                      {
                        propertyId: p.id,
                        value: !current,
                      },
                    ],
                  },
                });
                onClose();
              }}
            >
              {current && <CheckIcon className="text-primary" />}
              <span className="flex min-w-0 flex-col gap-0.5">
                <span>{p.name}</span>
                <span className="text-xs text-muted-foreground">
                  {current ? "On" : "Off"}
                </span>
              </span>
            </CommandItem>
          );
        })}
        {choicesProperties.map((p) => {
          const current
            = bookmark.choicesValues.find(v => v.propertyId === p.id)?.values
              ?? [];
          return (
            <CommandItem
              key={p.id}
              value={`Set ${p.name}`}
              onSelect={() => onEnterChoicesMode(p.id)}
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span>
                  Set
                  {" "}
                  {p.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {current.length > 0 ? current.join(", ") : "None"}
                </span>
              </span>
            </CommandItem>
          );
        })}
        {ratingProperties.map((p) => {
          const current
            = bookmark.numberValues.find(v => v.propertyId === p.id)?.value
              ?? null;
          const max = p.ratingMax ?? 5;
          return (
            <CommandItem
              key={p.id}
              value={`Set ${p.name}`}
              onSelect={() => onEnterRatingMode(p.id)}
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span>
                  Set
                  {" "}
                  {p.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {current !== null
                    ? `${"★".repeat(current)}${"☆".repeat(max - current)}`
                    : "Not rated"}
                </span>
              </span>
            </CommandItem>
          );
        })}
        {editableProperties.map(p => (
          <CommandItem
            key={p.id}
            value={`Edit ${p.name}`}
            onSelect={onNavigateProperties}
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span>
                Edit
                {" "}
                {p.name}
              </span>
              <span className="text-xs text-muted-foreground">
                Opens properties tab
              </span>
            </span>
          </CommandItem>
        ))}
      </CommandGroup>
      <CommandSeparator />
    </>
  );
}

/**
 * The Card Display Rules that style the current/hovered bookmark's card, each linking to its View
 * page. Lets the user jump from "this card looks like X" to the rule(s) responsible. Rendered
 * alongside the bookmark taxonomies group whenever a card is hovered (or on a bookmark detail page).
 */
export function CardDisplayRulesGroup({
  rules,
  onSelect,
}: {
  rules: CardDisplayRule[];
  onSelect: (slug: string) => void;
}) {
  if (rules.length === 0) return null;
  return (
    <>
      <CommandGroup heading="Card Display Rules">
        {rules.map(rule => (
          <CommandItem
            key={rule.id}
            value={`Card display rule ${rule.name}`}
            disabled={!rule.slug}
            onSelect={() => rule.slug && onSelect(rule.slug)}
          >
            <LayoutGridIcon />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span>
                {rule.name}
                {rule.isDefault ? " (Default)" : ""}
              </span>
              <span className="text-xs text-muted-foreground">
                View display rule
              </span>
            </span>
          </CommandItem>
        ))}
      </CommandGroup>
      <CommandSeparator />
    </>
  );
}
