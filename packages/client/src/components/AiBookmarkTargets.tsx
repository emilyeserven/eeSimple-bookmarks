import type { ComboboxOption } from "./Combobox";
import type { AiBookmarkData } from "../hooks/useAiBookmarkData";
import type { AiBookmarkTargetMatchMode, AiBookmarkTargetSelection } from "../lib/aiBookmarkTargets";
import type { Bookmark } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { MultiCombobox } from "./MultiCombobox";
import { TagPicker } from "./TagPicker";
import { TreeMultiCombobox } from "./TreeMultiCombobox";
import { AI_TARGET_SOFT_WARNING_THRESHOLD } from "../lib/aiBookmarkTargets";
import { useBasketStore } from "../stores/basketStore";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
 * The slice of an AI targeting page's controller this card drives — deliberately narrow so both the
 * AI Bulk Edit and AI Prompt Builder controllers satisfy it without either depending on the other.
 */
export interface AiBookmarkTargetsController {
  data: AiBookmarkData;
  selection: AiBookmarkTargetSelection;
  setSelectionField: <K extends keyof AiBookmarkTargetSelection>(key: K, values: string[]) => void;
  matchMode: AiBookmarkTargetMatchMode;
  setMatchMode: (mode: AiBookmarkTargetMatchMode) => void;
  targets: Bookmark[];
}

/**
 * The Any/All switch over everything picked above. "Any" unions the selected items (the default);
 * "All" intersects them, so a bookmark must match every single selected item — two selected tags
 * mean "carries both", not "carries either". Radix clears a single-value toggle group when the
 * active item is pressed again, so an empty value is ignored rather than left unset.
 */
function MatchModeToggle({
  mode, onModeChange,
}: {
  mode: AiBookmarkTargetMatchMode;
  onModeChange: (mode: AiBookmarkTargetMatchMode) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-1.5">
      <Label>{t("Combine the selections above")}</Label>
      <ToggleGroup
        type="single"
        variant="outline"
        value={mode}
        onValueChange={(value) => {
          if (value === "any" || value === "all") onModeChange(value);
        }}
      >
        <ToggleGroupItem value="any">{t("Match any")}</ToggleGroupItem>
        <ToggleGroupItem value="all">{t("Match all")}</ToggleGroupItem>
      </ToggleGroup>
      <p className="text-xs text-muted-foreground">
        {mode === "all"
          ? t("Only bookmarks matching EVERY selected item — e.g. a bookmark in the selected category that also carries every selected tag.")
          : t("Bookmarks matching AT LEAST ONE selected item — every pick adds more bookmarks.")}
      </p>
    </div>
  );
}

/**
 * The shared Targets card of the AI action pages: an individual-bookmark multi-select plus the eight
 * taxonomy-group pickers (tree taxonomies match their whole subtree) and a saved-filter picker, with
 * a live targeted-bookmark count and a non-blocking size warning past the soft threshold.
 */
export function AiBookmarkTargets({
  controller,
}: {
  controller: AiBookmarkTargetsController;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data, selection, setSelectionField, matchMode, setMatchMode, targets,
  } = controller;
  const basketIds = useBasketStore(s => s.bookmarkIds);
  const pick = (key: keyof AiBookmarkTargetSelection) => (values: string[]) => setSelectionField(key, values);
  const bookmarkOptions: ComboboxOption[] = data.bookmarks.map(bookmark => ({
    value: bookmark.id,
    label: bookmark.title,
    names: bookmark.names,
  }));
  // Only basket ids that still resolve to a loaded bookmark, so the individual-picker chips stay
  // meaningful (a basketed-then-deleted bookmark simply drops out).
  const loadedIds = new Set(data.bookmarks.map(bookmark => bookmark.id));
  const basketTargetIds = basketIds.filter(id => loadedIds.has(id));

  function addBasketToSelection(): void {
    setSelectionField("bookmarkIds", [...new Set([...selection.bookmarkIds, ...basketTargetIds])]);
  }
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
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={basketTargetIds.length === 0}
            onClick={addBasketToSelection}
          >
            {t("Use Basket ({{count}})", {
              count: basketTargetIds.length,
            })}
          </Button>
          <span className="text-xs text-muted-foreground">
            {t("Add the bookmarks currently in your Tab Basket.")}
          </span>
        </div>
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
        <PickerField label={t("Saved filters")}>
          <MultiCombobox
            options={nameOptions(data.savedFilters)}
            values={selection.savedFilterIds}
            onValuesChange={pick("savedFilterIds")}
            placeholder={t("Every bookmark a saved filter matches…")}
          />
        </PickerField>
      </div>
      <MatchModeToggle
        mode={matchMode}
        onModeChange={setMatchMode}
      />
      <p className="text-sm font-medium">
        {t("{{count}} bookmarks selected", {
          count: targets.length,
        })}
      </p>
      {targets.length > AI_TARGET_SOFT_WARNING_THRESHOLD && (
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
