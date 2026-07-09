import type { FillExtract } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { KindSelect, LabeledInput } from "./controls";

type FillRead = NonNullable<FillExtract["read"]>;

/** Editor for how a value is read from the matched node: trimmed text (default) or an attribute. */
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
        ]}
        onValueChange={next => onChange(next === "attr"
          ? {
            kind: "attr",
            name: attrName,
          }
          : {
            kind: "text",
          })}
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
