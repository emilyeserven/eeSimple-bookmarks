import type { MymindImportFormOptions } from "../lib/mymindImportRunner";

import { useTranslation } from "react-i18next";

import { Combobox } from "./Combobox";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useCategories } from "../hooks/useCategories";
import { categoryComboboxOptions } from "../lib/comboboxOptions";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type BooleanOptionKey = Exclude<keyof MymindImportFormOptions, "categoryId">;

const NO_CATEGORY = "__none__";

function OptionCheckbox({
  id, checked, label, description, disabled, onChange,
}: {
  id: string;
  checked: boolean;
  label: string;
  description: string;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-2">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={value => onChange(value === true)}
        className="mt-0.5"
      />
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

/** The mymind import options: the boolean toggles plus an optional category for every bookmark. */
export function MymindImportOptionsFields({
  value, onChange, disabled,
}: {
  value: MymindImportFormOptions;
  onChange: (next: MymindImportFormOptions) => void;
  disabled?: boolean;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data: categories = [],
  } = useCategories();
  const setCategory = (categoryId: string | null) => onChange({
    ...value,
    categoryId,
  });
  const categoryCreate = useEntityCreateOption("category", category => setCategory(category.id));

  const toggles: { key: BooleanOptionKey;
    label: string;
    description: string; }[] = [
    {
      key: "includeUrlless",
      label: t("Import cards without a URL"),
      description: t("Image, note, and highlight cards with no link become link-less bookmarks (their images aren't imported)."),
    },
    {
      key: "nestPrefixedTags",
      label: t("Nest \"prefix: value\" tags"),
      description: t("A tag like \"des: Studio\" becomes a \"Studio\" tag under a \"des\" parent tag, instead of one flat tag."),
    },
    {
      key: "applyAutofill",
      label: t("Apply autofill rules"),
      description: t("Run your autofill rules on each card, like a quick-added bookmark."),
    },
    {
      key: "matchMediaTypes",
      label: t("Match media types"),
      description: t("Assign an existing media type whose name matches the mymind card type (Article, Recipe, Book…). No media types are created."),
    },
    {
      key: "keepCreatedDate",
      label: t("Keep the date saved in mymind"),
      description: t("Back-date each bookmark's created time to when you saved the card."),
    },
  ];

  return (
    <div className="space-y-4">
      {toggles.map(toggle => (
        <OptionCheckbox
          key={toggle.key}
          id={`mymind-${toggle.key}`}
          checked={value[toggle.key]}
          label={toggle.label}
          description={toggle.description}
          disabled={disabled}
          onChange={checked => onChange({
            ...value,
            [toggle.key]: checked,
          })}
        />
      ))}
      <div className="space-y-1">
        <Label>{t("Category")}</Label>
        <Combobox
          options={[
            {
              value: NO_CATEGORY,
              label: t("— Autofill or Default —"),
            },
            ...categoryComboboxOptions(categories),
          ]}
          value={value.categoryId ?? NO_CATEGORY}
          onValueChange={next => setCategory(next && next !== NO_CATEGORY ? next : null)}
          searchPlaceholder={t("Search categories…")}
          emptyText={t("No categories found.")}
          createOption={categoryCreate.createOption}
          disabled={disabled}
        />
        {categoryCreate.modal}
      </div>
    </div>
  );
}
