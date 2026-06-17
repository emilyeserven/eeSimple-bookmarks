import type {
  Bookmark,
  BookmarkBooleanValue,
  BookmarkNumberValue,
  CreateBookmarkInput,
  CustomProperty,
  TagNode,
} from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { ChevronDown, Loader2, Sparkles } from "lucide-react";
import { z } from "zod";

import { TagPicker } from "./TagPicker";
import { useAutofillRules } from "../hooks/useAutofill";
import { useCreateBookmark, useUpdateBookmark } from "../hooks/useBookmarks";
import { useCategories, useCategoryDefaults, useCategoryRootTags } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useFetchTitle } from "../hooks/useFetchTitle";
import { useTagTree } from "../hooks/useTags";
import { applyAutofill } from "../lib/autofill";
import { useAppForm } from "../lib/form";
import { useUiStore } from "../stores/uiStore";

import { Button } from "@/components/ui/button";
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

/** True when `value` parses as an http(s) URL — mirrors the middleware's guard. */
function isFetchableUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  }
  catch {
    return false;
  }
}

interface BookmarkFormProps {
  /** When provided, the form edits this bookmark instead of creating a new one. */
  bookmark?: Bookmark;
  /** Called after a successful edit (or on cancel) so the parent can close the form. */
  onDone?: () => void;
}

/**
 * Bookmark form. Creates a new bookmark by default, or edits `bookmark` when given.
 * Owns its own mutation so the page stays focused on the list.
 */
export function BookmarkForm({
  bookmark, onDone,
}: BookmarkFormProps = {}) {
  const isEdit = Boolean(bookmark);
  const createBookmark = useCreateBookmark();
  const updateBookmark = useUpdateBookmark();
  const saveBookmark = isEdit ? updateBookmark : createBookmark;
  const fetchTitle = useFetchTitle();
  const autoFetchTitle = useUiStore(state => state.autoFetchTitle);
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: customProperties,
  } = useCustomProperties();
  const {
    data: categories,
  } = useCategories();
  const {
    data: autofillRules,
  } = useAutofillRules();

  // Custom-property values live outside the typed form (they're dynamic). A ref
  // mirrors them so the submit handler always reads the latest entries. When editing,
  // seed them from the bookmark's existing values (calculate results are ignored on submit).
  const [numberInputs, setNumberInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries((bookmark?.numberValues ?? []).map(entry => [entry.propertyId, String(entry.value)])));
  const [booleanInputs, setBooleanInputs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((bookmark?.booleanValues ?? []).map(entry => [entry.propertyId, entry.value])));
  const customRef = useRef({
    numberInputs,
    booleanInputs,
  });
  customRef.current = {
    numberInputs,
    booleanInputs,
  };

  // Precedence when prefilling: user input > autofill rule > category default.
  // `touchedRef` tracks fields the user edited; `ruleSetRef` tracks property ids an autofill rule
  // most recently set (so category defaults don't clobber them); `lastAutoCategoryRef` holds the
  // category we set programmatically so a user's manual pick is never overwritten.
  const touchedRef = useRef<Set<string>>(new Set());
  const ruleSetRef = useRef<{ numbers: Set<string>;
    booleans: Set<string>; }>({
    numbers: new Set(),
    booleans: new Set(),
  });
  const lastAutoCategoryRef = useRef<string>("");

  // Run the autofill rules against the current URL/Title and prefill the form, never overwriting
  // a value the user has already touched. Called when the URL or Title field loses focus.
  function runAutofill(): void {
    const url = form.getFieldValue("url");
    const title = form.getFieldValue("title");
    if (!url && !title) return;

    const result = applyAutofill({
      url,
      title,
    }, autofillRules ?? []);

    if (result.categoryId) {
      const current = form.getFieldValue("categoryId");
      if (current === "" || current === lastAutoCategoryRef.current) {
        lastAutoCategoryRef.current = result.categoryId;
        form.setFieldValue("categoryId", result.categoryId);
      }
    }

    if (result.tagIds.length > 0 && !touchedRef.current.has("tags")) {
      const current = form.getFieldValue("tagIds");
      form.setFieldValue("tagIds", [...new Set([...current, ...result.tagIds])]);
    }

    ruleSetRef.current = {
      numbers: new Set(result.numberValues.map(entry => entry.propertyId)),
      booleans: new Set(result.booleanValues.map(entry => entry.propertyId)),
    };
    if (result.numberValues.length > 0) {
      setNumberInputs((current) => {
        const next = {
          ...current,
        };
        for (const entry of result.numberValues) {
          if (!touchedRef.current.has(`number:${entry.propertyId}`)) {
            next[entry.propertyId] = String(entry.value);
          }
        }
        return next;
      });
    }
    if (result.booleanValues.length > 0) {
      setBooleanInputs((current) => {
        const next = {
          ...current,
        };
        for (const entry of result.booleanValues) {
          if (!touchedRef.current.has(`boolean:${entry.propertyId}`)) {
            next[entry.propertyId] = entry.value;
          }
        }
        return next;
      });
    }
  }

  // Apply a category's default property values, skipping anything the user touched or an autofill
  // rule already set (rules win over defaults), and never overwriting a non-empty number input.
  function applyCategoryDefaults(numberValues: BookmarkNumberValue[], booleanValues: BookmarkBooleanValue[]): void {
    setNumberInputs((current) => {
      const next = {
        ...current,
      };
      for (const entry of numberValues) {
        const existing = next[entry.propertyId];
        if (
          !touchedRef.current.has(`number:${entry.propertyId}`)
          && !ruleSetRef.current.numbers.has(entry.propertyId)
          && (existing === undefined || existing === "")
        ) {
          next[entry.propertyId] = String(entry.value);
        }
      }
      return next;
    });
    setBooleanInputs((current) => {
      const next = {
        ...current,
      };
      for (const entry of booleanValues) {
        if (
          !touchedRef.current.has(`boolean:${entry.propertyId}`)
          && !ruleSetRef.current.booleans.has(entry.propertyId)
        ) {
          next[entry.propertyId] = entry.value;
        }
      }
      return next;
    });
  }

  const form = useAppForm({
    defaultValues: {
      url: bookmark?.url ?? "",
      title: bookmark?.title ?? "",
      categoryId: bookmark?.categoryId ?? "",
      description: bookmark?.description ?? "",
      tagIds: (bookmark?.tags.map(tag => tag.id) ?? []) as string[],
      priority: bookmark?.priority ?? 0,
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

      const input: CreateBookmarkInput = {
        url: value.url,
        title: value.title,
        categoryId: value.categoryId,
        description: value.description || null,
        tagIds: value.tagIds,
        numberValues,
        booleanValues,
        priority: value.priority,
      };

      if (bookmark) {
        await updateBookmark.mutateAsync({
          id: bookmark.id,
          input,
        });
        onDone?.();
        return;
      }

      await createBookmark.mutateAsync(input);
      form.reset();
      setNumberInputs({});
      setBooleanInputs({});
      touchedRef.current = new Set();
      ruleSetRef.current = {
        numbers: new Set(),
        booleans: new Set(),
      };
      lastAutoCategoryRef.current = "";
    },
  });

  // Fetch the page title for the current URL and write it into the Title field.
  // `force` (manual button) always overwrites; the on-blur path only fills a blank title.
  async function runFetchTitle(url: string, {
    force,
  }: { force: boolean }): Promise<void> {
    if (!isFetchableUrl(url)) return;
    if (!force && form.getFieldValue("title").trim() !== "") return;
    try {
      const {
        title,
      } = await fetchTitle.mutateAsync(url);
      if (force || form.getFieldValue("title").trim() === "") {
        form.setFieldValue("title", title);
      }
    }
    catch {
      // Surfaced via fetchTitle.isError below; nothing else to do here.
    }
  }

  // Default the category to the built-in "Default" once categories load.
  useEffect(() => {
    if (!categories || categories.length === 0) return;
    if (form.getFieldValue("categoryId")) return;
    const fallback = categories.find(category => category.builtIn) ?? categories[0];
    lastAutoCategoryRef.current = fallback.id;
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
      <form.AppField name="url">
        {field => (
          <field.TextField
            label="URL"
            type="url"
            onBlur={() => {
              runAutofill();
              if (autoFetchTitle) {
                void runFetchTitle(field.state.value, {
                  force: false,
                });
              }
            }}
          />
        )}
      </form.AppField>

      <form.Subscribe selector={state => state.values.url}>
        {url => (
          <form.AppField name="title">
            {field => (
              <field.TextField
                label="Name"
                onBlur={runAutofill}
                action={(
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Fetch title from URL"
                    aria-label="Fetch title from URL"
                    disabled={!isFetchableUrl(url) || fetchTitle.isPending}
                    onClick={() => void runFetchTitle(url, {
                      force: true,
                    })}
                  >
                    {fetchTitle.isPending
                      ? <Loader2 className="size-4 animate-spin" />
                      : <Sparkles className="size-4" />}
                  </Button>
                )}
              />
            )}
          </form.AppField>
        )}
      </form.Subscribe>

      {fetchTitle.isError
        ? (
          <p
            className="
              text-sm text-destructive
              sm:col-span-2
            "
          >
            {fetchTitle.error?.message ?? "Could not fetch a title for that URL."}
          </p>
        )
        : null}

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
                        touchedRef.current.add("tags");
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
              <>
                <CategoryDefaultsApplier
                  categoryId={categoryId}
                  onApply={applyCategoryDefaults}
                />
                <CategoryCustomFields
                  categoryId={categoryId}
                  properties={customProperties ?? []}
                  numberInputs={numberInputs}
                  booleanInputs={booleanInputs}
                  onNumberChange={(id, value) => {
                    touchedRef.current.add(`number:${id}`);
                    setNumberInputs(current => ({
                      ...current,
                      [id]: value,
                    }));
                  }}
                  onBooleanChange={(id, value) => {
                    touchedRef.current.add(`boolean:${id}`);
                    setBooleanInputs(current => ({
                      ...current,
                      [id]: value,
                    }));
                  }}
                />
              </>
            )}
          </form.Subscribe>
        </CollapsibleContent>
      </Collapsible>

      <div className="sm:col-span-2">
        <div className="flex items-center gap-2">
          <form.AppForm>
            <form.SubmitButton
              label={isEdit ? "Save changes" : "Add bookmark"}
              pendingLabel="Saving…"
            />
          </form.AppForm>
          {isEdit && onDone
            ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onDone}
              >
                Cancel
              </Button>
            )
            : null}
        </div>
        {saveBookmark.isError ? <p className="mt-2 text-sm text-destructive">{saveBookmark.error?.message}</p> : null}
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

interface CategoryDefaultsApplierProps {
  categoryId: string;
  onApply: (numberValues: BookmarkNumberValue[], booleanValues: BookmarkBooleanValue[]) => void;
}

/**
 * Headless helper that loads the chosen category's default property values and applies them to the
 * form whenever the category changes. Renders nothing — the parent owns the property inputs.
 */
function CategoryDefaultsApplier({
  categoryId, onApply,
}: CategoryDefaultsApplierProps) {
  const {
    data: defaults,
  } = useCategoryDefaults(categoryId);

  useEffect(() => {
    if (!categoryId || !defaults) return;
    onApply(defaults.numberValues, defaults.booleanValues);
    // Re-apply only when the category or its loaded defaults change; `onApply` is stable enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, defaults]);

  return null;
}
