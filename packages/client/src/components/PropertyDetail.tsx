import type { Category, CustomProperty, MediaType, PropertyGroup } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

import { DetailHeaderActions } from "./DetailHeaderActions";
import { LabeledSection } from "./LabeledSection";
import { hasPropertyOptions } from "../lib/propertyForm";
import { DATE_TIME_FORMAT_LABELS, NUMBER_FORMAT_LABELS, TYPE_LABELS } from "../lib/propertyFormat";

import { DetailField } from "@/components/DetailField";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CategoryIcon } from "@/lib/icons";
import { BOOLEAN_LABEL_PRESET_OPTIONS } from "@/lib/propertyForm";

interface PropertyDetailProps {
  property: CustomProperty;
  /** All categories, used to resolve the assigned category names/icons. */
  categories?: Category[];
  /** All properties, used to resolve a calculate property's operand names. */
  allProperties?: CustomProperty[];
  /** All property groups, used to resolve the property's group name/link. */
  propertyGroups?: PropertyGroup[];
  onEdit?: () => void;
  onDelete?: () => void;
}

/** Where the property's field appears in the bookmark form. */
function formPlacement(property: CustomProperty): string {
  if (property.hiddenFromForm) return "Hidden from the bookmark form";
  if (property.showInForm) return "Shown in the main bookmark form";
  return "Shown only in the Advanced area";
}

const CORNER_LABELS: Record<NonNullable<CustomProperty["cardImageCorner"]>, string> = {
  "top-left": "Top-left",
  "top-right": "Top-right",
  "bottom-left": "Bottom-left",
  "bottom-right": "Bottom-right",
};

/** Describe a property's image-corner overlay placement, including its size and label options. */
function cornerPlacement(property: CustomProperty): string {
  if (!property.cardImageCorner) return "None (badge below image)";
  const parts = [CORNER_LABELS[property.cardImageCorner]];
  if (property.cardImageCornerScale !== 1) parts.push(`${property.cardImageCornerScale}× size`);
  if (property.cardImageCornerMobileScale != null) {
    parts.push(`${property.cardImageCornerMobileScale}× on mobile`);
  }
  if (property.cardImageCornerHideLabel) parts.push("label hidden");
  return parts.join(" · ");
}

/**
 * The full read-only view of a single custom property, showing every configured field. Shared by the
 * custom-property detail page and the right panel's property view so the two stay identical; the panel
 * simply renders it in its narrow column. Presentational: pass `categories`/`allProperties` for labels
 * and `onEdit`/`onDelete` for the header actions. The section bodies are also exported individually so
 * the tabbed detail pages can render one section per tab.
 */
export function PropertyDetail({
  property, categories = [], allProperties = [], propertyGroups = [], onEdit, onDelete,
}: PropertyDetailProps) {
  const assignedCategories = categories.filter(category =>
    property.categoryIds.includes(category.id));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold">{property.name}</h1>
          {assignedCategories.length === 0 && property.enabled && (
            <TriangleAlert className="size-4 text-amber-500" />
          )}
          {property.builtIn && <Badge variant="secondary">Built-in</Badge>}
          {!property.enabled && <Badge variant="outline">Disabled</Badge>}
          <Badge variant="secondary">{TYPE_LABELS[property.type]}</Badge>
        </div>
        <DetailHeaderActions
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      <Separator />

      <LabeledSection title="General">
        <PropertyGeneralFields property={property} />
      </LabeledSection>

      {hasPropertyOptions(property)
        ? (
          <>
            <Separator />

            <LabeledSection title="Property options">
              <PropertyOptionsFields
                property={property}
                allProperties={allProperties}
              />
            </LabeledSection>
          </>
        )
        : null}

      <Separator />

      <LabeledSection title="Categories">
        <PropertyCategoriesContent
          property={property}
          categories={categories}
        />
      </LabeledSection>

      <Separator />

      <LabeledSection title="Display">
        <PropertyDisplayFields
          property={property}
          propertyGroups={propertyGroups}
        />
      </LabeledSection>
    </div>
  );
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

/** The "Property options" section body; renders nothing for calculate properties. */
export function PropertyOptionsFields({
  property, allProperties = [],
}: {
  property: CustomProperty;
  allProperties?: CustomProperty[];
}) {
  const isNumeric = property.type === "number" || property.type === "calculate";
  const operandNames = property.operandPropertyIds
    .map(id => allProperties.find(candidate => candidate.id === id)?.name)
    .filter((value): value is string => Boolean(value));

  if (!hasPropertyOptions(property)) return null;

  if (property.type === "boolean") {
    const preset = BOOLEAN_LABEL_PRESET_OPTIONS.find(o => o.value === (property.booleanLabelPreset ?? "yes-no"));
    const labelsDisplay = property.booleanLabelPreset === "custom"
      ? `Custom: ${property.booleanTrueLabel || "Yes"} / ${property.booleanFalseLabel || "No"}`
      : (preset?.label ?? "Yes / No");
    const isIconPreset = property.booleanLabelPreset === "icons" || property.booleanLabelPreset === "stars";
    return (
      <dl className="space-y-3">
        <DetailField label="How Values Display">{labelsDisplay}</DetailField>
        <DetailField label="Hide label">
          {property.hideLabel ? "Yes — only the value is shown" : "No — property name is shown"}
        </DetailField>
        <DetailField label="Clickable in view">
          {property.clickableInView ? "Yes — click to toggle in detail view" : "No — read-only in detail view"}
        </DetailField>
        <DetailField label="Show if false">
          {property.showIfFalse
            ? "Yes — shown even when unchecked"
            : "No — hidden when unchecked"}
        </DetailField>
        {isIconPreset
          ? (
            <>
              <DetailField label="Colon after label">
                {property.showLabelColon ? "Yes" : "No"}
              </DetailField>
              <DetailField label="Value before label">
                {property.showValueBeforeLabel ? "Yes" : "No"}
              </DetailField>
            </>
          )
          : null}
      </dl>
    );
  }

  if (property.type === "ratingScale") {
    const min = property.ratingAllowZero ? 0 : 1;
    return (
      <dl className="space-y-3">
        <DetailField label="Scale">{`${min} – ${property.ratingMax ?? 5} stars`}</DetailField>
        <DetailField label="Half ratings">{property.ratingAllowHalf ? "Allowed" : "Whole stars only"}</DetailField>
        <DetailField label="Label">
          {property.ratingShowLabel && property.ratingLabel ? property.ratingLabel : null}
        </DetailField>
        <DetailField label="Allow default value">
          {property.allowDefault ? "Allowed" : "Hidden from category defaults"}
        </DetailField>
      </dl>
    );
  }

  return (
    <dl className="space-y-3">
      {isNumeric
        ? (
          <NumericPropertyFields
            property={property}
            operandNames={operandNames}
          />
        )
        : property.type === "datetime"
          ? (
            <DetailField label="Captures">
              {DATE_TIME_FORMAT_LABELS[property.dateTimeFormat ?? "date"]}
            </DetailField>
          )
          : null}
      {property.type !== "calculate" && (
        <DetailField label="Allow default value">
          {property.allowDefault ? "Allowed" : "Hidden from category defaults"}
        </DetailField>
      )}
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
      <DetailField label="Card image corner">{cornerPlacement(property)}</DetailField>
      {property.type === "calculate"
        ? null
        : (
          <DetailField label="Card menu">
            {property.editableOnCard ? "Editable from the card menu" : "Not editable from the card menu"}
          </DetailField>
        )}
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
