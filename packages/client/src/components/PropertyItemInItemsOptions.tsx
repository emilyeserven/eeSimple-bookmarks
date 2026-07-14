import type { PropertyFormApi, PropertyFormValues } from "./propertyFormSchema";
import type { TreeComboboxOption } from "@/components/TreeMultiCombobox";

import { useTranslation } from "react-i18next";

import { AllowDefaultField } from "./AllowDefaultField";
import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { summarizeItemInItemsOptions } from "./propertyFormParts";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useMediaTypeTree } from "../hooks/useMediaTypes";

import { TreeCombobox } from "@/components/TreeCombobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useBuiltInName } from "@/lib/builtInName";
import { mediaTypeNodesToOptions } from "@/lib/comboboxOptions";

/** One editable per-media-type text override row (the form's array element shape). */
type ItemInItemsMediaTypeTextRowValue = PropertyFormValues["itemInItemsMediaTypeTexts"][number];

/** One media-type override row: the media type picker plus its three optional text segments. */
function ItemInItemsMediaTypeTextRow({
  row, mediaTypeOptions, onChange, onRemove,
}: {
  row: ItemInItemsMediaTypeTextRowValue;
  mediaTypeOptions: TreeComboboxOption[];
  onChange: (row: ItemInItemsMediaTypeTextRowValue) => void;
  onRemove: () => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center gap-2">
        <TreeCombobox
          aria-label={t("Media type")}
          className="flex-1"
          options={mediaTypeOptions}
          value={row.mediaTypeId || undefined}
          placeholder={t("Pick a media type…")}
          searchPlaceholder={t("Search media types…")}
          emptyText={t("No media types found.")}
          onValueChange={value => onChange({
            ...row,
            mediaTypeId: value ?? "",
          })}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t("Remove override")}
          onClick={onRemove}
        >
          ×
        </Button>
      </div>
      <div
        className="
          grid gap-2
          sm:grid-cols-3
        "
      >
        <Input
          placeholder={t("Text before (inherit)")}
          value={row.beforeText}
          onChange={e => onChange({
            ...row,
            beforeText: e.target.value,
          })}
        />
        <Input
          placeholder={t("Text between (inherit)")}
          value={row.betweenText}
          onChange={e => onChange({
            ...row,
            betweenText: e.target.value,
          })}
        />
        <Input
          placeholder={t("Text after, e.g.  modules")}
          value={row.afterText}
          onChange={e => onChange({
            ...row,
            afterText: e.target.value,
          })}
        />
      </div>
    </div>
  );
}

/**
 * The per-media-type text override list for an itemInItems property — how one "Progress" property
 * renders "1 of 10 pages" on a book but "24 of 230 modules" on a course. A segment left blank
 * inherits the base text above.
 */
function ItemInItemsMediaTypeTextsField({
  form,
}: {
  form: PropertyFormApi;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data: mediaTypeTree,
  } = useMediaTypeTree();
  const builtInName = useBuiltInName();
  const mediaTypeOptions = mediaTypeNodesToOptions(mediaTypeTree ?? [], builtInName);
  return (
    <form.AppField name="itemInItemsMediaTypeTexts">
      {field => (
        <div className="space-y-2">
          <Label>{t("Per-media-type text")}</Label>
          <p className="text-xs text-muted-foreground">
            {t("Override the text segments for bookmarks of a specific media type. Blank segments inherit the texts above.")}
          </p>
          {field.state.value.map((row, index) => (
            <ItemInItemsMediaTypeTextRow
              // Rows have no stable id; index keying is fine for this small append/remove list.

              key={index}
              row={row}
              mediaTypeOptions={mediaTypeOptions}
              onChange={next => field.handleChange(field.state.value.map((r, i) => (i === index ? next : r)))}
              onRemove={() => field.handleChange(field.state.value.filter((_, i) => i !== index))}
            />
          ))}
          <button
            type="button"
            className="
              text-sm text-primary
              hover:underline
            "
            onClick={() => field.handleChange([...field.state.value, {
              mediaTypeId: "",
              beforeText: "",
              betweenText: "",
              afterText: "",
            }])}
          >
            {t("+ Add media type override")}
          </button>
        </div>
      )}
    </form.AppField>
  );
}

/** The "derive from a Sections property" picker for an itemInItems property. */
function ItemInItemsSourceField({
  form,
}: {
  form: PropertyFormApi;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data: customProperties,
  } = useCustomProperties();
  const sectionsOptions = [
    {
      value: "",
      label: t("None (manual entry)"),
    },
    ...(customProperties ?? [])
      .filter(property => property.type === "sections" && property.enabled)
      .map(property => ({
        value: property.id,
        label: property.name,
      })),
  ];
  return (
    <form.AppField name="itemInItemsSourcePropertyId">
      {field => (
        <div className="space-y-1">
          <field.SelectField
            label={t("Derive from Sections completion")}
            options={sectionsOptions}
            placeholder={t("None (manual entry)")}
          />
          <p className="text-xs text-muted-foreground">
            {t("When set, a bookmark's value is computed automatically from that Sections property — completed items of total items — overriding manual entry whenever sections exist.")}
          </p>
        </div>
      )}
    </form.AppField>
  );
}

export function ItemInItemsOptions({
  form,
  idPrefix,
  defaultOpen,
  full,
}: {
  form: PropertyFormApi;
  idPrefix: string;
  defaultOpen: boolean;
  full: boolean;
}) {
  return (
    <>
      {full ? <Separator /> : null}

      <CollapsibleFormSection
        title="Property options"
        description="Configure the text shown before, between, and after the two numbers."
        defaultOpen={defaultOpen}
        preview={(
          <form.Subscribe
            selector={state => ({
              itemInItemsBeforeText: state.values.itemInItemsBeforeText,
              itemInItemsBetweenText: state.values.itemInItemsBetweenText,
              itemInItemsAfterText: state.values.itemInItemsAfterText,
              overrideCount: state.values.itemInItemsMediaTypeTexts.length,
            })}
          >
            {values => summarizeItemInItemsOptions(values)}
          </form.Subscribe>
        )}
      >
        <div className="space-y-4">
          <form.AppField name="itemInItemsBeforeText">
            {field => (
              <field.TextField
                label="Text before current"
                placeholder="e.g. Page (leave blank for none)"
              />
            )}
          </form.AppField>
          <form.AppField name="itemInItemsBetweenText">
            {field => (
              <field.TextField
                label="Text between numbers"
                placeholder="e.g. &#32;of&#32;"
              />
            )}
          </form.AppField>
          <form.AppField name="itemInItemsAfterText">
            {field => (
              <field.TextField
                label="Text after total"
                placeholder="e.g. &#32;pages"
              />
            )}
          </form.AppField>
          <ItemInItemsMediaTypeTextsField form={form} />
          <ItemInItemsSourceField form={form} />
          <AllowDefaultField
            form={form}
            idPrefix={idPrefix}
            className="space-y-1"
          />
        </div>
      </CollapsibleFormSection>
    </>
  );
}
