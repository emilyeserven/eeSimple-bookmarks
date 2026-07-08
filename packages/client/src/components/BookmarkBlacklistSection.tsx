import type { useBookmarkGeneralForm } from "./useBookmarkGeneralForm";

import { useTranslation } from "react-i18next";

import { BookmarkTagsField } from "./BookmarkTagsField";
import { LocationPicker } from "./LocationPicker";

import { Label } from "@/components/ui/label";

type Ctrl = ReturnType<typeof useBookmarkGeneralForm>;

/** The Advanced section's **Tag blacklist** field — a standalone placeable field (#1163). */
export function BookmarkTagBlacklistField({
  ctrl,
}: { ctrl: Ctrl }) {
  const {
    t,
  } = useTranslation();
  const {
    form,
    tagTree,
    saveBlacklistedTagIds,
  } = ctrl;
  return (
    <form.Field name="blacklistedTagIds">
      {field => (
        <BookmarkTagsField
          tree={tagTree ?? []}
          selectedIds={field.state.value}
          onToggle={(id) => {
            const current = field.state.value;
            const next = current.includes(id)
              ? current.filter(tagId => tagId !== id)
              : [...current, id];
            field.handleChange(next);
            saveBlacklistedTagIds(next);
          }}
          label={t("Tag blacklist")}
          description={t("Tags toggled here will never be auto-applied by autofill rules.")}
        />
      )}
    </form.Field>
  );
}

/** The Advanced section's **Location blacklist** field — a standalone placeable field (#1163). */
export function BookmarkLocationBlacklistField({
  ctrl,
}: { ctrl: Ctrl }) {
  const {
    t,
  } = useTranslation();
  const {
    form,
    locationTree,
    saveBlacklistedLocationIds,
  } = ctrl;
  return (
    <form.Field name="blacklistedLocationIds">
      {field => (
        <div className="space-y-1">
          <Label>{t("Location blacklist")}</Label>
          <p className="text-xs text-muted-foreground">
            {t("Locations toggled here will never be auto-applied by autofill rules.")}
          </p>
          <LocationPicker
            tree={locationTree ?? []}
            selectedIds={field.state.value}
            onToggle={(id) => {
              const current = field.state.value;
              const next = current.includes(id)
                ? current.filter(locationId => locationId !== id)
                : [...current, id];
              field.handleChange(next);
              saveBlacklistedLocationIds(next);
            }}
          />
        </div>
      )}
    </form.Field>
  );
}

/**
 * The Advanced section's exclusion fields: tag blacklist and location blacklist. Recomposed from the two
 * halves above so the recomposed `BookmarkGeneralForm` (its story/test) stays unchanged.
 */
export function BookmarkBlacklistSection({
  ctrl,
}: { ctrl: Ctrl }) {
  return (
    <div
      className="
        grid gap-4
        md:grid-cols-2
      "
    >
      <BookmarkTagBlacklistField ctrl={ctrl} />
      <BookmarkLocationBlacklistField ctrl={ctrl} />
    </div>
  );
}
