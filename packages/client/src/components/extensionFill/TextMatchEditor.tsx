import type { TextMatch } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { KindSelect, LabeledInput } from "./controls";

import { Checkbox } from "@/components/ui/checkbox";

/** Editor for a {@link TextMatch}: match mode, value, and a case-sensitivity toggle. */
export function TextMatchEditor({
  match, onChange,
}: {
  match: TextMatch;
  onChange: (match: TextMatch) => void;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-2">
      <KindSelect
        label={t("Match mode")}
        value={match.mode}
        options={[
          {
            value: "equals",
            label: t("Equals"),
          },
          {
            value: "contains",
            label: t("Contains"),
          },
          {
            value: "regex",
            label: t("Regex"),
          },
        ]}
        onValueChange={mode => onChange({
          ...match,
          mode,
        })}
      />
      <LabeledInput
        label={t("Match value")}
        value={match.value}
        onChange={value => onChange({
          ...match,
          value,
        })}
      />
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={match.caseSensitive ?? false}
          onCheckedChange={checked => onChange({
            ...match,
            caseSensitive: checked === true,
          })}
        />
        {t("Case sensitive")}
      </label>
    </div>
  );
}
