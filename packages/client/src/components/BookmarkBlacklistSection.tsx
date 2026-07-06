import type { useBookmarkGeneralForm } from "./useBookmarkGeneralForm";

import { useTranslation } from "react-i18next";

import { GatedTagPicker } from "./BookmarkTagsField";
import { LocationPicker } from "./LocationPicker";

import { Label } from "@/components/ui/label";

type Ctrl = ReturnType<typeof useBookmarkGeneralForm>;

/** The Advanced section's exclusion fields: tag blacklist and location blacklist. */
export function BookmarkBlacklistSection({
  ctrl,
}: { ctrl: Ctrl }) {
  const {
    t,
  } = useTranslation();
  const {
    form,
    tagTree,
    locationTree,
    saveBlacklistedTagIds,
    saveBlacklistedLocationIds,
  } = ctrl;
  return (
    <div
      className="
        grid gap-4
        md:grid-cols-2
      "
    >
      <form.Subscribe selector={state => state.values.categoryId}>
        {categoryId => (
          <form.Field name="blacklistedTagIds">
            {field => (
              <GatedTagPicker
                categoryId={categoryId}
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
        )}
      </form.Subscribe>

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
    </div>
  );
}
