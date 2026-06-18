import type { HomepageSectionImageLayout } from "@eesimple/types";

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

interface SectionDisplayControlsProps {
  columns: number;
  imageMode: boolean;
  imageLayout: HomepageSectionImageLayout;
  onColumnsChange: (columns: number) => void;
  onImageModeChange: (imageMode: boolean) => void;
  onImageLayoutChange: (layout: HomepageSectionImageLayout) => void;
  /** Stable id prefix so the Columns select's label/control pair stays unique on the page. */
  idPrefix: string;
}

/**
 * Controlled display controls for a homepage section: column count, image mode (natural/cropped),
 * and — at 2 columns — image layout (above/side). Rendered inline (no popovers); the Image and
 * Layout toggle groups are always shown rather than tucked behind a button.
 */
export function SectionDisplayControls({
  columns, imageMode, imageLayout,
  onColumnsChange, onImageModeChange, onImageLayoutChange, idPrefix,
}: SectionDisplayControlsProps) {
  const columnsId = `${idPrefix}-columns`;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-2">
        <Label
          htmlFor={columnsId}
          className="text-xs text-muted-foreground"
        >
          Columns
        </Label>
        <Select
          value={String(columns)}
          onValueChange={value => onColumnsChange(Number(value))}
        >
          <SelectTrigger
            id={columnsId}
            size="sm"
            className="w-16"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COLUMN_OPTIONS.map(option => (
              <SelectItem
                key={option}
                value={String(option)}
              >
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Images</Label>
        <ToggleGroup
          type="single"
          size="sm"
          value={imageMode ? "natural" : "cropped"}
          onValueChange={(value) => {
            if (value) onImageModeChange(value === "natural");
          }}
        >
          <ToggleGroupItem value="natural">Natural</ToggleGroupItem>
          <ToggleGroupItem value="cropped">Cropped</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {columns === 2 && (
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Layout</Label>
          <ToggleGroup
            type="single"
            size="sm"
            value={imageLayout}
            onValueChange={(value) => {
              if (value) onImageLayoutChange(value as HomepageSectionImageLayout);
            }}
          >
            <ToggleGroupItem value="above">Above</ToggleGroupItem>
            <ToggleGroupItem value="side">Side</ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
    </div>
  );
}
