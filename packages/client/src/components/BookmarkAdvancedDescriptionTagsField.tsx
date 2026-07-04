import type { SourceDefaults } from "./BookmarkAdvancedSection";
import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { TagNode } from "@eesimple/types";

import { useState } from "react";

import { Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AddTagModal } from "./AddTagModal";
import { SourceDefaultCheckbox } from "./BookmarkSourceDefaultCheckbox";
import { GatedTagPicker } from "./BookmarkTagsField";

import { Button } from "@/components/ui/button";
import { isFetchableUrl } from "@/lib/url";

interface BookmarkAdvancedDescriptionTagsFieldProps {
  form: BookmarkFormApi;
  tagTree: TagNode[];
  onTagToggle: (id: string) => void;
  sourceDefaults: SourceDefaults;
  /** Called when the user clicks the description sparkle; receives the current URL. */
  onFetchDescription?: (url: string) => void;
  /** Whether a description fetch is in-flight (drives the spinner on the sparkle button). */
  isFetchDescriptionPending?: boolean;
}

/**
 * The Advanced section's Description + Tags row: a sparkle-fetchable description textarea beside the
 * gated tag picker (with its inline "create tag" modal and "apply as defaults for <source>" checkbox),
 * laid out side by side and stretched to a matching height.
 */
export function BookmarkAdvancedDescriptionTagsField({
  form,
  tagTree,
  onTagToggle,
  sourceDefaults,
  onFetchDescription,
  isFetchDescriptionPending,
}: BookmarkAdvancedDescriptionTagsFieldProps) {
  const {
    t,
  } = useTranslation();
  const [addTagOpen, setAddTagOpen] = useState(false);

  return (
    <div
      className="
        grid items-stretch gap-4
        sm:grid-cols-2
      "
    >
      <form.Subscribe selector={state => state.values.url}>
        {url => (
          <form.AppField name="description">
            {field => (
              <field.TextareaField
                label={t("Description")}
                fill
                inputClassName="min-h-24"
                action={onFetchDescription
                  ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title={t("Fetch description from URL")}
                      aria-label={t("Fetch description from URL")}
                      disabled={!isFetchableUrl(url) || isFetchDescriptionPending}
                      onClick={() => onFetchDescription(url)}
                    >
                      {isFetchDescriptionPending
                        ? <Loader2 className="size-4 animate-spin" />
                        : <Sparkles className="size-4" />}
                    </Button>
                  )
                  : undefined}
              />
            )}
          </form.AppField>
        )}
      </form.Subscribe>

      <form.Subscribe selector={state => state.values.categoryId}>
        {categoryId => (
          <form.Field name="tagIds">
            {field => (
              <>
                <GatedTagPicker
                  categoryId={categoryId}
                  tree={tagTree}
                  selectedIds={field.state.value}
                  onToggle={(id) => {
                    onTagToggle(id);
                    const current = field.state.value;
                    field.handleChange(
                      current.includes(id)
                        ? current.filter(tagId => tagId !== id)
                        : [...current, id],
                    );
                  }}
                  createOption={{
                    label: t("Create tag"),
                    onSelect: () => setAddTagOpen(true),
                  }}
                  below={sourceDefaults.showSourceDefault && field.state.value.length > 0
                    ? (
                      <SourceDefaultCheckbox
                        checked={sourceDefaults.setTags}
                        onCheckedChange={sourceDefaults.onSetTags}
                      >
                        {t("Apply selected tags as defaults for {{label}}", {
                          label: sourceDefaults.label,
                        })}
                      </SourceDefaultCheckbox>
                    )
                    : null}
                />
                <AddTagModal
                  open={addTagOpen}
                  onOpenChange={setAddTagOpen}
                  onCreated={(tag) => {
                    const current = field.state.value;
                    if (!current.includes(tag.id)) {
                      onTagToggle(tag.id);
                      field.handleChange([...current, tag.id]);
                    }
                  }}
                />
              </>
            )}
          </form.Field>
        )}
      </form.Subscribe>
    </div>
  );
}
