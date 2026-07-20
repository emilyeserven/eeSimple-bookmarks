import type { ComboboxOption } from "./Combobox";
import type { AiBulkEditController } from "../hooks/useAiBulkEdit";
import type { AiBulkEditSelection } from "../lib/aiBulkEdit";

import { useTranslation } from "react-i18next";

import { MultiCombobox } from "./MultiCombobox";
import { TagPicker } from "./TagPicker";
import { TreeMultiCombobox } from "./TreeMultiCombobox";
import { AI_BULK_EDIT_SOFT_WARNING_THRESHOLD } from "../lib/aiBulkEdit";

import { Label } from "@/components/ui/label";
import { categoryComboboxOptions, genreMoodTreeComboboxOptions, mediaTypeNodesToOptions } from "@/lib/comboboxOptions";

/** A labeled picker row of the Targets card. */
function PickerField({
  label, children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/** Plain name options for the flat entity lists without a dedicated builder. */
function nameOptions(items: { id: string;
  name: string; }[]): ComboboxOption[] {
  return items.map(item => ({
    value: item.id,
    label: item.name,
  }));
}

/**
 * The Targets card of the AI Bulk Edit page: an individual-bookmark multi-select plus the eight
 * taxonomy-group pickers (tree taxonomies match their whole subtree), with a live targeted-bookmark
 * count and a non-blocking size warning past the soft threshold.
 */
export function AiBulkEditTargets({
  controller,
}: {
  controller: AiBulkEditController;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data, selection, setSelectionField, targets,
  } = controller;
  const pick = (key: keyof AiBulkEditSelection) => (values: string[]) => setSelectionField(key, values);
  const bookmarkOptions: ComboboxOption[] = data.bookmarks.map(bookmark => ({
    value: bookmark.id,
    label: bookmark.title,
    names: bookmark.names,
  }));
  const websiteOptions: ComboboxOption[] = data.websites.map(website => ({
    value: website.id,
    label: website.siteName,
  }));
  return (
    <div className="space-y-4">
      <PickerField label={t("Individual bookmarks")}>
        <MultiCombobox
          options={bookmarkOptions}
          values={selection.bookmarkIds}
          onValuesChange={pick("bookmarkIds")}
          placeholder={t("Select bookmarks…")}
          searchPlaceholder={t("Search bookmarks…")}
        />
      </PickerField>
      <div
        className="
          grid gap-4
          sm:grid-cols-2
        "
      >
        <PickerField label={t("Categories")}>
          <MultiCombobox
            options={categoryComboboxOptions(data.categories)}
            values={selection.categoryIds}
            onValuesChange={pick("categoryIds")}
            placeholder={t("All bookmarks in a category…")}
          />
        </PickerField>
        <PickerField label={t("Tags (including sub-tags)")}>
          <TagPicker
            tree={data.trees.tagTree ?? []}
            selectedIds={selection.tagIds}
            onToggle={(id) => {
              const next = selection.tagIds.includes(id)
                ? selection.tagIds.filter(existing => existing !== id)
                : [...selection.tagIds, id];
              setSelectionField("tagIds", next);
            }}
          />
        </PickerField>
        <PickerField label={t("Media types (including sub-types)")}>
          <TreeMultiCombobox
            options={mediaTypeNodesToOptions(data.trees.mediaTypeTree ?? [])}
            values={selection.mediaTypeIds}
            onValuesChange={pick("mediaTypeIds")}
            placeholder={t("All bookmarks with a media type…")}
          />
        </PickerField>
        <PickerField label={t("Websites")}>
          <MultiCombobox
            options={websiteOptions}
            values={selection.websiteIds}
            onValuesChange={pick("websiteIds")}
            placeholder={t("All bookmarks from a website…")}
          />
        </PickerField>
        <PickerField label={t("YouTube channels")}>
          <MultiCombobox
            options={nameOptions(data.youtubeChannels)}
            values={selection.youtubeChannelIds}
            onValuesChange={pick("youtubeChannelIds")}
            placeholder={t("All bookmarks from a channel…")}
          />
        </PickerField>
        <PickerField label={t("People")}>
          <MultiCombobox
            options={nameOptions(data.people)}
            values={selection.personIds}
            onValuesChange={pick("personIds")}
            placeholder={t("All bookmarks crediting a person…")}
          />
        </PickerField>
        <PickerField label={t("Groups")}>
          <MultiCombobox
            options={nameOptions(data.groups)}
            values={selection.groupIds}
            onValuesChange={pick("groupIds")}
            placeholder={t("All bookmarks crediting a group…")}
          />
        </PickerField>
        <PickerField label={t("Genres & Moods (including sub-entries)")}>
          <MultiCombobox
            options={genreMoodTreeComboboxOptions(data.trees.genreMoodTree ?? [])}
            values={selection.genreMoodIds}
            onValuesChange={pick("genreMoodIds")}
            placeholder={t("All bookmarks with a genre/mood…")}
          />
        </PickerField>
      </div>
      <p className="text-sm font-medium">
        {t("{{count}} bookmarks selected", {
          count: targets.length,
        })}
      </p>
      {targets.length > AI_BULK_EDIT_SOFT_WARNING_THRESHOLD && (
        <p
          className="
            text-sm text-amber-600
            dark:text-amber-500
          "
        >
          {t("That's a lot of bookmarks for one prompt — the generated prompt and the AI's reply will be long. Consider narrowing the selection.")}
        </p>
      )}
    </div>
  );
}
