import type { KindOption } from "./controls";
import type { FillTransform } from "@eesimple/types";

import { useState } from "react";

import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LabeledInput, LabeledNumberInput } from "./controls";
import { RowShell } from "./RowShell";

import { Button } from "@/components/ui/button";
import { coerceFillTransform, moveItem, newFillTransform } from "@/lib/extensionFillForm";
import { applyFillTransforms } from "@/lib/fillTransformPreview";

type TransformKind = FillTransform["kind"];
type RegexTransform = Extract<FillTransform, { kind: "regex" }>;
type ReplaceTransform = Extract<FillTransform, { kind: "replace" }>;

/** The dynamic list of {@link FillTransform} rows for one rule (add / remove / reorder). */
export function FillTransformList({
  transforms, onChange,
}: {
  transforms: FillTransform[];
  onChange: (transforms: FillTransform[]) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{t("Transforms")}</div>
      <p className="text-xs text-muted-foreground">
        {t("Applied in order to the extracted string.")}
      </p>
      {transforms.map((transform, index) => (
        <FillTransformRow
          key={index}
          transform={transform}
          index={index}
          count={transforms.length}
          onChange={next => onChange(transforms.map((current, i) => (i === index ? next : current)))}
          onRemove={() => onChange(transforms.filter((_, i) => i !== index))}
          onMove={direction => onChange(moveItem(transforms, index, index + direction))}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...transforms, newFillTransform()])}
      >
        <Plus className="mr-1 size-4" />
        {t("Add transform")}
      </Button>
      {transforms.length > 0 ? <TransformPreview transforms={transforms} /> : null}
    </div>
  );
}

/**
 * Live preview: run the rule's transforms (in order) over user-supplied sample text so the user can
 * test them without a live page. Mirrors the extension's per-value pipeline via
 * {@link applyFillTransforms}; runs the transforms only (not the selector/read/split stages).
 */
function TransformPreview({
  transforms,
}: {
  transforms: FillTransform[];
}) {
  const {
    t,
  } = useTranslation();
  const [sample, setSample] = useState("");
  const result = applyFillTransforms(sample, transforms);
  return (
    <div className="mt-2 space-y-1 rounded-md border border-dashed p-2">
      <LabeledInput
        label={t("Sample text")}
        placeholder="77h 32m"
        value={sample}
        onChange={setSample}
      />
      <p className="text-xs text-muted-foreground">
        {sample && result
          ? (
            <>
              {t("Result")}
              {": "}
              <span className="font-mono text-foreground">{result}</span>
            </>
          )
          : t("Type sample text to preview the transformed result.")}
      </p>
    </div>
  );
}

function FillTransformRow({
  transform, index, count, onChange, onRemove, onMove,
}: {
  transform: FillTransform;
  index: number;
  count: number;
  onChange: (transform: FillTransform) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <RowShell<TransformKind>
      kindLabel={t("Transform type")}
      kind={transform.kind}
      kindOptions={TRANSFORM_KIND_OPTIONS(t)}
      onKindChange={kind => onChange(coerceFillTransform(kind, transform))}
      index={index}
      count={count}
      onMove={onMove}
      onRemove={onRemove}
    >
      <FillTransformFields
        transform={transform}
        onChange={onChange}
      />
    </RowShell>
  );
}

/** The variant-specific inputs for the selected transform kind (`number`/`trim` take none). */
function FillTransformFields({
  transform, onChange,
}: {
  transform: FillTransform;
  onChange: (transform: FillTransform) => void;
}) {
  switch (transform.kind) {
    case "regex":
      return (
        <RegexFields
          transform={transform}
          onChange={onChange}
        />
      );
    case "replace":
      return (
        <ReplaceFields
          transform={transform}
          onChange={onChange}
        />
      );
    case "number":
    case "duration":
    case "trim":
      return null;
  }
}

function RegexFields({
  transform, onChange,
}: {
  transform: RegexTransform;
  onChange: (transform: FillTransform) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-2">
      <LabeledInput
        label={t("Pattern")}
        placeholder="(\\d+)"
        value={transform.pattern}
        onChange={pattern => onChange({
          ...transform,
          pattern,
        })}
      />
      <div className="grid grid-cols-2 gap-2">
        <LabeledInput
          label={t("Flags")}
          placeholder="i"
          value={transform.flags ?? ""}
          onChange={flags => onChange({
            ...transform,
            flags: flags || undefined,
          })}
        />
        <LabeledNumberInput
          label={t("Capture group")}
          value={transform.group}
          onChange={group => onChange({
            ...transform,
            group,
          })}
        />
      </div>
    </div>
  );
}

function ReplaceFields({
  transform, onChange,
}: {
  transform: ReplaceTransform;
  onChange: (transform: FillTransform) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-2">
      <LabeledInput
        label={t("Pattern")}
        placeholder=","
        value={transform.pattern}
        onChange={pattern => onChange({
          ...transform,
          pattern,
        })}
      />
      <div className="grid grid-cols-2 gap-2">
        <LabeledInput
          label={t("Flags")}
          placeholder="g"
          value={transform.flags ?? ""}
          onChange={flags => onChange({
            ...transform,
            flags: flags || undefined,
          })}
        />
        <LabeledInput
          label={t("Replacement")}
          value={transform.replacement}
          onChange={replacement => onChange({
            ...transform,
            replacement,
          })}
        />
      </div>
    </div>
  );
}

function TRANSFORM_KIND_OPTIONS(t: (key: string) => string): KindOption<TransformKind>[] {
  return [
    {
      value: "regex",
      label: t("Regex extract"),
    },
    {
      value: "number",
      label: t("First number"),
    },
    {
      value: "duration",
      label: t("Duration → seconds"),
    },
    {
      value: "replace",
      label: t("Replace"),
    },
    {
      value: "trim",
      label: t("Trim"),
    },
  ];
}
