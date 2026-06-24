import type { Category, CustomProperty, CustomPropertyType, MediaType, PropertyGroup } from "@eesimple/types";
import type { FC } from "react";

import { CHOICES_DISPLAY_LABELS } from "@eesimple/types";
import { Link } from "@tanstack/react-router";

import { hasPropertyOptions } from "../lib/propertyForm";
import { DATE_TIME_FORMAT_LABELS, NUMBER_FORMAT_LABELS } from "../lib/propertyFormat";

import { DetailField } from "@/components/DetailField";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/lib/icons";
import { BOOLEAN_LABEL_PRESET_OPTIONS } from "@/lib/propertyForm";

/** Where the property's field appears in the bookmark form. */
function formPlacement(property: CustomProperty): string {
  if (property.hiddenFromForm) return "Hidden from the bookmark form";
  if (property.showInForm) return "Shown in the main bookmark form";
  return "Shown only in the Advanced area";
}

/** The "General" section body: status, description, created date. */
export function PropertyGeneralFields({
  property,
}: {
  property: CustomProperty;
}) {
  return (
    <dl className="space-y-3">
      <DetailField label="Status">
        {property.enabled ? "Enabled" : "Disabled"}
      </DetailField>

      <DetailField label="Description">
        {property.description
          ? <p className="whitespace-pre-wrap">{property.description}</p>
          : null}
      </DetailField>

      <DetailField label="Created">
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
  return (
    <DetailField label="Allow default value">
      {property.allowDefault ? "Allowed" : "Hidden from category defaults"}
    </DetailField>
  );
}

/** Boolean option fields: how `true`/`false` values are displayed. Per-card display lives in rules. */
function BooleanOptionsFields({
  property,
}: PropertyOptionsFieldsProps) {
  const preset = BOOLEAN_LABEL_PRESET_OPTIONS.find(o => o.value === (property.booleanLabelPreset ?? "yes-no"));
  const labelsDisplay = property.booleanLabelPreset === "custom"
    ? `Custom: ${property.booleanTrueLabel || "Yes"} / ${property.booleanFalseLabel || "No"}`
    : (preset?.label ?? "Yes / No");
  return (
    <>
      <DetailField label="How Values Display">{labelsDisplay}</DetailField>
      <DetailField label="Per-card display">
        Configured per field under Card Display Rules
      </DetailField>
    </>
  );
}

/** Rating-scale option fields: scale bounds, half ratings, label, and default allowance. */
function RatingOptionsFields({
  property,
}: PropertyOptionsFieldsProps) {
  const min = property.ratingAllowZero ? 0 : 1;
  return (
    <>
      <DetailField label="Scale">{`${min} – ${property.ratingMax ?? 5} stars`}</DetailField>
      <DetailField label="Half ratings">{property.ratingAllowHalf ? "Allowed" : "Whole stars only"}</DetailField>
      <DetailField label="Label">
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
  return (
    <>
      <DetailField label="Captures">
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
  const before = property.itemInItemsBeforeText ?? "";
  const between = property.itemInItemsBetweenText ?? " of ";
  const after = property.itemInItemsAfterText ?? "";
  return (
    <>
      <DetailField label="Format preview">{`${before}10${between}100${after}`}</DetailField>
      {before ? <DetailField label="Text before">{before}</DetailField> : null}
      <DetailField label="Text between">{between}</DetailField>
      {after ? <DetailField label="Text after">{after}</DetailField> : null}
      <AllowDefaultField property={property} />
    </>
  );
}

/** Choices option fields: display type, selection mode, and the defined choices. */
function ChoicesOptionsFields({
  property,
}: PropertyOptionsFieldsProps) {
  return (
    <>
      <DetailField label="Display">
        {CHOICES_DISPLAY_LABELS[property.choicesDisplay ?? "radio"]}
      </DetailField>
      <DetailField label="Selection">
        {property.choicesMultiple ? "Multiple" : "Single"}
      </DetailField>
      <DetailField label="Choices">
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
                      <Badge variant="secondary">Default</Badge>
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
  const assignedCategories = categories.filter(category =>
    property.categoryIds.includes(category.id));
  if (property.allCategories) return <Badge variant="secondary">All categories</Badge>;
  if (assignedCategories.length === 0) {
    return <span className="text-sm text-muted-foreground">None</span>;
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
  const assigned = mediaTypes.filter(mt => property.mediaTypeIds.includes(mt.id));
  if (property.allMediaTypes) return <Badge variant="secondary">All media types</Badge>;
  if (assigned.length === 0) {
    return <span className="text-sm text-muted-foreground">None</span>;
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
  const group = property.propertyGroupId
    ? propertyGroups.find(candidate => candidate.id === property.propertyGroupId)
    : undefined;
  return (
    <dl className="space-y-3">
      <DetailField label="Group">
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
          : <span className="text-muted-foreground">Ungrouped</span>}
      </DetailField>
      <DetailField label="Bookmark form">{formPlacement(property)}</DetailField>
      <DetailField label="Listings">
        {property.showInListings ? "Shown on bookmark cards" : "Hidden from bookmark cards"}
      </DetailField>
      {property.type === "calculate"
        ? null
        : (
          <DetailField label="Card menu">
            {property.editableOnCard ? "Editable from the card menu" : "Not editable from the card menu"}
          </DetailField>
        )}
      {!["calculate", "image", "file", "itemInItems", "sections"].includes(property.type)
        ? (
          <DetailField label="Inbox pre-fill">
            {property.enabledInInbox ? "Shown in the Inbox pre-fill box" : "Not shown in the Inbox pre-fill box"}
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
  const units = [property.unitSingular, property.unitPlural].filter(Boolean).join(" / ");
  return (
    <>
      <DetailField label="Range">
        {`${property.numberMin ?? "auto"} – ${property.numberMax ?? "auto"}`}
        {property.unitPlural ? ` ${property.unitPlural}` : ""}
      </DetailField>
      <DetailField label="Units">{units || null}</DetailField>
      <DetailField label="Value prefix">{property.valuePrefix}</DetailField>
      <DetailField label="Zero label">{property.zeroLabel}</DetailField>
      <DetailField label="Maximum label">{property.maxLabel}</DetailField>
      {property.type === "number"
        ? (
          <DetailField label="Number format">
            {NUMBER_FORMAT_LABELS[property.numberFormat ?? "plain"]}
          </DetailField>
        )
        : null}
      {property.type === "calculate"
        ? (
          <DetailField label="Operands">
            {operandNames.length > 0 ? `Σ ${operandNames.join(" + ")}` : null}
          </DetailField>
        )
        : null}
    </>
  );
}
