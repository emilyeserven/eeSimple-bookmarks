import type { ImportItemAdvancedEditState } from "./useImportItemAdvancedEdit";

import { useTranslation } from "react-i18next";

import { BookmarkTagsField } from "./BookmarkTagsField";
import { Combobox } from "./Combobox";
import { LocationPicker } from "./LocationPicker";
import { MultiCombobox } from "./MultiCombobox";
import { TreeCombobox } from "./TreeCombobox";
import { useBuiltInName } from "../lib/builtInName";
import { categoryComboboxOptions, mediaTypeNodesToOptions } from "../lib/comboboxOptions";
import { buildSearchAlias } from "../lib/searchAlias";

import { Label } from "@/components/ui/label";

interface ImportItemAdvancedEditFieldsProps {
  state: ImportItemAdvancedEditState;
  categoryId: string | undefined;
  mediaTypeId: string | undefined;
  tagIds: string[];
  locationIds: string[];
  personIds: string[];
  onCategoryChange: (id: string | undefined) => void;
  onMediaTypeChange: (id: string | undefined) => void;
  onPeopleChange: (ids: string[]) => void;
}

/** The taxonomy field rows (category, media type, tags, locations, people) + the
 * matched-website / YouTube info line shown inside {@link ImportItemAdvancedEdit}'s collapsible. */
export function ImportItemAdvancedEditFields({
  state,
  categoryId,
  mediaTypeId,
  tagIds,
  locationIds,
  personIds,
  onCategoryChange,
  onMediaTypeChange,
  onPeopleChange,
}: ImportItemAdvancedEditFieldsProps) {
  const {
    t,
  } = useTranslation();
  const {
    categories,
    mediaTypeTree,
    tagTree,
    locationTree,
    people,
    matchedWebsite,
    isYouTube,
    handleTagToggle,
    handleLocationToggle,
    addModalState,
    categoryCreate,
    mediaTypeCreate,
    locationCreate,
  } = state;
  const builtInName = useBuiltInName();

  return (
    <>
      <div className="space-y-1">
        <Label className="text-xs">{t("Category")}</Label>
        <Combobox
          options={categoryComboboxOptions(categories)}
          value={categoryId}
          onValueChange={onCategoryChange}
          placeholder={t("No category")}
          searchPlaceholder={t("Search categories…")}
          emptyText={t("No categories found.")}
          createOption={categoryCreate.createOption}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">{t("Media type")}</Label>
        <TreeCombobox
          options={mediaTypeNodesToOptions(mediaTypeTree, builtInName)}
          value={mediaTypeId}
          onValueChange={onMediaTypeChange}
          placeholder={t("No media type")}
          searchPlaceholder={t("Search media types…")}
          emptyText={t("No media types found.")}
          createOption={mediaTypeCreate.createOption}
        />
      </div>

      <BookmarkTagsField
        tree={tagTree}
        selectedIds={tagIds}
        onToggle={handleTagToggle}
        createOption={{
          label: t("Create tag"),
          onSelect: () => addModalState.setAddTagOpen(true),
        }}
      />

      <div className="space-y-1">
        <Label className="text-xs">{t("Locations")}</Label>
        <LocationPicker
          tree={locationTree}
          selectedIds={locationIds}
          onToggle={handleLocationToggle}
          createOption={locationCreate.createOption}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">{t("People")}</Label>
        <MultiCombobox
          options={people.map(a => ({
            value: a.id,
            label: a.name,
            searchAlias: buildSearchAlias(a.names),
          }))}
          values={personIds}
          onValuesChange={onPeopleChange}
          placeholder={t("Select people…")}
          searchPlaceholder={t("Search people…")}
          emptyText={t("No people found.")}
          createOption={{
            label: t("Create person"),
            onSelect: () => addModalState.setAddPersonOpen(true),
          }}
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
              {t("Website:")}
              {" "}
              <span className="font-medium">{matchedWebsite.siteName}</span>
            </span>
          )}
          {isYouTube && <span>{t("YouTube video")}</span>}
        </div>
      )}
    </>
  );
}
