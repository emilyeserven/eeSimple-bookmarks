import type {
  BookmarkImageVisibility,
  CardFieldZones,
  CardZoneLayouts,
  CustomProperty,
  HomepageSectionImageLayout,
  ViewMode,
} from "@eesimple/types";

import { CardFieldZoneBoard } from "./CardFieldZoneBoard";
import { CardZoneLayoutControls } from "./CardZoneLayoutControls";
import { OnOffToggleGroup } from "./DisplayControlPrimitives";
import { DisplaySettingsControlsBase } from "./DisplaySettingsControls";

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
          <Label className="text-sm font-medium">Hide website for YouTube</Label>
          <OnOffToggleGroup
            value={value.hideWebsiteForYouTube}
            onChange={hideWebsiteForYouTube => onChange({
              hideWebsiteForYouTube,
            })}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Hides the website pill on this section&rsquo;s cards that also have a YouTube channel.
        </p>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-sm font-medium">Card fields</Label>
        <p className="text-xs text-muted-foreground">
          Drag each field onto a zone. Image corners overlay it on the card image; anything left in
          “Available” is hidden.
        </p>
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
        <Label className="text-sm font-medium">Section layout</Label>
        <p className="text-xs text-muted-foreground">
          How each card-body section arranges its fields: inline flow (Flex) or a two-column grid.
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
