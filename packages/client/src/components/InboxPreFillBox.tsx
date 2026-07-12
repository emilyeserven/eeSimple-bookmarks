import type { InboxPreFillDefaults } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { Combobox } from "./Combobox";
import { InboxPreFillModals } from "./InboxPreFillModals";
import { InboxPreFillTags } from "./InboxPreFillTags";
import { InboxPropertyField } from "./InboxPropertyField";
import { MultiCombobox } from "./MultiCombobox";
import { TreeCombobox } from "./TreeCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useInboxPreFillBox } from "./useInboxPreFillBox";

import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { isPreFillEmpty } from "@/lib/inboxPreFill";

/**
 * A compact card rendered above the Pending list. Sets batch-level defaults applied when any inbox
 * item is approved. All fields are optional; empty pre-fill is silently a no-op at approve time.
 */
export function InboxPreFillBox({
  preFill,
  setPreFill,
  onReset,
}: {
  preFill: InboxPreFillDefaults;
  setPreFill: (preFill: InboxPreFillDefaults) => void;
  onReset: () => void;
}) {
  const {
    t,
  } = useTranslation();
  const {
    addPersonOpen,
    setAddPersonOpen,
    tagTree,
    mediaTypeTree,
    people,
    inboxProperties,
    categoryOptions,
    mediaTypeOptions,
    personOptions,
    selectedTagNames,
  } = useInboxPreFillBox(preFill);

  const categoryCreate = useEntityCreateOption("category", c => setPreFill({
    ...preFill,
    categoryId: c.id,
  }));
  const mediaTypeCreate = useEntityCreateOption("media-type", m => setPreFill({
    ...preFill,
    mediaTypeId: m.id,
  }));

  const selectedPersonIds = preFill.personIds ?? [];
  const isEmpty = isPreFillEmpty(preFill);

  return (
    <>
      <RowCard className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{t("Defaults for approved bookmarks")}</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-auto px-2 py-0.5 text-xs text-muted-foreground"
              disabled={isEmpty}
              onClick={onReset}
            >
              {t("Reset all")}
            </Button>
          </div>

          <div
            className="
              grid grid-cols-1 gap-3
              sm:grid-cols-2
              lg:grid-cols-3
            "
          >
            {/* Category */}
            <div className="space-y-1">
              <Label className="text-sm">{t("Category")}</Label>
              <Combobox
                options={categoryOptions}
                value={preFill.categoryId ?? undefined}
                onValueChange={val => setPreFill({
                  ...preFill,
                  categoryId: val ?? null,
                })}
                placeholder={t("Any category")}
                searchPlaceholder={t("Search categories…")}
                emptyText={t("No categories.")}
                aria-label={t("Default category")}
                createOption={categoryCreate.createOption}
              />
            </div>

            {/* Media Type */}
            {mediaTypeTree.length > 0 && (
              <div className="space-y-1">
                <Label className="text-sm">{t("Media Type")}</Label>
                <TreeCombobox
                  options={mediaTypeOptions}
                  value={preFill.mediaTypeId ?? undefined}
                  onValueChange={val => setPreFill({
                    ...preFill,
                    mediaTypeId: val ?? null,
                  })}
                  placeholder={t("Any media type")}
                  searchPlaceholder={t("Search media types…")}
                  emptyText={t("No media types.")}
                  aria-label={t("Default media type")}
                  createOption={mediaTypeCreate.createOption}
                />
              </div>
            )}

            {/* People */}
            {people.length > 0 && (
              <div className="space-y-1">
                <Label className="text-sm">{t("People")}</Label>
                <MultiCombobox
                  options={personOptions}
                  values={selectedPersonIds}
                  onValuesChange={vals => setPreFill({
                    ...preFill,
                    personIds: vals,
                  })}
                  placeholder={t("Any people")}
                  searchPlaceholder={t("Search people…")}
                  emptyText={t("No people.")}
                  aria-label={t("Default people")}
                  createOption={{
                    label: t("Create person"),
                    onSelect: () => setAddPersonOpen(true),
                  }}
                />
              </div>
            )}

            {/* Per-property inbox fields */}
            {inboxProperties.map(property => (
              <InboxPropertyField
                key={property.id}
                property={property}
                preFill={preFill}
                setPreFill={setPreFill}
              />
            ))}
          </div>

          {/* Tags — full-width since the TreeMultiCombobox is wider */}
          <InboxPreFillTags
            tree={tagTree}
            preFill={preFill}
            setPreFill={setPreFill}
            selectedTagNames={selectedTagNames}
          />
        </div>
      </RowCard>
      {categoryCreate.modal}
      {mediaTypeCreate.modal}
      <InboxPreFillModals
        preFill={preFill}
        setPreFill={setPreFill}
        addPersonOpen={addPersonOpen}
        setAddPersonOpen={setAddPersonOpen}
      />
    </>
  );
}
