import type {
  BookmarkBooleanValue,
  BookmarkNumberValue,
  CustomProperty,
  TagNode,
} from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { ChevronDown } from "lucide-react";
import { z } from "zod";

import { TagPicker } from "./TagPicker";
import { useCreateBookmark } from "../hooks/useBookmarks";
import { useCategories, useCategoryRootTags } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTagTree } from "../hooks/useTags";
import { useAppForm } from "../lib/form";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const bookmarkSchema = z.object({
  url: z.string().url("Enter a valid URL"),
  title: z.string().min(1, "Title is required"),
  categoryId: z.string().min(1, "Category is required"),
  description: z.string(),
  tagIds: z.array(z.string()),
  priority: z.number().int(),
});

/** Create-bookmark form. Owns its own mutation so the page stays focused on the list. */
export function BookmarkForm() {
  const createBookmark = useCreateBookmark();
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: customProperties,
  } = useCustomProperties();
  const {
    data: categories,
  } = useCategories();

  // Custom-property values live outside the typed form (they're dynamic). A ref
  // mirrors them so the submit handler always reads the latest entries.
  const [numberInputs, setNumberInputs] = useState<Record<string, string>>({});
  const [booleanInputs, setBooleanInputs] = useState<Record<string, boolean>>({});
  const customRef = useRef({
    numberInputs,
    booleanInputs,
  });
  customRef.current = {
    numberInputs,
    booleanInputs,
  };

  const form = useAppForm({
    defaultValues: {
      url: "",
      title: "",
      categoryId: "",
      description: "",
      tagIds: [] as string[],
      priority: 0,
    },
    validators: {
      onChange: bookmarkSchema,
    },
    onSubmit: async ({
      value,
    }) => {
      const {
        numberInputs: numbers, booleanInputs: booleans,
      } = customRef.current;
      // Only persist values for properties that belong to the chosen category.
      const categoryProps = (customProperties ?? []).filter(property =>
        property.categoryIds.includes(value.categoryId));
      const numberValues: BookmarkNumberValue[] = categoryProps
        .filter(property => property.type === "number")
        .map((property) => {
          const raw = numbers[property.id] ?? "";
          return {
            property,
            raw,
          };
        })
        .filter(({
          raw,
        }) => raw.trim() !== "" && !Number.isNaN(Number(raw)))
        .map(({
          property, raw,
        }) => ({
          propertyId: property.id,
          value: Number(raw),
        }));
      const booleanValues: BookmarkBooleanValue[] = categoryProps
        .filter(property => property.type === "boolean")
        .map(property => ({
          propertyId: property.id,
          value: booleans[property.id] ?? false,
        }));

      await createBookmark.mutateAsync({
        url: value.url,
        title: value.title,
        categoryId: value.categoryId,
        description: value.description || null,
        tagIds: value.tagIds,
        numberValues,
        booleanValues,
        priority: value.priority,
      });
      form.reset();
      setNumberInputs({});
      setBooleanInputs({});
    },
  });

  // Default the category to the built-in "Default" once categories load.
  useEffect(() => {
    if (!categories || categories.length === 0) return;
    if (form.getFieldValue("categoryId")) return;
    const fallback = categories.find(category => category.builtIn) ?? categories[0];
    form.setFieldValue("categoryId", fallback.id);
  }, [categories, form]);

  return (
    <form
      className="
        grid gap-4 rounded-lg border bg-card p-4
        sm:grid-cols-2
      "
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="title">
        {field => <field.TextField label="Name" />}
      </form.AppField>

      <form.AppField name="url">
        {field => (
          <field.TextField
            label="URL"
            type="url"
          />
        )}
      </form.AppField>

      <form.AppField name="categoryId">
        {field => (
          <field.SelectField
            label="Category"
            className="sm:col-span-2"
            placeholder="Select a category"
            options={(categories ?? []).map(category => ({
              value: category.id,
              label: category.name,
            }))}
          />
        )}
      </form.AppField>

      <Collapsible
        className="
          group/advanced space-y-3
          sm:col-span-2
        "
      >
        <CollapsibleTrigger
          className="
            flex items-center gap-1 text-sm font-medium text-muted-foreground
            hover:text-foreground
          "
        >
          <ChevronDown
            className="
              size-4 transition-transform
              group-data-[state=open]/advanced:rotate-180
            "
          />
          Advanced
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4">
          <form.AppField name="description">
            {field => <field.TextareaField label="Description" />}
          </form.AppField>

          <form.Subscribe selector={state => state.values.categoryId}>
            {categoryId => (
              <form.Field name="tagIds">
                {field => (
                  <div className="space-y-1">
                    <Label>Tags</Label>
                    <GatedTagPicker
                      categoryId={categoryId}
                      tree={tagTree ?? []}
                      selectedIds={field.state.value}
                      onToggle={(id) => {
                        const current = field.state.value;
                        field.handleChange(
                          current.includes(id)
                            ? current.filter(tagId => tagId !== id)
                            : [...current, id],
                        );
                      }}
                    />
                  </div>
                )}
              </form.Field>
            )}
          </form.Subscribe>

          <form.AppField name="priority">
            {field => (
              <field.NumberField
                label="Priority"
                className="max-w-32"
                hint="Higher numbers appear first on the homepage."
              />
            )}
          </form.AppField>

          <form.Subscribe selector={state => state.values.categoryId}>
            {categoryId => (
              <CategoryCustomFields
                categoryId={categoryId}
                properties={customProperties ?? []}
                numberInputs={numberInputs}
                booleanInputs={booleanInputs}
                onNumberChange={(id, value) =>
                  setNumberInputs(current => ({
                    ...current,
                    [id]: value,
                  }))}
                onBooleanChange={(id, value) =>
                  setBooleanInputs(current => ({
                    ...current,
                    [id]: value,
                  }))}
              />
            )}
          </form.Subscribe>
        </CollapsibleContent>
      </Collapsible>

      <div className="sm:col-span-2">
        <form.AppForm>
          <form.SubmitButton
            label="Add bookmark"
            pendingLabel="Saving…"
          />
        </form.AppForm>
        {createBookmark.isError ? <p className="mt-2 text-sm text-destructive">{createBookmark.error?.message}</p> : null}
      </div>
    </form>
  );
}

interface GatedTagPickerProps {
  categoryId: string;
  tree: TagNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

/** TagPicker limited to the selected category's enabled root tags (empty allowlist = all). */
function GatedTagPicker({
  categoryId, tree, selectedIds, onToggle,
}: GatedTagPickerProps) {
  const {
    data: allowedRootIds,
  } = useCategoryRootTags(categoryId);

  const gated = allowedRootIds && allowedRootIds.length > 0
    ? tree.filter(root => allowedRootIds.includes(root.id))
    : tree;

  return (
    <div className="rounded-md border p-2">
      <TagPicker
        tree={gated}
        selectedIds={selectedIds}
        onToggle={onToggle}
      />
    </div>
  );
}

interface CategoryCustomFieldsProps {
  categoryId: string;
  properties: CustomProperty[];
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  onNumberChange: (propertyId: string, value: string) => void;
  onBooleanChange: (propertyId: string, value: boolean) => void;
}

/** Renders the custom-property inputs for the properties assigned to the chosen category. */
function CategoryCustomFields({
  categoryId, properties, numberInputs, booleanInputs, onNumberChange, onBooleanChange,
}: CategoryCustomFieldsProps) {
  const categoryProps = properties.filter(property => property.categoryIds.includes(categoryId));
  if (categoryProps.length === 0) return null;

  return (
    <div className="space-y-3">
      <span className="text-sm font-medium">Properties</span>
      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        {categoryProps.map((property) => {
          if (property.type === "number") {
            return (
              <div
                key={property.id}
                className="space-y-1"
              >
                <Label htmlFor={`property-${property.id}`}>
                  {property.name}
                  {property.unitPlural ? ` (${property.unitPlural})` : ""}
                </Label>
                <Input
                  id={`property-${property.id}`}
                  type="number"
                  value={numberInputs[property.id] ?? ""}
                  onChange={event => onNumberChange(property.id, event.target.value)}
                />
              </div>
            );
          }
          if (property.type === "boolean") {
            return (
              <div
                key={property.id}
                className="flex items-center gap-2 self-end"
              >
                <Checkbox
                  id={`property-${property.id}`}
                  checked={booleanInputs[property.id] ?? false}
                  onCheckedChange={checked => onBooleanChange(property.id, checked === true)}
                />
                <Label htmlFor={`property-${property.id}`}>{property.name}</Label>
              </div>
            );
          }
          // calculate: computed server-side; shown read-only so the user knows it exists.
          return (
            <div
              key={property.id}
              className="space-y-1"
            >
              <Label>{property.name}</Label>
              <p className="text-xs text-muted-foreground">Calculated automatically when saved.</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
