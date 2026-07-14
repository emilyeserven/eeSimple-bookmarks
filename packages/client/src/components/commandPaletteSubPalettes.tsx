import type { useBookmarkTaxonomyContext } from "./useBookmarkTaxonomyContext";
import type { Person, Bookmark, CustomProperty, Group } from "@eesimple/types";

import {
  Building2,
  CheckIcon,
  Clapperboard,
  FolderOpen,
  Mail,
  MapPin,
  Tags,
  UserRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { CategoryIcon } from "@/lib/icons";
import { CUSTOM_PROPERTY_TYPE_ICONS } from "@/lib/propertyFormat";

export { CategorySubPalette } from "./commandPaletteSubPalettes/CategorySubPalette";
export { ChoicesSubPalette } from "./commandPaletteSubPalettes/ChoicesSubPalette";
export { GroupsSubPalette } from "./commandPaletteSubPalettes/GroupsSubPalette";
export { LocationsSubPalette } from "./commandPaletteSubPalettes/LocationsSubPalette";
export { MediaTypeSubPalette } from "./commandPaletteSubPalettes/MediaTypeSubPalette";
export { NewsletterSubPalette } from "./commandPaletteSubPalettes/NewsletterSubPalette";
export { PeopleSubPalette } from "./commandPaletteSubPalettes/PeopleSubPalette";
export { RatingSubPalette } from "./commandPaletteSubPalettes/RatingSubPalette";
export { TagsSubPalette } from "./commandPaletteSubPalettes/TagsSubPalette";

export type TaxonomyMode = "category" | "media-type" | "tags" | "locations" | "people" | "groups" | "newsletter" | "choices-property" | "rating-property";

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
  const {
    t,
  } = useTranslation();
  const changeCategory = t("Change Category");
  const changeTags = t("Change Tags");
  const changeLocations = t("Change Locations");
  const changeMediaType = t("Change Media Type");
  const changePeople = t("Change People");
  const changeGroups = t("Change Groups");
  const changeNewsletter = t("Change Newsletter");
  const none = t("None");
  return (
    <>
      <CommandGroup
        heading={isBookmarkViewPage
          ? t("Bookmark Taxonomies")
          : t("Bookmark Taxonomies — {{title}}", {
            title: bookmark.title,
          })}
      >
        <CommandItem
          value={changeCategory}
          onSelect={() => onEnterMode("category")}
        >
          <FolderOpen />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span>{changeCategory}</span>
            <span className="text-xs text-muted-foreground">
              {currentCategoryName}
            </span>
          </span>
        </CommandItem>
        <CommandItem
          value={changeTags}
          onSelect={() => onEnterMode("tags")}
        >
          <Tags />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span>{changeTags}</span>
            <span className="text-xs text-muted-foreground">
              {t("{{count}} selected", {
                count: bookmark.tags.length,
              })}
            </span>
          </span>
        </CommandItem>
        <CommandItem
          value={changeLocations}
          onSelect={() => onEnterMode("locations")}
        >
          <MapPin />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span>{changeLocations}</span>
            <span className="text-xs text-muted-foreground">
              {t("{{count}} selected", {
                count: bookmark.locations.length,
              })}
            </span>
          </span>
        </CommandItem>
        <CommandItem
          value={changeMediaType}
          onSelect={() => onEnterMode("media-type")}
        >
          <Clapperboard />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span>{changeMediaType}</span>
            <span className="text-xs text-muted-foreground">
              {bookmark.mediaType?.name ?? none}
            </span>
          </span>
        </CommandItem>
        {people.length > 0 && (
          <CommandItem
            value={changePeople}
            onSelect={() => onEnterMode("people")}
          >
            <UserRound />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span>{changePeople}</span>
              <span className="text-xs text-muted-foreground">
                {t("{{count}} selected", {
                  count: bookmark.people.length,
                })}
              </span>
            </span>
          </CommandItem>
        )}
        {groups.length > 0 && (
          <CommandItem
            value={changeGroups}
            onSelect={() => onEnterMode("groups")}
          >
            <Building2 />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span>{changeGroups}</span>
              <span className="text-xs text-muted-foreground">
                {t("{{count}} selected", {
                  count: bookmark.groups.length,
                })}
              </span>
            </span>
          </CommandItem>
        )}
        <CommandItem
          value={changeNewsletter}
          onSelect={() => onEnterMode("newsletter")}
        >
          <Mail />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span>{changeNewsletter}</span>
            <span className="text-xs text-muted-foreground">
              {bookmark.newsletter?.name ?? none}
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
              value={t("Toggle {{name}}", {
                name: p.name,
              })}
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
              <CategoryIcon name={CUSTOM_PROPERTY_TYPE_ICONS[p.type]} />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span>{p.name}</span>
                <span className="text-xs text-muted-foreground">
                  {current ? t("On") : t("Off")}
                </span>
              </span>
              {current && <CheckIcon className="ml-auto text-primary" />}
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
              value={t("Set {{name}}", {
                name: p.name,
              })}
              onSelect={() => onEnterChoicesMode(p.id)}
            >
              <CategoryIcon name={CUSTOM_PROPERTY_TYPE_ICONS[p.type]} />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span>
                  {t("Set")}
                  {" "}
                  {p.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {current.length > 0 ? current.join(", ") : none}
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
              value={t("Set {{name}}", {
                name: p.name,
              })}
              onSelect={() => onEnterRatingMode(p.id)}
            >
              <CategoryIcon name={CUSTOM_PROPERTY_TYPE_ICONS[p.type]} />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span>
                  {t("Set")}
                  {" "}
                  {p.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {current !== null
                    ? `${"★".repeat(current)}${"☆".repeat(max - current)}`
                    : t("Not rated")}
                </span>
              </span>
            </CommandItem>
          );
        })}
        {editableProperties.map(p => (
          <CommandItem
            key={p.id}
            value={t("Edit {{name}}", {
              name: p.name,
            })}
            onSelect={onNavigateProperties}
          >
            <CategoryIcon name={CUSTOM_PROPERTY_TYPE_ICONS[p.type]} />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span>
                {t("Edit")}
                {" "}
                {p.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("Opens properties tab")}
              </span>
            </span>
          </CommandItem>
        ))}
      </CommandGroup>
      <CommandSeparator />
    </>
  );
}
