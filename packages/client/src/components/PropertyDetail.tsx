import type { Category, CustomProperty } from "@eesimple/types";

import { TriangleAlert } from "lucide-react";

import { DATE_TIME_FORMAT_LABELS, TYPE_LABELS } from "../lib/propertyFormat";

import { DetailField } from "@/components/DetailField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/lib/icons";

interface PropertyDetailProps {
  property: CustomProperty;
  /** All categories, used to resolve the assigned category names/icons. */
  categories?: Category[];
  /** All properties, used to resolve a calculate property's operand names. */
  allProperties?: CustomProperty[];
  onEdit?: () => void;
  onDelete?: () => void;
}

/** Where the property's field appears in the bookmark form. */
function formPlacement(property: CustomProperty): string {
  if (property.hiddenFromForm) return "Hidden from the bookmark form";
  if (property.showInForm) return "Shown in the main bookmark form";
  return "Shown only in the Advanced area";
}

/**
 * The full read-only view of a single custom property, showing every configured field. Shared by the
 * custom-property detail page and the right panel's property view so the two stay identical; the panel
 * simply renders it in its narrow column. Presentational: pass `categories`/`allProperties` for labels
 * and `onEdit`/`onDelete` for the header actions.
 */
export function PropertyDetail({
  property, categories = [], allProperties = [], onEdit, onDelete,
}: PropertyDetailProps) {
  const isNumeric = property.type === "number" || property.type === "calculate";
  const assignedCategories = categories.filter(category =>
    property.categoryIds.includes(category.id));
  const operandNames = property.operandPropertyIds
    .map(id => allProperties.find(candidate => candidate.id === id)?.name)
    .filter((value): value is string => Boolean(value));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold">{property.name}</h1>
          {assignedCategories.length === 0 && property.enabled && (
            <TriangleAlert className="size-4 text-amber-500" />
          )}
          {!property.enabled && <Badge variant="outline">Disabled</Badge>}
          <Badge variant="secondary">{TYPE_LABELS[property.type]}</Badge>
        </div>
        {onEdit || onDelete
          ? (
            <div className="flex shrink-0 items-center gap-1">
              {onEdit
                ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                  >
                    Edit
                  </Button>
                )
                : null}
              {onDelete
                ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="
                      text-destructive
                      hover:text-destructive
                    "
                  >
                    Delete
                  </Button>
                )
                : null}
            </div>
          )
          : null}
      </div>

      <dl className="space-y-3">
        <DetailField label="Status">
          {property.enabled ? "Enabled" : "Disabled"}
        </DetailField>

        <DetailField label="Description">
          {property.description
            ? <p className="whitespace-pre-wrap">{property.description}</p>
            : null}
        </DetailField>

        {isNumeric
          ? (
            <NumericPropertyFields
              property={property}
              operandNames={operandNames}
            />
          )
          : null}

        {property.type === "datetime"
          ? <DetailField label="Captures">{DATE_TIME_FORMAT_LABELS[property.dateTimeFormat ?? "date"]}</DetailField>
          : null}

        <DetailField label="Categories">
          {property.allCategories
            ? <Badge variant="secondary">All categories</Badge>
            : assignedCategories.length > 0
              ? (
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
              )
              : <span className="text-muted-foreground">None</span>}
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

        <DetailField label="Created">
          <span>{new Date(property.createdAt).toLocaleString()}</span>
        </DetailField>
      </dl>
    </div>
  );
}

interface NumericPropertyFieldsProps {
  property: CustomProperty;
  operandNames: string[];
}

/** Renders the numeric/calculate-specific fields; called only when `isNumeric` is true. */
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
