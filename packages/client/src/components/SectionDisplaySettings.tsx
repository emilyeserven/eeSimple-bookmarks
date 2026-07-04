import type {
  BookmarkImageVisibility,
  CardFieldZones,
  CardZoneLayouts,
  CustomProperty,
  HomepageSectionImageLayout,
  ViewMode,
} from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { LoadTemplateDropdown, SaveTemplatePopover } from "./CardFieldTemplateControls";
import { CardFieldZoneBoard } from "./CardFieldZoneBoard";
import { CardZoneLayoutControls } from "./CardZoneLayoutControls";
import { OnOffToggleGroup } from "./DisplayControlPrimitives";
import { DisplaySettingsControlsBase } from "./DisplaySettingsControls";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

/** The display settings stored per homepage section, with full listing-page parity. */
export interface SectionDisplayValue {
  viewMode: ViewMode;
  columns: number;
  imageMode: string;
  imageVisibility: BookmarkImageVisibility;
  imageLayout: HomepageSectionImageLayout;
  /** Per-zone field placements (card-body sub-zones + image corners). Concrete in the editor. */
  fieldZones: CardFieldZones;
  /** Per-body-zone Flex/Grid layout. Concrete in the editor. */
  cardZoneLayouts: CardZoneLayouts;
  hideWebsiteForYouTube: boolean;
  /** Maximum number of bookmarks to show in this section, or `null` for no limit. */
  bookmarkLimit: number | null;
}

interface SectionDisplaySettingsProps {
  value: SectionDisplayValue;
  /** Apply a partial change. Callers persist it (form state in the editor, immediate PATCH in the view). */
  onChange: (patch: Partial<SectionDisplayValue>) => void;
  /** Custom properties available to this section, used to extend the card-field zone board. */
  properties: CustomProperty[];
  /** Stable id prefix so the zone-board control ids stay unique across multiple sections. */
  idPrefix: string;
}

/**
 * Controlled per-section display settings with the same options as the listing-page Layout + Card
 * Options popovers: view mode, columns, image visibility/aspect/layout, the per-card field zone board
 * (drag fields into body sub-zones or image corners), and the per-zone Flex/Grid section layout —
 * the same `CardFieldZoneBoard` / `CardZoneLayoutControls` used by Settings → Card Display Rules.
 * Unlike a card display rule, a section is standalone (no inherit/override), so the controls are
 * always concrete. Reused by the section editor and read-only view.
 */
export function SectionDisplaySettings({
  value, onChange, properties, idPrefix,
}: SectionDisplaySettingsProps) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-4">
      <DisplaySettingsControlsBase
        value={{
          viewMode: value.viewMode,
          columns: value.columns,
          imageMode: value.imageMode,
          imageVisibility: value.imageVisibility,
          imageLayout: value.imageLayout,
        }}
        onViewModeChange={viewMode => onChange({
          viewMode,
        })}
        onColumnsChange={columns => onChange({
          columns,
        })}
        onImageModeChange={imageMode => onChange({
          imageMode,
        })}
        onImageVisibilityChange={imageVisibility => onChange({
          imageVisibility,
        })}
        onImageLayoutChange={imageLayout => onChange({
          imageLayout,
        })}
        showsImages
      />

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <Label className="text-sm font-medium">{t("Hide website for YouTube")}</Label>
          <OnOffToggleGroup
            value={value.hideWebsiteForYouTube}
            onChange={hideWebsiteForYouTube => onChange({
              hideWebsiteForYouTube,
            })}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {t("Hides the website pill on this section's cards that also have a YouTube channel.")}
        </p>
      </div>

      <div className="space-y-1">
        <Label
          htmlFor={`${idPrefix}-bookmark-limit`}
          className="text-sm font-medium"
        >
          {t("Bookmark limit")}
        </Label>
        <Input
          id={`${idPrefix}-bookmark-limit`}
          type="number"
          min={1}
          step={1}
          value={value.bookmarkLimit ?? ""}
          placeholder={t("No limit")}
          onChange={(e) => {
            const raw = e.target.value;
            onChange({
              bookmarkLimit: raw === "" ? null : Math.max(1, Math.trunc(Number(raw))),
            });
          }}
          className="max-w-32"
        />
        <p className="text-xs text-muted-foreground">
          {t("Maximum number of bookmarks shown in this section, applied after sorting. Leave blank for no limit.")}
        </p>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-sm font-medium">{t("Card fields")}</Label>
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {t("Drag each field onto a zone. Image corners overlay it on the card image; anything left in \"Available\" is hidden.")}
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
          onChange={fieldZones => onChange({
            fieldZones,
          })}
          properties={properties}
          idPrefix={`${idPrefix}-zones`}
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-sm font-medium">{t("Section layout")}</Label>
        <p className="text-xs text-muted-foreground">
          {t("How each card-body section arranges its fields: inline flow (Flex) or a two-column grid.")}
        </p>
        <CardZoneLayoutControls
          value={value.cardZoneLayouts}
          onChange={cardZoneLayouts => onChange({
            cardZoneLayouts,
          })}
        />
      </div>
    </div>
  );
}
