import type { KindOption } from "./controls";
import type { ComboboxOption } from "../Combobox";
import type { CustomProperty, FillExtract, FillTarget, PathMatch, WebsiteExtensionFillRule } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { KindSelect, LabeledInput } from "./controls";
import { FillFilterList } from "./FillFilterList";
import { FillReadField } from "./FillReadField";
import { FillTargetPicker } from "./FillTargetPicker";
import { FillTransformList } from "./FillTransformList";

import { newPathMatch } from "@/lib/extensionFillForm";

const PATH_MATCH_MODE_OPTIONS: KindOption<PathMatch["mode"]>[] = [
  {
    value: "prefix",
    label: "Starts with",
  },
  {
    value: "contains",
    label: "Contains",
  },
  {
    value: "suffix",
    label: "Ends with",
  },
  {
    value: "regex",
    label: "Matches regex",
  },
];

/**
 * Swap a rule's target. When switching to an image target, default the read to the `<img>` `src`
 * attribute (unless the user already chose an attribute) — the common way to grab a page image.
 */
function applyTargetChange(
  rule: WebsiteExtensionFillRule,
  target: FillTarget,
): WebsiteExtensionFillRule {
  if (target.kind === "image" && rule.extract.read?.kind !== "attr") {
    return {
      ...rule,
      target,
      extract: {
        ...rule.extract,
        read: {
          kind: "attr",
          name: "src",
        },
      },
    };
  }
  return {
    ...rule,
    target,
  };
}

/** The body of one extraction rule: path gate, target, selector, read mode, split, filters, transforms. */
export function FillRuleFields({
  rule, propertyOptions, propertiesById, onChange,
}: {
  rule: WebsiteExtensionFillRule;
  propertyOptions: ComboboxOption[];
  propertiesById: Map<string, CustomProperty>;
  onChange: (rule: WebsiteExtensionFillRule) => void;
}) {
  const {
    t,
  } = useTranslation();
  function patchExtract(patch: Partial<FillExtract>): void {
    onChange({
      ...rule,
      extract: {
        ...rule.extract,
        ...patch,
      },
    });
  }
  function patchPathMatch(patch: Partial<PathMatch>): void {
    onChange({
      ...rule,
      pathMatch: {
        ...(rule.pathMatch ?? newPathMatch()),
        ...patch,
      },
    });
  }
  const pathMatch = rule.pathMatch ?? newPathMatch();
  return (
    <div
      className="
        grid gap-3
        sm:grid-cols-2
      "
    >
      <FillTargetPicker
        target={rule.target}
        propertyOptions={propertyOptions}
        propertiesById={propertiesById}
        onChange={target => onChange(applyTargetChange(rule, target))}
      />
      <div
        className="
          grid gap-3
          sm:col-span-2 sm:grid-cols-2
        "
      >
        <KindSelect
          label={t("Path match")}
          value={pathMatch.mode}
          options={PATH_MATCH_MODE_OPTIONS.map(option => ({
            ...option,
            label: t(option.label),
          }))}
          onValueChange={mode => patchPathMatch({
            mode,
          })}
        />
        <LabeledInput
          label={t("Path value")}
          placeholder="/course/"
          value={pathMatch.value}
          onChange={value => patchPathMatch({
            value,
          })}
        />
      </div>
      <LabeledInput
        className="sm:col-span-2"
        label={t("Selector")}
        placeholder="._statBlockTitle_1ckth_86 > *"
        value={rule.extract.selector}
        onChange={selector => patchExtract({
          selector,
        })}
      />
      <FillReadField
        read={rule.extract.read}
        onChange={read => patchExtract({
          read,
        })}
      />
      {rule.target.kind === "taxonomy"
        ? (
          <LabeledInput
            label={t("Split on")}
            placeholder=", "
            value={rule.extract.split ?? ""}
            onChange={split => patchExtract({
              split,
            })}
          />
        )
        : null}
      <div
        className="
          space-y-3
          sm:col-span-2
        "
      >
        <FillFilterList
          filters={rule.extract.filters ?? []}
          onChange={filters => patchExtract({
            filters,
          })}
        />
        <FillTransformList
          transforms={rule.extract.transform ?? []}
          onChange={transform => patchExtract({
            transform,
          })}
        />
      </div>
    </div>
  );
}
