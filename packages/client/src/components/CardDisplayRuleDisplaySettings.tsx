import type {
  BookmarkImageVisibility,
  CardFieldZones,
  CardZoneLayouts,
  CustomProperty,
  HomepageSectionImageLayout,
} from "@eesimple/types";

import { defaultCardZoneLayouts } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { CardDisplayImageControls } from "./CardDisplayImageControls";
import { LoadTemplateDropdown, SaveTemplatePopover } from "./CardFieldTemplateControls";
import { CardFieldZoneBoard } from "./CardFieldZoneBoard";
import { CardZoneLayoutControls } from "./CardZoneLayoutControls";
import { defaultCardFieldZones } from "../lib/bookmarkCardValues";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

/** The per-card display config a rule overrides; `null` on any attribute means "inherit". */
export interface RuleDisplayValue {
  fieldZones: CardFieldZones | null;
  cardZoneLayouts: CardZoneLayouts | null;
  imageMode: string | null;
  imageVisibility: BookmarkImageVisibility | null;
  imageLayout: HomepageSectionImageLayout | null;
  hideWebsiteForYouTube: boolean | null;
}

interface OverrideSectionProps {
  value: RuleDisplayValue;
  onChange: (patch: Partial<RuleDisplayValue>) => void;
  idPrefix: string;
  isDefault: boolean;
}

/**
 * The "Card fields" override block: the field-zone board + card-field templates, gated by an
 * Inherit/Override checkbox (a non-default rule leaves `null` to lower-priority rules / the Default).
 * Its own placeable field (#1198); the `CardFieldZoneBoard` itself stays one composite editor.
 */
export function CardFieldZonesOverrideSection({
  value, onChange, properties, idPrefix, isDefault,
}: OverrideSectionProps & { properties: CustomProperty[] }) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <Label className="text-sm font-medium">{t("Card fields")}</Label>
        {!isDefault && (
          <label
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Checkbox
              id={`${idPrefix}-override-fieldZones`}
              checked={value.fieldZones !== null}
              onCheckedChange={checked => onChange({
                fieldZones: checked === true ? defaultCardFieldZones(properties) : null,
              })}
            />
            {t("Override")}
          </label>
        )}
      </div>
      {value.fieldZones !== null
        ? (
          <>
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {t("Drag each field onto a zone. Image corners overlay it on the card image; anything left in “Available” is hidden.")}
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <LoadTemplateDropdown
                  onLoad={zones => onChange({
                    fieldZones: zones,
                  })}
                />
                <SaveTemplatePopover fieldZones={value.fieldZones} />
              </div>
            </div>
            <CardFieldZoneBoard
              value={value.fieldZones}
              onChange={zones => onChange({
                fieldZones: zones,
              })}
              properties={properties}
              idPrefix={`${idPrefix}-zones`}
            />
          </>
        )
        : <p className="text-xs text-muted-foreground">{t("Inheriting card fields from lower-priority rules.")}</p>}
    </div>
  );
}

/**
 * The "Section layout" override block: per-body-zone flex/grid arrangement, gated by an
 * Inherit/Override checkbox. Its own placeable field (#1198).
 */
export function CardZoneLayoutsOverrideSection({
  value, onChange, idPrefix, isDefault,
}: OverrideSectionProps) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <Label className="text-sm font-medium">{t("Section layout")}</Label>
        {!isDefault && (
          <label
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Checkbox
              id={`${idPrefix}-override-cardZoneLayouts`}
              checked={value.cardZoneLayouts !== null}
              onCheckedChange={checked => onChange({
                cardZoneLayouts: checked === true ? defaultCardZoneLayouts() : null,
              })}
            />
            {t("Override")}
          </label>
        )}
      </div>
      {value.cardZoneLayouts !== null
        ? (
          <>
            <p className="text-xs text-muted-foreground">
              {t("How each card-body section arranges its fields: inline flow (Flex) or a two-column grid.")}
            </p>
            <CardZoneLayoutControls
              value={value.cardZoneLayouts}
              onChange={layouts => onChange({
                cardZoneLayouts: layouts,
              })}
            />
          </>
        )
        : <p className="text-xs text-muted-foreground">{t("Inheriting section layout from lower-priority rules.")}</p>}
    </div>
  );
}

interface CardDisplayRuleDisplaySettingsProps {
  value: RuleDisplayValue;
  onChange: (patch: Partial<RuleDisplayValue>) => void;
  /** Custom properties available, used to extend the card-field toggle list. */
  properties: CustomProperty[];
  /** Stable id prefix so checkbox/label pairs stay unique across multiple rule editors. */
  idPrefix: string;
  /**
   * The Default rule: every attribute is concrete (no "inherit" option), since it is the baseline
   * every other rule falls back to.
   */
  isDefault?: boolean;
}

/**
 * Controlled display config for a card display rule: image visibility/aspect/layout, corner overlays,
 * and card-field visibility — each with an "Inherit / Override" toggle (a non-default rule leaves
 * `null` attributes to lower-priority rules / the Default). Grid columns and card/table view are
 * deliberately excluded: those are page-level, not per-card. The Default rule renders the same
 * controls with every attribute concrete.
 *
 * Recomposed from the image rows + the two override sections (#1198) so the monolithic modal form is
 * unchanged while each part is also independently placeable as a workbench field.
 */
export function CardDisplayRuleDisplaySettings({
  value, onChange, properties, idPrefix, isDefault = false,
}: CardDisplayRuleDisplaySettingsProps) {
  return (
    <div className="space-y-4">
      <CardDisplayImageControls
        value={value}
        onChange={onChange}
        idPrefix={idPrefix}
        isDefault={isDefault}
      />

      <Separator />

      <CardFieldZonesOverrideSection
        value={value}
        onChange={onChange}
        properties={properties}
        idPrefix={idPrefix}
        isDefault={isDefault}
      />

      <Separator />

      <CardZoneLayoutsOverrideSection
        value={value}
        onChange={onChange}
        idPrefix={idPrefix}
        isDefault={isDefault}
      />
    </div>
  );
}
