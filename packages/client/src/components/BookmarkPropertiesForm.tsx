import type { Bookmark } from "@eesimple/types";

import { propertyAppliesToCategory, propertyAppliesToMediaType } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { CategoryCustomFields } from "./BookmarkCustomFields";
import { BookmarkYouTubeMetadataFields } from "./BookmarkYouTubeMetadataFields";
import { useBookmarkPropertiesForm } from "./useBookmarkPropertiesForm";
import { usePropertyGroups } from "../hooks/usePropertyGroups";
import { groupAppliesToBookmark } from "../lib/bookmarkPropertyGroups";

import { RowCard } from "@/components/ui/card";

interface BookmarkPropertiesFormProps {
  bookmark: Bookmark;
}

/** Edit a bookmark's custom property values, organized into property-group cards. */
export function BookmarkPropertiesForm({
  bookmark,
}: BookmarkPropertiesFormProps) {
  const {
    t,
  } = useTranslation();
  const {
    customProperties,
    fetchMetadata,
    numberInputs,
    booleanInputs,
    dateTimeInputs,
    choicesInputs,
    progressInputs,
    sectionsInputs,
    textInputs,
    handleNumberChange,
    handleBooleanChange,
    handleDateTimeChange,
    handleChoicesChange,
    handleProgressChange,
    handleSectionsChange,
    handleTextChange,
    canImportSections,
    handleSectionsImport,
    isSectionsImportPending,
    runtimeProp,
    datePostedProp,
    isYouTubeBookmark,
    builtInHiddenSlugs,
    hasEditable,
  } = useBookmarkPropertiesForm(bookmark);

  const {
    data: propertyGroups,
  } = usePropertyGroups();

  if (!hasEditable) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("No custom properties are assigned to this bookmark's category.")}
      </p>
    );
  }

  // Determine which property groups have applicable properties for this bookmark.
  const applicableProperties = customProperties.filter(p =>
    p.enabled
    && !p.hiddenFromForm
    && !builtInHiddenSlugs.includes(p.slug)
    && (propertyAppliesToCategory(p, bookmark.categoryId ?? "")
      || propertyAppliesToMediaType(p, bookmark.mediaType?.id ?? null)));
  const knownGroupIds = new Set((propertyGroups ?? []).map(g => g.id));
  const sortedGroups = [...(propertyGroups ?? [])].sort(
    (a, b) => a.priority - b.priority || a.name.localeCompare(b.name),
  );
  // A group's card shows only when its category/media-type scope matches this bookmark (an unscoped
  // group matches everything) and it has at least one applicable property.
  const groupsWithProperties = sortedGroups.filter(g =>
    groupAppliesToBookmark(g, bookmark)
    && applicableProperties.some(p => p.propertyGroupId === g.id));
  const hasUngrouped = applicableProperties.some(
    p => p.propertyGroupId === null || !knownGroupIds.has(p.propertyGroupId),
  );

  const fieldProps = {
    placement: "all" as const,
    layout: "stack" as const,
    categoryId: bookmark.categoryId ?? "",
    mediaTypeId: bookmark.mediaType?.id ?? null,
    properties: customProperties,
    bookmark,
    hiddenSlugs: builtInHiddenSlugs,
    numberInputs,
    booleanInputs,
    dateTimeInputs,
    choicesInputs,
    progressInputs,
    sectionsInputs,
    textInputs,
    onNumberChange: handleNumberChange,
    onBooleanChange: handleBooleanChange,
    onDateTimeChange: handleDateTimeChange,
    onChoicesChange: handleChoicesChange,
    onProgressChange: handleProgressChange,
    onSectionsChange: handleSectionsChange,
    onTextChange: handleTextChange,
    // The Page Sections ToC import — offered only when the Kavita connector is enabled and the
    // bookmark is linked to a series (the field itself additionally slug-gates the button).
    onSectionsImport: canImportSections ? (propertyId: string) => void handleSectionsImport(propertyId) : undefined,
    isSectionsImportPending,
  };

  return (
    <div className="space-y-4">
      {(runtimeProp || datePostedProp) && isYouTubeBookmark && (
        <RowCard className="p-4">
          <BookmarkYouTubeMetadataFields
            bookmark={bookmark}
            fetchMetadata={fetchMetadata}
            runtimeProp={runtimeProp}
            datePostedProp={datePostedProp}
            numberInputs={numberInputs}
            dateTimeInputs={dateTimeInputs}
            onNumberChange={handleNumberChange}
            onDateTimeChange={handleDateTimeChange}
          />
        </RowCard>
      )}
      {groupsWithProperties.map(group => (
        <RowCard
          key={group.id}
          className="space-y-4 p-4"
        >
          <p className="text-sm font-medium">{group.name}</p>
          <CategoryCustomFields
            {...fieldProps}
            groupId={group.id}
            hideHeading
          />
        </RowCard>
      ))}
      {hasUngrouped && (
        <RowCard className="space-y-4 p-4">
          <p className="text-sm font-medium">{t("Properties")}</p>
          <CategoryCustomFields
            {...fieldProps}
            groupId={null}
            hideHeading
          />
        </RowCard>
      )}
    </div>
  );
}
