import { useTranslation } from "react-i18next";

import {
  HideWebsiteRow,
  ImageAspectRow,
  ImageLayoutRow,
  ImageVisibilityRow,
} from "../CardDisplayImageControls";
import { useCardDisplayRuleDisplayContext } from "../CardDisplayRuleDisplayContext";
import {
  CardFieldZonesOverrideSection,
  CardZoneLayoutsOverrideSection,
} from "../CardDisplayRuleDisplaySettings";
import { CardDisplayRulePreview } from "../CardDisplayRulePreview";

/**
 * The card display rule's Display tab broken into granular, independently-placeable edit fields
 * (#1198). Each reads the one shared `RuleDisplayValue` controller from
 * {@link useCardDisplayRuleDisplayContext} (mounted by the edit route) so every control and the live
 * preview stay in sync. The `CardFieldZoneBoard` and `CardZoneLayoutControls` composite editors each
 * stay one field. `idPrefix` is stable per rule so checkbox/label ids don't collide.
 */

/** Edit field: image visibility (Show / Only / Off). */
export function CardDisplayRuleImageVisibilityField() {
  const {
    rule, display, handleChange, isDefault,
  } = useCardDisplayRuleDisplayContext();
  return (
    <ImageVisibilityRow
      value={display}
      onChange={handleChange}
      idPrefix={`rule-${rule.id}`}
      isDefault={isDefault}
    />
  );
}

/** Edit field: image aspect (natural / cropped / square / custom ratio). */
export function CardDisplayRuleImageAspectField() {
  const {
    rule, display, handleChange, isDefault,
  } = useCardDisplayRuleDisplayContext();
  return (
    <ImageAspectRow
      value={display}
      onChange={handleChange}
      idPrefix={`rule-${rule.id}`}
      isDefault={isDefault}
    />
  );
}

/** Edit field: image layout (Above / Side). */
export function CardDisplayRuleImageLayoutField() {
  const {
    rule, display, handleChange, isDefault,
  } = useCardDisplayRuleDisplayContext();
  return (
    <ImageLayoutRow
      value={display}
      onChange={handleChange}
      idPrefix={`rule-${rule.id}`}
      isDefault={isDefault}
    />
  );
}

/** Edit field: hide the website pill for a card that also has a YouTube channel. */
export function CardDisplayRuleHideWebsiteField() {
  const {
    rule, display, handleChange, isDefault,
  } = useCardDisplayRuleDisplayContext();
  return (
    <HideWebsiteRow
      value={display}
      onChange={handleChange}
      idPrefix={`rule-${rule.id}`}
      isDefault={isDefault}
    />
  );
}

/** Edit field: the card-field zone board (composite editor kept whole). */
export function CardDisplayRuleFieldZonesField() {
  const {
    rule, display, handleChange, properties, isDefault,
  } = useCardDisplayRuleDisplayContext();
  return (
    <CardFieldZonesOverrideSection
      value={display}
      onChange={handleChange}
      properties={properties}
      idPrefix={`rule-${rule.id}`}
      isDefault={isDefault}
    />
  );
}

/** Edit field: per-body-zone flex/grid section layout. */
export function CardDisplayRuleCardZoneLayoutsField() {
  const {
    rule, display, handleChange, isDefault,
  } = useCardDisplayRuleDisplayContext();
  return (
    <CardZoneLayoutsOverrideSection
      value={display}
      onChange={handleChange}
      idPrefix={`rule-${rule.id}`}
      isDefault={isDefault}
    />
  );
}

/**
 * Edit field: a live preview of a matching card. Reads the in-progress `display` from context so it
 * updates as the other Display fields change. (The view-mode preview is `CardDisplayRuleDisplayView`,
 * which reads the saved entity and needs no context.)
 */
export function CardDisplayRulePreviewEditField() {
  const {
    t,
  } = useTranslation();
  const {
    rule, display,
  } = useCardDisplayRuleDisplayContext();
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{t("Card preview")}</h3>
        <p className="text-xs text-muted-foreground">
          {t("How a matching bookmark card looks with these display settings.")}
        </p>
      </div>
      <CardDisplayRulePreview
        display={display}
        conditions={rule.conditions}
        isDefault={rule.isDefault}
        currentRuleId={rule.id}
      />
    </section>
  );
}
