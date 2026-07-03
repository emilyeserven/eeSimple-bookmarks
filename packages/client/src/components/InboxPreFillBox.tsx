import type { InboxPreFillDefaults } from "@eesimple/types";

import { Combobox } from "./Combobox";
import { InboxPreFillModals } from "./InboxPreFillModals";
import { InboxPreFillTags } from "./InboxPreFillTags";
import { InboxPropertyField } from "./InboxPropertyField";
import { MultiCombobox } from "./MultiCombobox";
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
    addPersonOpen,
    setAddPersonOpen,
    tagTree,
    mediaTypeTree,
    people,
    publishers,
    inboxProperties,
    categoryOptions,
    mediaTypeOptions,
    personOptions,
    publisherOptions,
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
  const publisherCreate = useEntityCreateOption("publisher", p => setPreFill({
    ...preFill,
    publisherId: p.id,
  }));

  const selectedPersonIds = preFill.personIds ?? [];
  const isEmpty = isPreFillEmpty(preFill);

  return (
    <>
      <RowCard className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Defaults for approved bookmarks</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-auto px-2 py-0.5 text-xs text-muted-foreground"
              disabled={isEmpty}
              onClick={onReset}
            >
              Reset all
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
              <Label className="text-sm">Category</Label>
              <Combobox
                options={categoryOptions}
                value={preFill.categoryId ?? undefined}
                onValueChange={val => setPreFill({
                  ...preFill,
                  categoryId: val ?? null,
                })}
                placeholder="Any category"
                searchPlaceholder="Search categories…"
                emptyText="No categories."
                aria-label="Default category"
                createOption={categoryCreate.createOption}
              />
            </div>

            {/* Media Type */}
            {mediaTypeTree.length > 0 && (
              <div className="space-y-1">
                <Label className="text-sm">Media Type</Label>
                <Combobox
                  options={mediaTypeOptions}
                  value={preFill.mediaTypeId ?? undefined}
                  onValueChange={val => setPreFill({
                    ...preFill,
                    mediaTypeId: val ?? null,
                  })}
                  placeholder="Any media type"
                  searchPlaceholder="Search media types…"
                  emptyText="No media types."
                  aria-label="Default media type"
                  createOption={mediaTypeCreate.createOption}
                />
              </div>
            )}

            {/* Publisher */}
            {publishers.length > 0 && (
              <div className="space-y-1">
                <Label className="text-sm">Publisher</Label>
                <Combobox
                  options={publisherOptions}
                  value={preFill.publisherId ?? undefined}
                  onValueChange={val => setPreFill({
                    ...preFill,
                    publisherId: val ?? null,
                  })}
                  placeholder="Any publisher"
                  searchPlaceholder="Search publishers…"
                  emptyText="No publishers."
                  aria-label="Default publisher"
                  createOption={publisherCreate.createOption}
                />
              </div>
            )}

            {/* People */}
            {people.length > 0 && (
              <div className="space-y-1">
                <Label className="text-sm">People</Label>
                <MultiCombobox
                  options={personOptions}
                  values={selectedPersonIds}
                  onValuesChange={vals => setPreFill({
                    ...preFill,
                    personIds: vals,
                  })}
                  placeholder="Any people"
                  searchPlaceholder="Search people…"
                  emptyText="No people."
                  aria-label="Default people"
                  createOption={{
                    label: "Create person",
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
      {publisherCreate.modal}
      <InboxPreFillModals
        preFill={preFill}
        setPreFill={setPreFill}
        addPersonOpen={addPersonOpen}
        setAddPersonOpen={setAddPersonOpen}
      />
    </>
  );
}
