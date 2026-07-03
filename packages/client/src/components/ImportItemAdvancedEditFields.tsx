import type { ImportItemAdvancedEditState } from "./useImportItemAdvancedEdit";

import { Combobox } from "./Combobox";
import { LocationPicker } from "./LocationPicker";
import { MultiCombobox } from "./MultiCombobox";
import { TagPicker } from "./TagPicker";
import { iconComboboxOptions, mediaTypeTreeComboboxOptions } from "../lib/comboboxOptions";

import { Label } from "@/components/ui/label";

interface ImportItemAdvancedEditFieldsProps {
  state: ImportItemAdvancedEditState;
  categoryId: string | undefined;
  mediaTypeId: string | undefined;
  tagIds: string[];
  locationIds: string[];
  personIds: string[];
  publisherId: string | undefined;
  onCategoryChange: (id: string | undefined) => void;
  onMediaTypeChange: (id: string | undefined) => void;
  onPeopleChange: (ids: string[]) => void;
  onPublisherChange: (id: string | undefined) => void;
}

/** The taxonomy field rows (category, media type, tags, locations, people, publisher) + the
 * matched-website / YouTube info line shown inside {@link ImportItemAdvancedEdit}'s collapsible. */
export function ImportItemAdvancedEditFields({
  state,
  categoryId,
  mediaTypeId,
  tagIds,
  locationIds,
  personIds,
  publisherId,
  onCategoryChange,
  onMediaTypeChange,
  onPeopleChange,
  onPublisherChange,
}: ImportItemAdvancedEditFieldsProps) {
  const {
    categories,
    mediaTypeTree,
    tagTree,
    locationTree,
    people,
    publishers,
    matchedWebsite,
    isYouTube,
    handleTagToggle,
    handleLocationToggle,
    addModalState,
    categoryCreate,
    mediaTypeCreate,
    publisherCreate,
    locationCreate,
  } = state;

  return (
    <>
      <div className="space-y-1">
        <Label className="text-xs">Category</Label>
        <Combobox
          options={iconComboboxOptions(categories)}
          value={categoryId}
          onValueChange={onCategoryChange}
          placeholder="No category"
          searchPlaceholder="Search categories…"
          emptyText="No categories found."
          createOption={categoryCreate.createOption}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Media type</Label>
        <Combobox
          options={mediaTypeTreeComboboxOptions(mediaTypeTree)}
          value={mediaTypeId}
          onValueChange={onMediaTypeChange}
          placeholder="No media type"
          searchPlaceholder="Search media types…"
          emptyText="No media types found."
          createOption={mediaTypeCreate.createOption}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Tags</Label>
        <TagPicker
          tree={tagTree}
          selectedIds={tagIds}
          onToggle={handleTagToggle}
          createOption={{
            label: "Create tag",
            onSelect: () => addModalState.setAddTagOpen(true),
          }}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Locations</Label>
        <LocationPicker
          tree={locationTree}
          selectedIds={locationIds}
          onToggle={handleLocationToggle}
          createOption={locationCreate.createOption}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">People</Label>
        <MultiCombobox
          options={people.map(a => ({
            value: a.id,
            label: a.name,
            searchAlias: a.romanizedName ?? undefined,
          }))}
          values={personIds}
          onValuesChange={onPeopleChange}
          placeholder="Select people…"
          searchPlaceholder="Search people…"
          emptyText="No people found."
          createOption={{
            label: "Create person",
            onSelect: () => addModalState.setAddPersonOpen(true),
          }}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Publisher</Label>
        <Combobox
          options={publishers.map(p => ({
            value: p.id,
            label: p.name,
            searchAlias: p.romanizedName ?? undefined,
          }))}
          value={publisherId}
          onValueChange={onPublisherChange}
          placeholder="No publisher"
          searchPlaceholder="Search publishers…"
          emptyText="No publishers found."
          createOption={publisherCreate.createOption}
        />
      </div>

      {(matchedWebsite || isYouTube) && (
        <div
          className="
            flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground
          "
        >
          {matchedWebsite && (
            <span>
              Website:
              {" "}
              <span className="font-medium">{matchedWebsite.siteName}</span>
            </span>
          )}
          {isYouTube && <span>YouTube video</span>}
        </div>
      )}
    </>
  );
}
