import type { Category, CustomProperty, CustomPropertyType, MediaType, PropertyGroup } from "@eesimple/types";
import type { FC } from "react";

import { CHOICES_DISPLAY_LABELS } from "@eesimple/types";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { hasPropertyOptions } from "../lib/propertyForm";
import { DATE_TIME_FORMAT_LABELS, NUMBER_FORMAT_LABELS } from "../lib/propertyFormat";

import { DetailField } from "@/components/DetailField";
import { Badge } from "@/components/ui/badge";
import { useTranslatedLabel } from "@/hooks/useTranslatedLabel";
import i18n from "@/i18n";
import { CategoryIcon } from "@/lib/icons";
import { BOOLEAN_LABEL_PRESET_OPTIONS } from "@/lib/propertyForm";

/**
 * Where the property's field appears in the bookmark form. Read-only here — placement is edited
 * centrally in Settings → Display → Bookmark Add Form, not from this page.
 */
function formPlacement(property: CustomProperty): string {
  if (property.hiddenFromForm) return i18n.t("Hidden from the bookmark form");
  if (property.showInForm) return i18n.t("Shown in the main bookmark form");
  return i18n.t("Shown only in the Advanced area");
}

/** The "General" section body: status, description, created date. */
export function PropertyGeneralFields({
  property,
}: {
  property: CustomProperty;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <dl className="space-y-3">
      <DetailField label={t("Status")}>
        {property.enabled ? t("Enabled") : t("Disabled")}
      </DetailField>

      <DetailField label={t("Description")}>
        {property.description
          ? <p className="whitespace-pre-wrap">{property.description}</p>
          : null}
      </DetailField>

      <DetailField label={t("Created")}>
        <span>{new Date(property.createdAt).toLocaleString()}</span>
      </DetailField>
    </dl>
  );
}

interface PropertyOptionsFieldsProps {
  property: CustomProperty;
  allProperties?: CustomProperty[];
}

/** The shared "Allow default value" row, shown by every option type except boolean/calculate. */
function AllowDefaultField({
  property,
}: { property: CustomProperty }) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Allow default value")}>
      {property.allowDefault ? t("Allowed") : t("Hidden from category defaults")}
    </DetailField>
  );
}

/** Boolean option fields: how `true`/`false` values are displayed. Per-card display lives in rules. */
function BooleanOptionsFields({
  property,
}: PropertyOptionsFieldsProps) {
  const {
    t,
  } = useTranslation();
  const preset = BOOLEAN_LABEL_PRESET_OPTIONS.find(o => o.value === (property.booleanLabelPreset ?? "yes-no"));
  const labelsDisplay = property.booleanLabelPreset === "custom"
    ? t("Custom: {{trueLabel}} / {{falseLabel}}", {
      trueLabel: property.booleanTrueLabel || t("Yes"),
      falseLabel: property.booleanFalseLabel || t("No"),
    })
    : (preset?.label ?? t("Yes / No"));
  return (
    <>
      <DetailField label={t("How Values Display")}>{labelsDisplay}</DetailField>
      <DetailField label={t("Per-card display")}>
        {t("Configured per field under Card Display Rules")}
      </DetailField>
    </>
  );
}

/** Rating-scale option fields: scale bounds, half ratings, label, and default allowance. */
function RatingOptionsFields({
  property,
}: PropertyOptionsFieldsProps) {
  const {
    t,
  } = useTranslation();
  const min = property.ratingAllowZero ? 0 : 1;
  return (
    <>
      <DetailField label={t("Scale")}>{t("{{min}} – {{max}} stars", {
        min,
        max: property.ratingMax ?? 5,
      })}
      </DetailField>
      <DetailField label={t("Half ratings")}>{property.ratingAllowHalf ? t("Allowed") : t("Whole stars only")}</DetailField>
      <DetailField label={t("Label")}>
        {property.ratingShowLabel && property.ratingLabel ? property.ratingLabel : null}
      </DetailField>
      <AllowDefaultField property={property} />
    </>
  );
}

/** Number option fields: the numeric fields plus the default allowance. */
function NumericOptionsFields({
  property, allProperties = [],
}: PropertyOptionsFieldsProps) {
  const operandNames = property.operandPropertyIds
    .map(id => allProperties.find(candidate => candidate.id === id)?.name)
    .filter((value): value is string => Boolean(value));
  return (
    <>
      <NumericPropertyFields
        property={property}
        operandNames={operandNames}
      />
      <AllowDefaultField property={property} />
    </>
  );
}

/** Date-time option fields: what the value captures plus the default allowance. */
function DateTimeOptionsFields({
  property,
}: PropertyOptionsFieldsProps) {
  const {
    t,
  } = useTranslation();
  return (
    <>
      <DetailField label={t("Captures")}>
        {DATE_TIME_FORMAT_LABELS[property.dateTimeFormat ?? "date"]}
      </DetailField>
      <AllowDefaultField property={property} />
    </>
  );
}

/** Option fields for types whose only option is the default allowance (image/file). */
function BasicOptionsFields({
  property,
}: PropertyOptionsFieldsProps) {
  return <AllowDefaultField property={property} />;
}

/** Item-in-items option fields: the configured text segments shown around the two numbers. */
function ItemInItemsOptionsFields({
  property,
}: PropertyOptionsFieldsProps) {
  const {
    t,
  } = useTranslation();
  const before = property.itemInItemsBeforeText ?? "";
  const between = property.itemInItemsBetweenText ?? t(" of ");
  const after = property.itemInItemsAfterText ?? "";
  return (
    <>
      <DetailField label={t("Format preview")}>{`${before}10${between}100${after}`}</DetailField>
      {before ? <DetailField label={t("Text before")}>{before}</DetailField> : null}
      <DetailField label={t("Text between")}>{between}</DetailField>
      {after ? <DetailField label={t("Text after")}>{after}</DetailField> : null}
      <AllowDefaultField property={property} />
    </>
  );
}

/** Choices option fields: display type, selection mode, and the defined choices. */
function ChoicesOptionsFields({
  property,
}: PropertyOptionsFieldsProps) {
  const {
    t,
  } = useTranslation();
  const tLabel = useTranslatedLabel();
  return (
    <>
      <DetailField label={t("Display")}>
        {tLabel(CHOICES_DISPLAY_LABELS[property.choicesDisplay ?? "radio"])}
      </DetailField>
      <DetailField label={t("Selection")}>
        {property.choicesMultiple ? t("Multiple") : t("Single")}
      </DetailField>
      <DetailField label={t("Choices")}>
        {property.choicesItems.length > 0
          ? (
            <ul className="space-y-1">
              {property.choicesItems.map(item => (
                <li
                  key={item.value}
                  className="flex items-center gap-1.5 text-sm"
                >
                  {item.label}
                  {item.isDefault
                    ? (
                      <Badge variant="secondary">{t("Default")}</Badge>
                    )
                    : null}
                </li>
              ))}
            </ul>
          )
          : null}
      </DetailField>
      <AllowDefaultField property={property} />
    </>
  );
}

/**
 * Per-type options renderer. Keyed by every `CustomPropertyType` so a newly added type fails `tsc`
 * here rather than silently rendering no options. `null` means the type has no options section.
 */
const OPTIONS_FIELDS: Record<CustomPropertyType, FC<PropertyOptionsFieldsProps> | null> = {
  number: NumericOptionsFields,
  calculate: null,
  boolean: BooleanOptionsFields,
  datetime: DateTimeOptionsFields,
  ratingScale: RatingOptionsFields,
  image: BasicOptionsFields,
  file: BasicOptionsFields,
  choices: ChoicesOptionsFields,
  itemInItems: ItemInItemsOptionsFields,
  sections: null,
  text: null,
};

/** The "Property options" section body; renders nothing for calculate properties. */
export function PropertyOptionsFields({
  property, allProperties = [],
}: PropertyOptionsFieldsProps) {
  if (!hasPropertyOptions(property)) return null;
  const Fields = OPTIONS_FIELDS[property.type];
  if (!Fields) return null;
  return (
    <dl className="space-y-3">
      <Fields
        property={property}
        allProperties={allProperties}
      />
    </dl>
  );
}

/** The "Categories" section body: an "All categories" badge or the assigned category badges. */
export function PropertyCategoriesContent({
  property, categories = [],
}: {
  property: CustomProperty;
  categories?: Category[];
}) {
  const {
    t,
  } = useTranslation();
  const assignedCategories = categories.filter(category =>
    property.categoryIds.includes(category.id));
  if (property.allCategories || property.categoryIds.length === 0) {
    return <Badge variant="secondary">{t("All categories")}</Badge>;
  }
  return (
    <ul className="flex flex-wrap gap-1">
      {assignedCategories.map(category => (
        <li key={category.id}>
          <Badge
            variant="secondary"
            className="gap-1.5"
          >
            <CategoryIcon
              name={category.icon}
              className="size-3.5"
            />
            {category.name}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

/** The "Media Types" section body: the media types this property is also scoped to. */
export function PropertyMediaTypesContent({
  property, mediaTypes = [],
}: {
  property: CustomProperty;
  mediaTypes?: MediaType[];
}) {
  const {
    t,
  } = useTranslation();
  const assigned = mediaTypes.filter(mt => property.mediaTypeIds.includes(mt.id));
  if (property.allMediaTypes) return <Badge variant="secondary">{t("All media types")}</Badge>;
  if (assigned.length === 0) {
    return <span className="text-sm text-muted-foreground">{t("None")}</span>;
  }
  return (
    <ul className="flex flex-wrap gap-1">
      {assigned.map(mt => (
        <li key={mt.id}>
          <Badge variant="secondary">{mt.name}</Badge>
        </li>
      ))}
    </ul>
  );
}

/** The "Display" section body: group, form placement, listings, and card-menu editability. */
export function PropertyDisplayFields({
  property, propertyGroups = [],
}: {
  property: CustomProperty;
  propertyGroups?: PropertyGroup[];
}) {
  const {
    t,
  } = useTranslation();
  const group = property.propertyGroupId
    ? propertyGroups.find(candidate => candidate.id === property.propertyGroupId)
    : undefined;
  return (
    <dl className="space-y-3">
      <DetailField label={t("Group")}>
        {group
          ? (
            <Link
              to="/taxonomies/property-groups/$propertyGroupSlug"
              params={{
                propertyGroupSlug: group.slug,
              }}
              className="
                text-primary
                hover:underline
              "
            >
              {group.name}
            </Link>
          )
          : <span className="text-muted-foreground">{t("Ungrouped")}</span>}
      </DetailField>
      <DetailField label={t("Bookmark form")}>
        <div className="space-y-1">
          <p>{formPlacement(property)}</p>
          <p className="text-xs text-muted-foreground">
            {t("Managed in")}
            {" "}
            <Link
              to="/settings/display/bookmark-add"
              className="
                text-primary
                hover:underline
              "
            >
              {t("Bookmark Add Form settings")}
            </Link>
            .
          </p>
        </div>
      </DetailField>
      <DetailField label={t("Listings")}>
        {property.showInListings ? t("Shown on bookmark cards") : t("Hidden from bookmark cards")}
      </DetailField>
      <DetailField label={t("Details page")}>
        {property.showInDetails ? t("Shown on bookmark details page") : t("Hidden from bookmark details page")}
      </DetailField>
      {property.type === "calculate"
        ? null
        : (
          <>
            <DetailField label={t("Card menu")}>
              {property.editableOnCard ? t("Editable from the card menu") : t("Not editable from the card menu")}
            </DetailField>
            <DetailField label={t("CMD+K")}>
              {property.editableViaCmdk ? t("Editable via CMD+K") : t("Not editable via CMD+K")}
            </DetailField>
          </>
        )}
      {!["calculate", "image", "file", "itemInItems", "sections"].includes(property.type)
        ? (
          <DetailField label={t("Inbox pre-fill")}>
            {property.enabledInInbox ? t("Shown in the Inbox pre-fill box") : t("Not shown in the Inbox pre-fill box")}
          </DetailField>
        )
        : null}
    </dl>
  );
}

interface NumericPropertyFieldsProps {
  property: CustomProperty;
  operandNames: string[];
}

/** Renders the numeric/calculate-specific fields; called only when the type is numeric. */
function NumericPropertyFields({
  property, operandNames,
}: NumericPropertyFieldsProps) {
  const {
    t,
  } = useTranslation();
  const units = [property.unitSingular, property.unitPlural].filter(Boolean).join(" / ");
  return (
    <>
      <DetailField label={t("Range")}>
        {t("{{min}} – {{max}}", {
          min: property.numberMin ?? t("auto"),
          max: property.numberMax ?? t("auto"),
        })}
        {property.unitPlural ? ` ${property.unitPlural}` : ""}
      </DetailField>
      <DetailField label={t("Units")}>{units || null}</DetailField>
      <DetailField label={t("Value prefix")}>{property.valuePrefix}</DetailField>
      <DetailField label={t("Zero label")}>{property.zeroLabel}</DetailField>
      <DetailField label={t("Maximum label")}>{property.maxLabel}</DetailField>
      {property.type === "number"
        ? (
          <DetailField label={t("Number format")}>
            {NUMBER_FORMAT_LABELS[property.numberFormat ?? "plain"]}
          </DetailField>
        )
        : null}
      {property.type === "calculate"
        ? (
          <DetailField label={t("Operands")}>
            {operandNames.length > 0
              ? t("Σ {{operands}}", {
                operands: operandNames.join(" + "),
              })
              : null}
          </DetailField>
        )
        : null}
    </>
  );
}
