import type { BookmarkImageVisibility, CustomProperty, HomepageSectionImageLayout, ViewMode } from "@eesimple/types";

import { CardDisplayControlsBase } from "./CardDisplayControls";
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
  hiddenCardFields: string[];
  cornerOverlays: boolean;
}

interface SectionDisplaySettingsProps {
  value: SectionDisplayValue;
  /** Apply a partial change. Callers persist it (form state in the editor, immediate PATCH in the view). */
  onChange: (patch: Partial<SectionDisplayValue>) => void;
  /** Custom properties available to this section, used to extend the card-field toggle list. */
  properties: CustomProperty[];
  /** Stable id prefix so the card-field checkbox/label pairs stay unique across multiple sections. */
  idPrefix: string;
}

/**
 * Controlled per-section display settings with the same options as the listing-page Layout + Card
 * Options popovers: view mode, columns, image visibility/aspect/layout, preset apply/save, and the
 * per-card field toggles. Backed by the shared `DisplaySettingsControlsBase` / `CardDisplayControlsBase`
 * cores so sections and listings stay in lockstep. Reused by the section editor and read-only view.
 */
export function SectionDisplaySettings({
  value, onChange, properties, idPrefix,
}: SectionDisplaySettingsProps) {
  function toggleCardField(fieldKey: string): void {
    const next = value.hiddenCardFields.includes(fieldKey)
      ? value.hiddenCardFields.filter(key => key !== fieldKey)
      : [...value.hiddenCardFields, fieldKey];
    onChange({
      hiddenCardFields: next,
    });
  }

  return (
    <div className="space-y-4">
      <DisplaySettingsControlsBase
        value={{
          viewMode: value.viewMode,
          columns: value.columns,
          imageMode: value.imageMode,
          imageVisibility: value.imageVisibility,
          imageLayout: value.imageLayout,
          cornerOverlays: value.cornerOverlays,
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
        onCornerOverlaysChange={cornerOverlays => onChange({
          cornerOverlays,
        })}
        showsImages
      />

      <Separator />

      <div className="space-y-2">
        <Label className="text-sm font-medium">Card fields</Label>
        <p className="text-xs text-muted-foreground">
          Which fields appear on this section&rsquo;s bookmark cards and table columns.
        </p>
        <CardDisplayControlsBase
          hidden={value.hiddenCardFields}
          onToggle={toggleCardField}
          properties={properties}
          idPrefix={`${idPrefix}-card-field`}
        />
      </div>
    </div>
  );
}
