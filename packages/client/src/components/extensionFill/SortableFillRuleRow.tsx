import type { ComboboxOption } from "../Combobox";
import type { CustomProperty, WebsiteExtensionFillRule } from "@eesimple/types";
import type { ReactNode } from "react";

import { useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Pencil, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LabeledInput } from "./controls";
import { FillRuleFields } from "./FillRuleFields";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  describeFillFilter,
  describeFillRead,
  describeFillTarget,
  describeFillTransform,
  describePathMatch,
} from "@/lib/extensionFillForm";
import { cn } from "@/lib/utils";

/**
 * One draggable rule row: a header (drag + label + duplicate/remove + a per-row Edit/Done toggle) over
 * either the full read-only detail (`label : value` rows, so a fiddly rule can't change by accident)
 * or the live {@link FillRuleFields} editor for just this rule — editing one rule never affects any
 * other row's state.
 */
export function SortableFillRuleRow({
  rule, propertyOptions, propertiesById, onChange, onRemove, onDuplicate,
}: {
  rule: WebsiteExtensionFillRule;
  propertyOptions: ComboboxOption[];
  propertiesById: Map<string, CustomProperty>;
  onChange: (rule: WebsiteExtensionFillRule) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}) {
  const {
    t,
  } = useTranslation();
  // A configured rule (has a selector) loads read-only; a fresh/blank draft opens directly into edit.
  const [isEditing, setIsEditing] = useState(() => rule.extract.selector.trim() === "");
  const {
    attributes, listeners, setNodeRef, transform, transition,
  } = useSortable({
    id: rule.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const property = rule.target.kind === "customProperty"
    ? propertiesById.get(rule.target.propertyId)
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="space-y-3 rounded-lg border bg-card p-3"
    >
      <div className="flex items-end gap-2">
        <button
          type="button"
          className="mb-2 cursor-grab touch-none text-muted-foreground"
          aria-label={t("Drag to reorder")}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        {isEditing
          ? (
            <LabeledInput
              className="flex-1"
              label={t("Label")}
              placeholder={t("e.g. Print length")}
              value={rule.label}
              onChange={label => onChange({
                ...rule,
                label,
              })}
            />
          )
          : (
            <div className="flex-1 pb-2 text-sm font-medium">
              {rule.label.trim() || describeFillTarget(rule.target, property)}
            </div>
          )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => setIsEditing(current => !current)}
        >
          {isEditing
            ? t("Done")
            : (
              <>
                <Pencil className="mr-1 size-4" />
                {t("Edit")}
              </>
            )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("Duplicate rule")}
          onClick={onDuplicate}
        >
          <Copy className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("Remove rule")}
          onClick={onRemove}
        >
          <X className="size-4" />
        </Button>
      </div>
      {isEditing
        ? (
          <FillRuleFields
            rule={rule}
            propertyOptions={propertyOptions}
            propertiesById={propertiesById}
            onChange={onChange}
          />
        )
        : (
          <RuleDetailList
            rule={rule}
            property={property}
          />
        )}
    </div>
  );
}

/** The full read-only detail for one rule: label header over a `label : value` detail list. */
function RuleDetailList({
  rule, property,
}: {
  rule: WebsiteExtensionFillRule;
  property?: CustomProperty;
}) {
  const {
    t,
  } = useTranslation();
  const filters = rule.extract.filters ?? [];
  const transforms = rule.extract.transform ?? [];
  return (
    <dl className="space-y-1 pl-8 text-sm">
      <DetailRow
        label={t("Target")}
        value={describeFillTarget(rule.target, property)}
      />
      {rule.pathMatch
        ? (
          <DetailRow
            label={t("Path match")}
            value={describePathMatch(rule.pathMatch)}
          />
        )
        : null}
      <DetailRow
        label={t("Selector")}
        value={<code className="font-mono text-xs break-all">{rule.extract.selector}</code>}
      />
      {rule.extract.read?.kind === "attr"
        ? (
          <DetailRow
            label={t("Read")}
            value={describeFillRead(rule.extract.read)}
          />
        )
        : null}
      {rule.target.kind === "taxonomy" && rule.extract.split
        ? (
          <DetailRow
            label={t("Split on")}
            value={<code className="font-mono text-xs">{rule.extract.split}</code>}
          />
        )
        : null}
      {filters.length > 0
        ? (
          <DetailRow
            label={t("Filters")}
            value={<ul className="space-y-0.5">{filters.map((filter, index) => <li key={index}>{describeFillFilter(filter)}</li>)}</ul>}
            separatorAbove
            emphasized
          />
        )
        : null}
      {transforms.length > 0
        ? (
          <DetailRow
            label={t("Transforms")}
            value={<ul className="space-y-0.5">{transforms.map((transform, index) => <li key={index}>{describeFillTransform(transform)}</li>)}</ul>}
            separatorAbove
            emphasized
          />
        )
        : null}
    </dl>
  );
}

/** A `label : value` row inside a rule's detail list, optionally separated + emphasized (Filters/Transforms). */
function DetailRow({
  label, value, separatorAbove = false, emphasized = false,
}: {
  label: string;
  value: ReactNode;
  /** Render a horizontal divider above this row — used to set the Filters/Transforms sections apart. */
  separatorAbove?: boolean;
  /** Render the label larger/bolder than a plain detail label — used for the Filters/Transforms headers. */
  emphasized?: boolean;
}) {
  return (
    <>
      {separatorAbove ? <Separator className="my-2" /> : null}
      <div
        className="
          grid gap-1
          sm:grid-cols-[8rem_1fr]
        "
      >
        <dt
          className={cn(emphasized
            ? "text-base font-semibold text-foreground"
            : "text-muted-foreground")}
        >
          {label}
        </dt>
        <dd className="min-w-0">{value}</dd>
      </div>
    </>
  );
}
