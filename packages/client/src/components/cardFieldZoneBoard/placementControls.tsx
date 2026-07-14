import type { CardFieldPlacement, CardFieldZone, CustomProperty } from "@eesimple/types";

import { HIERARCHY_HOVER_PROP, MOBILE_SCALE_OPTIONS, SCALE_OPTIONS } from "./zoneParts";
import i18n from "../../i18n";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlacementControlsProps {
  placement: CardFieldPlacement;
  idPrefix: string;
  onPatch: (patch: Partial<CardFieldPlacement>) => void;
}

/** A "Hide label" checkbox (shared by the image and table placement controls). */
function HideLabelToggle({
  placement, idPrefix, onPatch,
}: PlacementControlsProps) {
  return (
    <label className="flex items-center gap-1 text-muted-foreground">
      <Checkbox
        id={`${idPrefix}-hide-label`}
        checked={placement.hideLabel ?? false}
        onCheckedChange={checked => onPatch({
          hideLabel: checked === true,
        })}
      />
      {i18n.t("Hide label")}
    </label>
  );
}

/** Controls for a field placed in the card-body Table zone: just a "Hide label" checkbox. */
export function TablePlacementControls({
  placement, idPrefix, onPatch,
}: PlacementControlsProps) {
  return (
    <div className="flex flex-col items-start gap-1.5 pl-5 text-xs">
      <HideLabelToggle
        placement={placement}
        idPrefix={idPrefix}
        onPatch={onPatch}
      />
    </div>
  );
}

/** The two progress (itemInItems) text toggles: "Show numbers" (X of Y) and "Show unit text". */
function ProgressTextToggles({
  placement, idPrefix, onPatch,
}: PlacementControlsProps) {
  return (
    <>
      <PlacementCheckbox
        id={`${idPrefix}-progress-count`}
        label={i18n.t("Show numbers")}
        checked={placement.showProgressCount ?? true}
        onCheckedChange={showProgressCount => onPatch({
          showProgressCount,
        })}
      />
      <PlacementCheckbox
        id={`${idPrefix}-progress-unit`}
        label={i18n.t("Show unit text")}
        checked={placement.showProgressUnit ?? true}
        onCheckedChange={showProgressUnit => onPatch({
          showProgressUnit,
        })}
      />
    </>
  );
}

/**
 * The progress text toggles for a field placed in an image corner (stacked under the image controls).
 * Both default on (absent = true), so a card can show either, both, or none of the numbers and unit.
 */
export function ProgressTextControls({
  placement, idPrefix, onPatch,
}: PlacementControlsProps) {
  return (
    <div className="flex flex-col items-start gap-1.5 pl-5 text-xs">
      <ProgressTextToggles
        placement={placement}
        idPrefix={idPrefix}
        onPatch={onPatch}
      />
    </div>
  );
}

/**
 * Controls for a progress (itemInItems) field placed in a card-body zone: a "Hide label" checkbox
 * (whether the property name prefixes the value) plus the two text toggles. No ring renders in the
 * body — only in an image overlay.
 */
export function ProgressBodyControls({
  placement, idPrefix, onPatch,
}: PlacementControlsProps) {
  return (
    <div className="flex flex-col items-start gap-1.5 pl-5 text-xs">
      <HideLabelToggle
        placement={placement}
        idPrefix={idPrefix}
        onPatch={onPatch}
      />
      <ProgressTextToggles
        placement={placement}
        idPrefix={idPrefix}
        onPatch={onPatch}
      />
    </div>
  );
}

/**
 * Controls for the Tags field, in whichever zone it's placed: a "Show hierarchy on hover" toggle
 * (any zone — shows a popover with the tag's ancestor chain), plus, in the `card-table` zone only,
 * "Hide label" and a "Clickable links" toggle (renders the tag names as links to each tag's page
 * instead of plain text).
 */
export function TagsPlacementControls({
  zone, placement, idPrefix, onPatch,
}: PlacementControlsProps & { zone: CardFieldZone }) {
  return (
    <div className="flex flex-col items-start gap-1.5 pl-5 text-xs">
      {zone === "card-table"
        ? (
          <>
            <HideLabelToggle
              placement={placement}
              idPrefix={idPrefix}
              onPatch={onPatch}
            />
            <PlacementCheckbox
              id={`${idPrefix}-clickable-tags`}
              label={i18n.t("Clickable links")}
              checked={placement.clickableTags ?? false}
              onCheckedChange={clickableTags => onPatch({
                clickableTags,
              })}
            />
          </>
        )
        : null}
      <PlacementCheckbox
        id={`${idPrefix}-hover-hierarchy`}
        label={i18n.t("Show hierarchy on hover")}
        checked={placement.showTagHierarchyOnHover ?? false}
        onCheckedChange={showTagHierarchyOnHover => onPatch({
          showTagHierarchyOnHover,
        })}
      />
    </div>
  );
}

/**
 * Controls for a hierarchical taxonomy field (Media Type / Locations / Genres & Moods) in whichever
 * zone it's placed: a "Show hierarchy on hover" toggle (any zone — shows a popover with the field's
 * ancestor chain), plus, in the `card-table` zone only, "Hide label" (the behavior these fields got
 * via `TablePlacementControls` before this control claimed their dispatch branch).
 */
export function HierarchyHoverControls({
  zone, fieldKey, placement, idPrefix, onPatch,
}: PlacementControlsProps & { zone: CardFieldZone;
  fieldKey: string; }) {
  const prop = HIERARCHY_HOVER_PROP[fieldKey];
  if (!prop) return null;
  return (
    <div className="flex flex-col items-start gap-1.5 pl-5 text-xs">
      {zone === "card-table"
        ? (
          <HideLabelToggle
            placement={placement}
            idPrefix={idPrefix}
            onPatch={onPatch}
          />
        )
        : null}
      <PlacementCheckbox
        id={`${idPrefix}-hover-hierarchy`}
        label={i18n.t("Show hierarchy on hover")}
        checked={Boolean(placement[prop])}
        onCheckedChange={checked => onPatch({
          [prop]: checked,
        } as Partial<CardFieldPlacement>)}
      />
    </div>
  );
}

/** A labeled checkbox used by the boolean placement controls. */
function PlacementCheckbox({
  id, label, checked, onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-1 text-muted-foreground">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={value => onCheckedChange(value === true)}
      />
      {label}
    </label>
  );
}

/**
 * Per-field display controls for a boolean custom property placed in a card-body zone: Hide label,
 * Show if false, and Clickable in view (plus Colon-after-label / Value-before-label for the icon-like
 * presets). These knobs moved here from the property's options page.
 */
export function BooleanPlacementControls({
  property, placement, idPrefix, onPatch,
}: PlacementControlsProps & { property: CustomProperty }) {
  const isIconPreset
    = property.booleanLabelPreset === "icons" || property.booleanLabelPreset === "stars";
  return (
    <div className="flex flex-col items-start gap-1.5 pl-5 text-xs">
      <HideLabelToggle
        placement={placement}
        idPrefix={idPrefix}
        onPatch={onPatch}
      />
      <PlacementCheckbox
        id={`${idPrefix}-show-if-false`}
        label={i18n.t("Show if false")}
        checked={placement.showIfFalse ?? false}
        onCheckedChange={showIfFalse => onPatch({
          showIfFalse,
        })}
      />
      <PlacementCheckbox
        id={`${idPrefix}-clickable`}
        label={i18n.t("Clickable in view")}
        checked={placement.clickableInView ?? false}
        onCheckedChange={clickableInView => onPatch({
          clickableInView,
        })}
      />
      {isIconPreset
        ? (
          <>
            <PlacementCheckbox
              id={`${idPrefix}-hide-icon`}
              label={i18n.t("Hide icon")}
              checked={placement.hideIcon ?? false}
              onCheckedChange={hideIcon => onPatch({
                hideIcon,
              })}
            />
            <PlacementCheckbox
              id={`${idPrefix}-colon`}
              label={i18n.t("Colon after label")}
              checked={placement.showLabelColon ?? true}
              onCheckedChange={showLabelColon => onPatch({
                showLabelColon,
              })}
            />
            <PlacementCheckbox
              id={`${idPrefix}-value-before`}
              label={i18n.t("Value before label")}
              checked={placement.showValueBeforeLabel ?? false}
              onCheckedChange={showValueBeforeLabel => onPatch({
                showValueBeforeLabel,
              })}
            />
          </>
        )
        : null}
    </div>
  );
}

/** Overlay size / mobile size / hide-icon / hide-label controls for a field placed in an image corner. */
export function ImagePlacementControls({
  placement, idPrefix, onPatch,
}: PlacementControlsProps) {
  return (
    <div className="flex flex-col items-start gap-1.5 pl-5 text-xs">
      <Select
        value={String(placement.scale ?? 1)}
        onValueChange={next => onPatch({
          scale: Number(next),
        })}
      >
        <SelectTrigger className="h-6 w-16 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SCALE_OPTIONS.map(opt => (
            <SelectItem
              key={opt.value}
              value={opt.value}
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={placement.mobileScale == null ? "inherit" : String(placement.mobileScale)}
        onValueChange={next => onPatch({
          mobileScale: next === "inherit" ? null : Number(next),
        })}
      >
        <SelectTrigger className="h-6 w-24 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MOBILE_SCALE_OPTIONS.map(opt => (
            <SelectItem
              key={opt.value}
              value={opt.value}
            >
              {opt.value === "inherit"
                ? i18n.t("Mobile: inherit")
                : i18n.t("Mobile: {{label}}", {
                  label: opt.label,
                })}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <label className="flex items-center gap-1 text-muted-foreground">
        <Checkbox
          id={`${idPrefix}-hide-icon`}
          checked={placement.hideIcon ?? false}
          onCheckedChange={checked => onPatch({
            hideIcon: checked === true,
          })}
        />
        {i18n.t("Hide icon/image")}
      </label>
      <HideLabelToggle
        placement={placement}
        idPrefix={idPrefix}
        onPatch={onPatch}
      />
      <label className="flex items-center gap-1 text-muted-foreground">
        <Checkbox
          id={`${idPrefix}-clickable-in-overlay`}
          checked={placement.clickableInOverlay ?? false}
          onCheckedChange={checked => onPatch({
            clickableInOverlay: checked === true,
          })}
        />
        {i18n.t("Link to item page")}
      </label>
    </div>
  );
}
