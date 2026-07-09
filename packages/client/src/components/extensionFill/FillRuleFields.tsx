import type { ComboboxOption } from "../Combobox";
import type { CustomProperty, FillExtract, FillTarget, WebsiteExtensionFillRule } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { LabeledInput } from "./controls";
import { FillFilterList } from "./FillFilterList";
import { FillReadField } from "./FillReadField";
import { FillTargetPicker } from "./FillTargetPicker";
import { FillTransformList } from "./FillTransformList";

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
      <LabeledInput
        label={t("Path suffix")}
        placeholder="/book"
        value={rule.pathSuffix ?? ""}
        onChange={value => onChange({
          ...rule,
          pathSuffix: value,
        })}
      />
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
