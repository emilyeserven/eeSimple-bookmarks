import type { FillExtract } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { KindSelect, LabeledInput } from "./controls";

type FillRead = NonNullable<FillExtract["read"]>;

/** Build the new read from the selected kind, carrying the attribute name across an `attr` switch. */
function nextRead(kind: FillRead["kind"], attrName: string): FillRead {
  if (kind === "attr") {
    return {
      kind: "attr",
      name: attrName,
    };
  }
  if (kind === "backgroundImage") return {
    kind: "backgroundImage",
  };
  if (kind === "svg") return {
    kind: "svg",
  };
  return {
    kind: "text",
  };
}

/**
 * Editor for how a value is read from the matched node: trimmed text (default), an attribute, the
 * `url(…)` from its computed `background-image` (a CSS-painted image), or an inline `<svg>` element
 * serialized to a `data:image/svg+xml` URI (a logo drawn as inline SVG markup).
 */
export function FillReadField({
  read, onChange,
}: {
  read: FillExtract["read"];
  onChange: (read: FillRead) => void;
}) {
  const {
    t,
  } = useTranslation();
  const kind = read?.kind ?? "text";
  const attrName = read?.kind === "attr" ? read.name : "";
  return (
    <div className="space-y-2">
      <KindSelect
        label={t("Read")}
        value={kind}
        options={[
          {
            value: "text",
            label: t("Text content"),
          },
          {
            value: "attr",
            label: t("Attribute"),
          },
          {
            value: "backgroundImage",
            label: t("Background image URL"),
          },
          {
            value: "svg",
            label: t("Inline SVG"),
          },
        ]}
        onValueChange={next => onChange(nextRead(next, attrName))}
      />
      {kind === "attr"
        ? (
          <LabeledInput
            label={t("Attribute name")}
            placeholder="data-value"
            value={attrName}
            onChange={name => onChange({
              kind: "attr",
              name,
            })}
          />
        )
        : null}
    </div>
  );
}
