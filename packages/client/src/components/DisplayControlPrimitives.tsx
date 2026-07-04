import type { ViewMode } from "../lib/bookmarkColumns";

import { useTranslation } from "react-i18next";

import { COLUMN_OPTIONS } from "../lib/bookmarkColumns";

import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** Shared "View" cards/table toggle row used by listing + section display controls. */
export function ViewModeToggle({
  value, onChange,
}: { value: ViewMode;
  onChange: (value: ViewMode) => void; }) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm font-medium">{t("View")}</Label>
      <ToggleGroup
        type="single"
        size="sm"
        value={value}
        className="gap-0 overflow-hidden rounded-md border border-input"
        onValueChange={(next) => {
          if (next) onChange(next as ViewMode);
        }}
      >
        <ToggleGroupItem
          value="cards"
          className="
            rounded-none border-r border-input
            first:rounded-l-sm
          "
        >
          {t("Cards")}
        </ToggleGroupItem>
        <ToggleGroupItem
          value="table"
          className="
            rounded-none
            last:rounded-r-sm
          "
        >
          {t("Table")}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

/** Shared "Columns" count selector used by listing + section display controls. */
export function ColumnsSelect({
  value, onChange,
}: { value: number;
  onChange: (value: number) => void; }) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm font-medium">{t("Columns")}</Label>
      <ToggleGroup
        type="single"
        size="sm"
        value={String(value)}
        className="gap-0 overflow-hidden rounded-md border border-input"
        onValueChange={(next) => {
          if (next) onChange(Number(next));
        }}
      >
        {COLUMN_OPTIONS.map(option => (
          <ToggleGroupItem
            key={option}
            value={String(option)}
            className="
              rounded-none border-r border-input
              first:rounded-l-sm
              last:rounded-r-sm last:border-r-0
            "
          >
            {option}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

/** Shared On/Off two-state toggle row body (the toggle group only; caller supplies the label/wrapper). */
export function OnOffToggleGroup({
  value, onChange,
}: { value: boolean;
  onChange: (value: boolean) => void; }) {
  const {
    t,
  } = useTranslation();
  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={value ? "on" : "off"}
      className="gap-0 overflow-hidden rounded-md border border-input"
      onValueChange={(next) => {
        if (next) onChange(next === "on");
      }}
    >
      <ToggleGroupItem
        value="on"
        className="
          rounded-none border-r border-input
          first:rounded-l-sm
        "
      >
        {t("On")}
      </ToggleGroupItem>
      <ToggleGroupItem
        value="off"
        className="
          rounded-none
          last:rounded-r-sm
        "
      >
        {t("Off")}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
