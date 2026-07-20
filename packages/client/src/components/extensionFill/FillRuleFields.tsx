import type { KindOption } from "./controls";
import type { ComboboxOption } from "../Combobox";
import type { CustomProperty, FillExtract, FillTarget, OverrideKey, PathMatch, WebsiteExtensionFillRule } from "@eesimple/types";

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
 * Swap a rule's target. When switching to an image target (the `image` kind, or a `taxonomyDirect`
 * entity image field), default the read to the `<img>` `src` attribute (unless the user already chose
 * an attribute or a CSS `background-image` read) — the common way to grab a page image. When switching
 * to a `taxonomyEntity`
 * primary-language target with a still-blank extract, default to the `og:locale` meta tag — the usual
 * page-language signal.
 */
function applyTargetChange(
  rule: WebsiteExtensionFillRule,
  target: FillTarget,
): WebsiteExtensionFillRule {
  const grabsImage = target.kind === "image"
    || (target.kind === "taxonomyDirect" && target.field === "image");
  // Keep an already-image-oriented read (an attribute like `src`, a CSS `background-image`, or an
  // inline `<svg>`); otherwise default to the common `<img>` `src`.
  const keepsImageRead = rule.extract.read?.kind === "attr"
    || rule.extract.read?.kind === "backgroundImage"
    || rule.extract.read?.kind === "svg";
  if (grabsImage && !keepsImageRead) {
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
  if (
    target.kind === "taxonomyEntity"
    && target.field === "language"
    && !rule.extract.selector
    && !rule.extract.metaKey
  ) {
    return {
      ...rule,
      target,
      extract: {
        ...rule.extract,
        source: "meta",
        metaKey: "og:locale",
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
  rule, propertyOptions, propertiesById, onChange, lockedKeys,
}: {
  rule: WebsiteExtensionFillRule;
  propertyOptions: ComboboxOption[];
  propertiesById: Map<string, CustomProperty>;
  onChange: (rule: WebsiteExtensionFillRule) => void;
  /** Options a fill-rule group overrides — rendered read-only here. */
  lockedKeys?: Set<OverrideKey>;
}) {
  const {
    t,
  } = useTranslation();
  const pathMatchLocked = lockedKeys?.has("pathMatch") ?? false;
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
    <div className="grid gap-3">
      <FillTargetPicker
        target={rule.target}
        propertyOptions={propertyOptions}
        propertiesById={propertiesById}
        onChange={target => onChange(applyTargetChange(rule, target))}
        lockedKeys={lockedKeys}
        extractSelector={rule.extract.selector ?? ""}
        onExtractSelectorChange={selector => patchExtract({
          selector,
        })}
      />
      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        <KindSelect
          label={t("Path match")}
          disabled={pathMatchLocked}
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
          disabled={pathMatchLocked}
          placeholder="/course/"
          value={pathMatch.value}
          onChange={value => patchPathMatch({
            value,
          })}
        />
      </div>
      <KindSelect<NonNullable<FillExtract["source"]>>
        label={t("Source")}
        value={rule.extract.source ?? "selector"}
        options={[
          {
            value: "selector",
            label: t("CSS selector"),
          },
          {
            value: "meta",
            label: t("Meta tag"),
          },
        ]}
        onValueChange={source => patchExtract(
          // A meta tag always reads its `content`; drop any leftover attribute read from selector mode.
          source === "meta"
            ? {
              source,
              read: undefined,
            }
            : {
              source,
            },
        )}
      />
      {rule.extract.source === "meta"
        ? (
          <LabeledInput
            label={t("Meta tag name")}
            placeholder="og:book:author"
            value={rule.extract.metaKey ?? ""}
            onChange={metaKey => patchExtract({
              metaKey,
            })}
          />
        )
        : rule.target.kind === "sections"
          // The sections item selector is rendered inline in the Sections form (largest → smallest order).
          ? null
          : (
            <LabeledInput
              label={t("Selector")}
              placeholder="._statBlockTitle_1ckth_86 > *"
              value={rule.extract.selector ?? ""}
              onChange={selector => patchExtract({
                selector,
              })}
              hint={t("Tip: for a class with a rotating hash suffix, match a stable substring with [class*=\"partial-class\"].")}
            />
          )}
      {/* A meta tag always reads its `content` attribute — the read control is selector-only. */}
      {rule.extract.source === "meta"
        ? null
        : (
          <FillReadField
            read={rule.extract.read}
            onChange={read => patchExtract({
              read,
            })}
          />
        )}
      {/* Node exclusion strips matching descendants before a text read — only meaningful for the
          default text read on a selector source. */}
      {rule.extract.source !== "meta" && (rule.extract.read == null || rule.extract.read.kind === "text")
        ? (
          <LabeledInput
            label={t("Exclude selectors")}
            placeholder=".read-more, .price-badge"
            value={(rule.extract.excludeSelectors ?? []).join(", ")}
            onChange={value => patchExtract({
              excludeSelectors: value.split(",").map(selector => selector.trim()).filter(Boolean),
            })}
            hint={t("Comma-separated descendant selectors removed before reading the element's text (e.g. drop a nested \"Read more\" button).")}
          />
        )
        : null}
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
      <div className="space-y-3">
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
