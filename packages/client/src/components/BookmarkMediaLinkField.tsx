import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { ComboboxOption } from "./Combobox";

import { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

import { AddMediaBookmarkModal } from "./AddMediaBookmarkModal";
import { Combobox } from "./Combobox";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useRelationshipTypes } from "@/hooks/useRelationshipTypes";

interface BookmarkMediaLinkFieldProps {
  form: BookmarkFormApi;
}

/**
 * Create-form field for staging a relationship to a media bookmark (e.g. "this new YouTube
 * analysis is About Parasite") instead of the retired scalar-FK picker. Stages a single optional
 * `mediaLinkTarget` into form state; `useBookmarkFormHandlers`'s `submitForm` turns it into an
 * `updateBookmarkRelationships` call once the new bookmark exists. Defaults the relationship type
 * to the built-in "About" (subject/media item = parent), hiding the parent/child toggle unless the
 * user picks a different directional type — the common case is a single combobox pick.
 */
export function BookmarkMediaLinkField({
  form,
}: BookmarkMediaLinkFieldProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: allBookmarks,
  } = useBookmarks();
  const {
    data: relationshipTypes,
  } = useRelationshipTypes();
  const [createOpen, setCreateOpen] = useState(false);

  const aboutTypeId = useMemo(
    () => (relationshipTypes ?? []).find(rt => rt.name === "About")?.id,
    [relationshipTypes],
  );
  const directionalTypeIds = useMemo(
    () => new Set((relationshipTypes ?? []).filter(rt => rt.directional).map(rt => rt.id)),
    [relationshipTypes],
  );

  const bookmarkOptions: ComboboxOption[] = (allBookmarks ?? []).map(b => ({
    value: b.id,
    label: b.title,
  }));
  // `aboutTypeId`/`directionalTypeIds` above stay unfiltered (identity default + direction resolution);
  // only the visible option list drops hidden types.
  const typeOptions: ComboboxOption[] = (relationshipTypes ?? [])
    .filter(rt => !rt.hidden)
    .map(rt => ({
      value: rt.id,
      label: rt.name,
    }));

  return (
    <form.Field name="mediaLinkTarget">
      {(field) => {
        const target = field.state.value;
        const directional = target ? directionalTypeIds.has(target.relationshipTypeId) : false;
        const showParentToggle = directional && target?.relationshipTypeId !== aboutTypeId;

        return (
          <div className="space-y-2">
            <Label>{t("Media link")}</Label>
            <Combobox
              options={bookmarkOptions}
              value={target?.bookmarkId}
              onValueChange={(value) => {
                if (!value) {
                  field.handleChange(null);
                  return;
                }
                field.handleChange({
                  bookmarkId: value,
                  relationshipTypeId: target?.relationshipTypeId ?? aboutTypeId ?? "",
                  direction: target?.direction ?? "parent",
                });
              }}
              placeholder={t("No media link")}
              searchPlaceholder={t("Search bookmarks…")}
              emptyText={t("No bookmarks found.")}
              aria-label={t("Media bookmark")}
              createOption={{
                label: t("Create media bookmark…"),
                onSelect: () => setCreateOpen(true),
              }}
            />
            {target
              ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Combobox
                    options={typeOptions}
                    value={target.relationshipTypeId || undefined}
                    onValueChange={value => field.handleChange({
                      ...target,
                      relationshipTypeId: value ?? "",
                    })}
                    placeholder={t("Relationship type…")}
                    searchPlaceholder={t("Search types…")}
                    emptyText={t("No relationship types.")}
                    aria-label={t("Relationship type")}
                    className="w-auto"
                  />
                  {showParentToggle
                    ? (
                      <label
                        className="
                          flex items-center gap-2 text-sm text-muted-foreground
                        "
                      >
                        <Checkbox
                          checked={target.direction === "parent"}
                          onCheckedChange={checked => field.handleChange({
                            ...target,
                            direction: checked === true ? "parent" : "child",
                          })}
                          aria-label={t("The selected bookmark is the parent")}
                        />
                        {t("Selected bookmark is the parent")}
                      </label>
                    )
                    : null}
                </div>
              )
              : null}
            <AddMediaBookmarkModal
              open={createOpen}
              onOpenChange={setCreateOpen}
              onCreated={(bookmark) => {
                field.handleChange({
                  bookmarkId: bookmark.id,
                  relationshipTypeId: target?.relationshipTypeId ?? aboutTypeId ?? "",
                  direction: target?.direction ?? "parent",
                });
              }}
            />
          </div>
        );
      }}
    </form.Field>
  );
}
