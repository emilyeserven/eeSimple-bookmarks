import type { KindOption } from "./controls";
import type { FillFilter } from "@eesimple/types";

import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LabeledInput, LabeledNumberInput } from "./controls";
import { RowShell } from "./RowShell";
import { TextMatchEditor } from "./TextMatchEditor";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { coerceFillFilter, moveItem, newFillFilter } from "@/lib/extensionFillForm";

type FilterKind = FillFilter["kind"];
type AncestorFilter = Extract<FillFilter, { kind: "ancestorText" }>;
type ClosestFilter = Extract<FillFilter, { kind: "closest" }>;
type NthFilter = Extract<FillFilter, { kind: "nth" }>;

/** The dynamic list of {@link FillFilter} rows for one rule (add / remove / reorder). */
export function FillFilterList({
  filters, onChange,
}: {
  filters: FillFilter[];
  onChange: (filters: FillFilter[]) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-2">
      <Separator className="my-4" />
      <div className="text-base font-semibold">{t("Filters")}</div>
      <p className="text-xs text-muted-foreground">
        {t("Applied in order; each narrows which matched nodes remain.")}
      </p>
      {filters.map((filter, index) => (
        <FillFilterRow
          key={index}
          filter={filter}
          index={index}
          count={filters.length}
          onChange={next => onChange(filters.map((current, i) => (i === index ? next : current)))}
          onRemove={() => onChange(filters.filter((_, i) => i !== index))}
          onMove={direction => onChange(moveItem(filters, index, index + direction))}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...filters, newFillFilter()])}
      >
        <Plus className="mr-1 size-4" />
        {t("Add filter")}
      </Button>
    </div>
  );
}

function FillFilterRow({
  filter, index, count, onChange, onRemove, onMove,
}: {
  filter: FillFilter;
  index: number;
  count: number;
  onChange: (filter: FillFilter) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <RowShell<FilterKind>
      kindLabel={t("Filter type")}
      kind={filter.kind}
      kindOptions={FILTER_KIND_OPTIONS(t)}
      onKindChange={kind => onChange(coerceFillFilter(kind, filter))}
      index={index}
      count={count}
      onMove={onMove}
      onRemove={onRemove}
    >
      <FillFilterFields
        filter={filter}
        onChange={onChange}
      />
    </RowShell>
  );
}

/** The variant-specific inputs for the selected filter kind. */
function FillFilterFields({
  filter, onChange,
}: {
  filter: FillFilter;
  onChange: (filter: FillFilter) => void;
}) {
  switch (filter.kind) {
    case "selfText":
    case "siblingText":
      return (
        <TextMatchEditor
          match={filter.match}
          onChange={match => onChange({
            ...filter,
            match,
          })}
        />
      );
    case "ancestorText":
      return (
        <AncestorTextFields
          filter={filter}
          onChange={onChange}
        />
      );
    case "closest":
      return (
        <ClosestFields
          filter={filter}
          onChange={onChange}
        />
      );
    case "nth":
      return (
        <NthFields
          filter={filter}
          onChange={onChange}
        />
      );
  }
}

function AncestorTextFields({
  filter, onChange,
}: {
  filter: AncestorFilter;
  onChange: (filter: FillFilter) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-2">
      <TextMatchEditor
        match={filter.match}
        onChange={match => onChange({
          ...filter,
          match,
        })}
      />
      <LabeledNumberInput
        label={t("Max depth")}
        value={filter.maxDepth}
        onChange={maxDepth => onChange({
          ...filter,
          maxDepth,
        })}
      />
    </div>
  );
}

function ClosestFields({
  filter, onChange,
}: {
  filter: ClosestFilter;
  onChange: (filter: FillFilter) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <LabeledInput
      label={t("Closest selector")}
      placeholder=".stat-block"
      value={filter.selector}
      onChange={selector => onChange({
        ...filter,
        selector,
      })}
    />
  );
}

function NthFields({
  filter, onChange,
}: {
  filter: NthFilter;
  onChange: (filter: FillFilter) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <LabeledNumberInput
      label={t("Index")}
      value={filter.index}
      onChange={index => onChange({
        ...filter,
        index: index ?? 0,
      })}
    />
  );
}

function FILTER_KIND_OPTIONS(t: (key: string) => string): KindOption<FilterKind>[] {
  return [
    {
      value: "selfText",
      label: t("Self text"),
    },
    {
      value: "siblingText",
      label: t("Sibling text"),
    },
    {
      value: "ancestorText",
      label: t("Ancestor text"),
    },
    {
      value: "closest",
      label: t("Closest ancestor"),
    },
    {
      value: "nth",
      label: t("Nth match"),
    },
  ];
}
