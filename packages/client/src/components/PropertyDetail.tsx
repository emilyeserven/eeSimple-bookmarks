import type { Category, CustomProperty } from "@eesimple/types";
import type { ReactNode } from "react";

import { TriangleAlert } from "lucide-react";

import { TYPE_LABELS } from "../lib/propertyFormat";

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

/** A labelled field row in the detail layout; renders nothing when its value is empty. */
function Field({
  label, children,
}: {
  label: string;
  children: ReactNode;
}) {
  if (children === null || children === undefined || children === false) return null;
  return (
    <div
      className="
        grid gap-1
        sm:grid-cols-[10rem_1fr] sm:gap-4
      "
    >
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm text-foreground">{children}</dd>
    </div>
  );
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

  const units = [property.unitSingular, property.unitPlural].filter(Boolean).join(" / ");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold">{property.name}</h1>
          {assignedCategories.length === 0 && (
            <TriangleAlert className="size-4 text-amber-500" />
          )}
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
        <Field label="Description">
          {property.description
            ? <p className="whitespace-pre-wrap">{property.description}</p>
            : null}
        </Field>

        {isNumeric
          ? (
            <Field label="Range">
              {`${property.numberMin ?? "auto"} – ${property.numberMax ?? "auto"}`}
              {property.unitPlural ? ` ${property.unitPlural}` : ""}
            </Field>
          )
          : null}

        {isNumeric ? <Field label="Units">{units || null}</Field> : null}
        {isNumeric ? <Field label="Value prefix">{property.valuePrefix}</Field> : null}
        {isNumeric ? <Field label="Zero label">{property.zeroLabel}</Field> : null}
        {isNumeric ? <Field label="Maximum label">{property.maxLabel}</Field> : null}

        {property.type === "calculate"
          ? <Field label="Operands">{operandNames.length > 0 ? `Σ ${operandNames.join(" + ")}` : null}</Field>
          : null}

        <Field label="Categories">
          {assignedCategories.length > 0
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
        </Field>

        <Field label="Bookmark form">{formPlacement(property)}</Field>
        <Field label="Listings">
          {property.showInListings ? "Shown on bookmark cards" : "Hidden from bookmark cards"}
        </Field>

        <Field label="Created">
          <span>{new Date(property.createdAt).toLocaleString()}</span>
        </Field>
      </dl>
    </div>
  );
}
