import type { CustomProperty, InboxPreFillDefaults, TagNode } from "@eesimple/types";

import { useState } from "react";

import { X } from "lucide-react";

import { AddAuthorModal } from "./AddAuthorModal";
import { AddCategoryModal } from "./AddCategoryModal";
import { AddMediaTypeModal } from "./AddMediaTypeModal";
import { AddPublisherModal } from "./AddPublisherModal";
import { Combobox } from "./Combobox";
import { MultiCombobox } from "./MultiCombobox";
import { TagPickerWithCreate } from "./TagPickerWithCreate";
import { useAuthors } from "../hooks/useAuthors";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useMediaTypeTree } from "../hooks/useMediaTypes";
import { usePublishers } from "../hooks/usePublishers";
import { useTagTree } from "../hooks/useTags";
import { iconComboboxOptions, mediaTypeTreeComboboxOptions } from "../lib/comboboxOptions";
import { flattenTree } from "../lib/tagTree";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Types that can be meaningfully pre-filled before bookmark creation. */
const INBOX_PREFILLABLE_TYPES = new Set<CustomProperty["type"]>(["number", "boolean", "datetime", "choices", "ratingScale"]);

function isPreFillEmpty(preFill: InboxPreFillDefaults): boolean {
  return (
    !preFill.categoryId
    && (!preFill.tagIds || preFill.tagIds.length === 0)
    && !preFill.mediaTypeId
    && (!preFill.authorIds || preFill.authorIds.length === 0)
    && !preFill.publisherId
    && (!preFill.numberValues || preFill.numberValues.length === 0)
    && (!preFill.booleanValues || preFill.booleanValues.length === 0)
    && (!preFill.dateTimeValues || preFill.dateTimeValues.length === 0)
    && (!preFill.choicesValues || preFill.choicesValues.length === 0)
  );
}

/** A single inbox-enabled custom property's pre-fill field, rendered inline. */
function InboxPropertyField({
  property,
  preFill,
  setPreFill,
}: {
  property: CustomProperty;
  preFill: InboxPreFillDefaults;
  setPreFill: (update: InboxPreFillDefaults) => void;
}) {
  if (property.type === "boolean") {
    const current = preFill.booleanValues?.find(v => v.propertyId === property.id);
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id={`inbox-prop-${property.id}`}
          checked={current?.value ?? false}
          onCheckedChange={(checked) => {
            const next = (preFill.booleanValues ?? []).filter(v => v.propertyId !== property.id);
            setPreFill({
              ...preFill,
              booleanValues: checked
                ? [...next, {
                  propertyId: property.id,
                  value: true,
                }]
                : next,
            });
          }}
        />
        <Label
          htmlFor={`inbox-prop-${property.id}`}
          className="text-sm"
        >
          {property.name}
        </Label>
      </div>
    );
  }

  if (property.type === "number" || property.type === "ratingScale") {
    const current = preFill.numberValues?.find(v => v.propertyId === property.id);
    return (
      <div className="space-y-1">
        <Label
          htmlFor={`inbox-prop-${property.id}`}
          className="text-sm"
        >
          {property.name}
        </Label>
        <Input
          id={`inbox-prop-${property.id}`}
          type="number"
          className="h-8 text-sm"
          placeholder="—"
          value={current?.value ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            const next = (preFill.numberValues ?? []).filter(v => v.propertyId !== property.id);
            setPreFill({
              ...preFill,
              numberValues: raw === ""
                ? next
                : [...next, {
                  propertyId: property.id,
                  value: Number(raw),
                }],
            });
          }}
        />
      </div>
    );
  }

  if (property.type === "datetime") {
    const current = preFill.dateTimeValues?.find(v => v.propertyId === property.id);
    return (
      <div className="space-y-1">
        <Label
          htmlFor={`inbox-prop-${property.id}`}
          className="text-sm"
        >
          {property.name}
        </Label>
        <Input
          id={`inbox-prop-${property.id}`}
          type="date"
          className="h-8 text-sm"
          value={current?.value ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            const next = (preFill.dateTimeValues ?? []).filter(v => v.propertyId !== property.id);
            setPreFill({
              ...preFill,
              dateTimeValues: val === ""
                ? next
                : [...next, {
                  propertyId: property.id,
                  value: val,
                }],
            });
          }}
        />
      </div>
    );
  }

  if (property.type === "choices") {
    const items = property.choicesItems ?? [];
    const options = items.map(item => ({
      value: item.value,
      label: item.label,
    }));
    const current = preFill.choicesValues?.find(v => v.propertyId === property.id);
    const currentValues = current?.values ?? [];

    if (property.choicesMultiple) {
      return (
        <div className="space-y-1">
          <Label className="text-sm">{property.name}</Label>
          <MultiCombobox
            options={options}
            values={currentValues}
            onValuesChange={(vals) => {
              const next = (preFill.choicesValues ?? []).filter(v => v.propertyId !== property.id);
              setPreFill({
                ...preFill,
                choicesValues: vals.length > 0
                  ? [...next, {
                    propertyId: property.id,
                    values: vals,
                  }]
                  : next,
              });
            }}
            placeholder="Select…"
            aria-label={property.name}
          />
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <Label className="text-sm">{property.name}</Label>
        <Combobox
          options={options}
          value={currentValues[0]}
          onValueChange={(val) => {
            const next = (preFill.choicesValues ?? []).filter(v => v.propertyId !== property.id);
            setPreFill({
              ...preFill,
              choicesValues: val
                ? [...next, {
                  propertyId: property.id,
                  values: [val],
                }]
                : next,
            });
          }}
          placeholder="Select…"
          aria-label={property.name}
        />
      </div>
    );
  }

  return null;
}

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
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addMediaTypeOpen, setAddMediaTypeOpen] = useState(false);
  const [addPublisherOpen, setAddPublisherOpen] = useState(false);
  const [addAuthorOpen, setAddAuthorOpen] = useState(false);

  const {
    data: categories = [],
  } = useCategories();
  const {
    data: tagTree = [],
  } = useTagTree();
  const {
    data: mediaTypeTree = [],
  } = useMediaTypeTree();
  const {
    data: authors = [],
  } = useAuthors();
  const {
    data: publishers = [],
  } = usePublishers();
  const {
    data: allProperties = [],
  } = useCustomProperties();

  const inboxProperties = allProperties.filter(
    p => p.enabledInInbox && p.enabled && INBOX_PREFILLABLE_TYPES.has(p.type),
  );

  const categoryOptions = iconComboboxOptions(categories);
  const mediaTypeOptions = mediaTypeTreeComboboxOptions(mediaTypeTree);
  const authorOptions = authors.map(a => ({
    value: a.id,
    label: a.name,
  }));
  const publisherOptions = publishers.map(p => ({
    value: p.id,
    label: p.name,
  }));

  const selectedTagIds = preFill.tagIds ?? [];
  const selectedAuthorIds = preFill.authorIds ?? [];
  const isEmpty = isPreFillEmpty(preFill);

  // Flat tag list for displaying selected tag names as badges.
  const flatTags = flattenTree(tagTree as TagNode[]);
  const selectedTagNames = selectedTagIds
    .map(id => flatTags.find(t => t.node.id === id)?.node.name)
    .filter(Boolean) as string[];

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
                createOption={{
                  label: "Create category",
                  onSelect: () => setAddCategoryOpen(true),
                }}
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
                  createOption={{
                    label: "Create media type",
                    onSelect: () => setAddMediaTypeOpen(true),
                  }}
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
                  createOption={{
                    label: "Create publisher",
                    onSelect: () => setAddPublisherOpen(true),
                  }}
                />
              </div>
            )}

            {/* Authors */}
            {authors.length > 0 && (
              <div className="space-y-1">
                <Label className="text-sm">Authors</Label>
                <MultiCombobox
                  options={authorOptions}
                  values={selectedAuthorIds}
                  onValuesChange={vals => setPreFill({
                    ...preFill,
                    authorIds: vals,
                  })}
                  placeholder="Any authors"
                  searchPlaceholder="Search authors…"
                  emptyText="No authors."
                  aria-label="Default authors"
                  createOption={{
                    label: "Create author",
                    onSelect: () => setAddAuthorOpen(true),
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
          <div className="space-y-1">
            <Label className="text-sm">Tags</Label>
            {selectedTagNames.length > 0 && (
              <div className="mb-1 flex flex-wrap gap-1">
                {selectedTagNames.map((name, i) => (
                  <Badge
                    key={selectedTagIds[i]}
                    variant="secondary"
                    className="gap-1 text-xs"
                  >
                    {name}
                    <button
                      type="button"
                      aria-label={`Remove tag ${name}`}
                      className="
                        ml-0.5 rounded-sm
                        hover:text-destructive
                      "
                      onClick={() =>
                        setPreFill({
                          ...preFill,
                          tagIds: selectedTagIds.filter(id => id !== selectedTagIds[i]),
                        })}
                    >
                      <X className="size-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <TagPickerWithCreate
              tree={tagTree as TagNode[]}
              selectedIds={selectedTagIds}
              onToggle={(id) => {
                const next = selectedTagIds.includes(id)
                  ? selectedTagIds.filter(t => t !== id)
                  : [...selectedTagIds, id];
                setPreFill({
                  ...preFill,
                  tagIds: next,
                });
              }}
            />
          </div>
        </div>
      </RowCard>
      <AddCategoryModal
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onCreated={c => setPreFill({
          ...preFill,
          categoryId: c.id,
        })}
      />
      <AddMediaTypeModal
        open={addMediaTypeOpen}
        onOpenChange={setAddMediaTypeOpen}
        onCreated={m => setPreFill({
          ...preFill,
          mediaTypeId: m.id,
        })}
      />
      <AddPublisherModal
        open={addPublisherOpen}
        onOpenChange={setAddPublisherOpen}
        onCreated={p => setPreFill({
          ...preFill,
          publisherId: p.id,
        })}
      />
      <AddAuthorModal
        open={addAuthorOpen}
        onOpenChange={setAddAuthorOpen}
        onCreated={a => setPreFill({
          ...preFill,
          authorIds: [...(preFill.authorIds ?? []), a.id],
        })}
      />
    </>
  );
}
