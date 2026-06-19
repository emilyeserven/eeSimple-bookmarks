import type { CustomAspectRatio, HomepageSectionImageLayout } from "@eesimple/types";

import { useCustomAspectRatios } from "../hooks/useCustomAspectRatios";
import { COLUMN_OPTIONS } from "../lib/bookmarkColumns";
import { useUiStore } from "../stores/uiStore";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

function buildAspectOptions(croppedW: number, croppedH: number, customRatios: CustomAspectRatio[]) {
  return [
    {
      value: "natural",
      label: "Natural",
    },
    {
      value: "square",
      label: "Square (1:1)",
    },
    {
      value: "opengraph",
      label: "OpenGraph (1.91:1)",
    },
    {
      value: "cropped",
      label: `Cropped (${croppedW}:${croppedH})`,
    },
    ...customRatios.map(r => ({
      value: r.id,
      label: `${r.name} (${r.width}:${r.height})`,
    })),
  ];
}

interface SectionDisplayControlsProps {
  columns: number;
  imageMode: string;
  imageLayout: HomepageSectionImageLayout;
  onColumnsChange: (columns: number) => void;
  onImageModeChange: (imageMode: string) => void;
  onImageLayoutChange: (layout: HomepageSectionImageLayout) => void;
  /** Stable id prefix so the Columns select's label/control pair stays unique on the page. */
  idPrefix: string;
}

/**
 * Controlled display controls for a homepage section: column count, image aspect, and — at 1 or 2
 * columns — image layout (above/side). Rendered inline (no popovers).
 */
export function SectionDisplayControls({
  columns, imageMode, imageLayout,
  onColumnsChange, onImageModeChange, onImageLayoutChange, idPrefix,
}: SectionDisplayControlsProps) {
  const columnsId = `${idPrefix}-columns`;
  const croppedWidth = useUiStore(state => state.croppedWidth);
  const croppedHeight = useUiStore(state => state.croppedHeight);
  const {
    data: customRatios = [],
  } = useCustomAspectRatios();

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
        <Label className="text-xs text-muted-foreground">Aspect</Label>
        <Select
          value={typeof imageMode === "boolean" ? (imageMode ? "natural" : "cropped") : imageMode}
          onValueChange={value => onImageModeChange(value)}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {buildAspectOptions(croppedWidth, croppedHeight, customRatios).map(opt => (
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

      {(columns === 1 || columns === 2) && (
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
