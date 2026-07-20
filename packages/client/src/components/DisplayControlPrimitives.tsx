import type { SectionDisplayMode, ViewMode } from "../lib/bookmarkColumns";

import { useTranslation } from "react-i18next";

import { useCroppedHeight, useCroppedWidth } from "../hooks/useAppSettings";
import { useCustomAspectRatios } from "../hooks/useCustomAspectRatios";
import { buildAspectOptions } from "../lib/aspectOptions";
import { COLUMN_OPTIONS } from "../lib/bookmarkColumns";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** Sentinel value for the Aspect select's "Default" (inherit-from-Card-Display-Rules) option. */
export const ASPECT_INHERIT = "__default__";

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

/**
 * Tagged-sections display selector: on any tag listing page, chooses whether each card shows both
 * the card and its Tagged sections chips, only the card, or only the sections.
 */
export function SectionDisplaySelect({
  value, onChange,
}: { value: SectionDisplayMode;
  onChange: (value: SectionDisplayMode) => void; }) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm font-medium">{t("Sections")}</Label>
      <Select
        value={value}
        onValueChange={next => onChange(next as SectionDisplayMode)}
      >
        <SelectTrigger className="h-8 w-44 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="both">{t("Sections + bookmarks")}</SelectItem>
          <SelectItem value="bookmarks">{t("Only bookmarks")}</SelectItem>
          <SelectItem value="sections">{t("Only sections")}</SelectItem>
        </SelectContent>
      </Select>
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

/**
 * Shared "Aspect" image ratio/cropping selector for listing display controls. Offers a leading
 * "Default" option (`undefined` value = inherit the per-card Card Display Rule aspect) plus every
 * built-in and custom aspect from {@link buildAspectOptions}.
 */
export function ImageAspectSelect({
  value, onChange,
}: { value: string | undefined;
  onChange: (value: string | undefined) => void; }) {
  const {
    t,
  } = useTranslation();
  const croppedWidth = useCroppedWidth();
  const croppedHeight = useCroppedHeight();
  const {
    data: customRatios = [],
  } = useCustomAspectRatios();
  const aspectOptions = buildAspectOptions(croppedWidth, croppedHeight, customRatios);
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm font-medium">{t("Aspect")}</Label>
      <Select
        value={value ?? ASPECT_INHERIT}
        onValueChange={next => onChange(next === ASPECT_INHERIT ? undefined : next)}
      >
        <SelectTrigger className="h-8 w-40 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ASPECT_INHERIT}>{t("Default")}</SelectItem>
          {aspectOptions.map(opt => (
            <SelectItem
              key={opt.value}
              value={opt.value}
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
