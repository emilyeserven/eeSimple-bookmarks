import type { ComboboxOption } from "../Combobox";
import type { CustomProperty, OverrideKey, WebsiteExtensionFillRule } from "@eesimple/types";
import type { ReactNode } from "react";

import { useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Lock, Pencil, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LabeledInput } from "./controls";
import { FillRuleFields } from "./FillRuleFields";

import { Button } from "@/components/ui/button";
import {
  describeFillFilter,
  describeFillRead,
  describeFillTarget,
  describeFillTransform,
  describePathMatch,
} from "@/lib/extensionFillForm";

/** Shared props for a rule card (draggable or grouped). */
interface FillRuleCardProps {
  rule: WebsiteExtensionFillRule;
  propertyOptions: ComboboxOption[];
  propertiesById: Map<string, CustomProperty>;
  onChange: (rule: WebsiteExtensionFillRule) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  /** Options a fill-rule group overrides — rendered read-only in the editor. */
  lockedKeys?: Set<OverrideKey>;
}

/**
 * One rule card: a header (optional drag handle + label + duplicate + a per-row Edit/Done toggle,
 * plus Delete while read-only) over either the full read-only detail or the live {@link FillRuleFields}
 * editor for just this rule. When the rule belongs to a group, `lockedKeys` renders its overridden
 * options read-only. This is the drag-agnostic body; {@link SortableFillRuleRow} wraps it with dnd-kit.
 */
export function FillRuleCard({
  rule, propertyOptions, propertiesById, onChange, onRemove, onDuplicate, lockedKeys, dragHandle,
}: FillRuleCardProps & { dragHandle?: ReactNode }) {
  const {
    t,
  } = useTranslation();
  // A configured rule (has a selector / meta key) loads read-only; a fresh/blank draft opens directly
  // into edit.
  const [isEditing, setIsEditing] = useState(() => (
    rule.extract.source === "meta"
      ? (rule.extract.metaKey ?? "").trim() === ""
      : (rule.extract.selector ?? "").trim() === ""
  ));
  const property = rule.target.kind === "customProperty"
    ? propertiesById.get(rule.target.propertyId)
    : undefined;
  const lockedCount = lockedKeys?.size ?? 0;
  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      <div className="flex items-end gap-2">
        {dragHandle}
        {isEditing
          ? (
            <FillRuleFieldsLabel
              rule={rule}
              onChange={onChange}
            />
          )
          : (
            <div className="flex-1 pb-2 text-sm font-medium">
              {rule.label.trim() || describeFillTarget(rule.target, property)}
              {lockedCount > 0
                ? (
                  <span
                    className="
                      ml-2 inline-flex items-center gap-1 align-middle text-xs
                      font-normal text-muted-foreground
                    "
                  >
                    <Lock className="size-3" />
                    {t("{{count}} set by group", {
                      count: lockedCount,
                    })}
                  </span>
                )
                : null}
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
        {!isEditing
          ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("Remove rule")}
              onClick={onRemove}
            >
              <X className="size-4" />
            </Button>
          )
          : null}
      </div>
      {isEditing
        ? (
          <>
            <FillRuleFields
              rule={rule}
              propertyOptions={propertyOptions}
              propertiesById={propertiesById}
              onChange={onChange}
              lockedKeys={lockedKeys}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onRemove}
              >
                <Trash2 className="mr-1 size-4" />
                {t("Delete rule")}
              </Button>
            </div>
          </>
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

/** The editable label field shown in a rule card's header while editing. */
function FillRuleFieldsLabel({
  rule, onChange,
}: {
  rule: WebsiteExtensionFillRule;
  onChange: (rule: WebsiteExtensionFillRule) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
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
  );
}

/** One draggable rule row for the ungrouped list — wraps {@link FillRuleCard} with dnd-kit. */
export function SortableFillRuleRow(props: FillRuleCardProps) {
  const {
    t,
  } = useTranslation();
  const {
    attributes, listeners, setNodeRef, transform, transition,
  } = useSortable({
    id: props.rule.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
    >
      <FillRuleCard
        {...props}
        dragHandle={(
          <button
            type="button"
            className="mb-2 cursor-grab touch-none text-muted-foreground"
            aria-label={t("Drag to reorder")}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        )}
      />
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
      {rule.extract.source === "meta"
        ? (
          <DetailRow
            label={t("Meta tag")}
            value={<code className="font-mono text-xs break-all">{rule.extract.metaKey}</code>}
          />
        )
        : (
          <DetailRow
            label={t("Selector")}
            value={<code className="font-mono text-xs break-all">{rule.extract.selector}</code>}
          />
        )}
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
          />
        )
        : null}
      {transforms.length > 0
        ? (
          <DetailRow
            label={t("Transforms")}
            value={<ul className="space-y-0.5">{transforms.map((transform, index) => <li key={index}>{describeFillTransform(transform)}</li>)}</ul>}
          />
        )
        : null}
    </dl>
  );
}

/** A `label : value` row inside a rule's detail list. */
function DetailRow({
  label, value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div
      className="
        grid gap-1
        sm:grid-cols-[8rem_1fr]
      "
    >
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{value}</dd>
    </div>
  );
}
