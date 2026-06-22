import type { BookmarkImageVisibility, HomepageSectionImageLayout, ViewMode } from "../lib/bookmarkColumns";

import { ColumnsSelect, ViewModeToggle } from "./DisplayControlPrimitives";
import { useCustomAspectRatios } from "../hooks/useCustomAspectRatios";
import { buildAspectOptions } from "../lib/aspectOptions";
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

interface DisplaySettingsValue {
  viewMode: ViewMode;
  columns: number;
  imageMode: string;
  imageVisibility: BookmarkImageVisibility;
  imageLayout: HomepageSectionImageLayout;
  /** Legacy corner-overlay toggle. Omit (along with `onCornerOverlaysChange`) to hide the control. */
  cornerOverlays?: boolean;
}

interface DisplaySettingsControlsBaseProps {
  value: DisplaySettingsValue;
  onViewModeChange: (value: ViewMode) => void;
  onColumnsChange: (value: number) => void;
  onImageModeChange: (value: string) => void;
  onImageVisibilityChange: (value: BookmarkImageVisibility) => void;
  onImageLayoutChange: (value: HomepageSectionImageLayout) => void;
  /** When omitted, the "Image corners" toggle is not rendered (placement is configured via zones). */
  onCornerOverlaysChange?: (value: boolean) => void;
  showsImages: boolean;
}

/**
 * Controlled display controls: view mode, column count, and image visibility/aspect/layout/corners.
 * Presentational — callers supply the value and change handlers. Used by the homepage section form
 * (which still configures its own per-section card display); listing pages use the leaner
 * `ListingDisplayControls`, and per-card display elsewhere is governed by Card Display Rules.
 */
export function DisplaySettingsControlsBase({
  value,
  onViewModeChange,
  onColumnsChange,
  onImageModeChange,
  onImageVisibilityChange,
  onImageLayoutChange,
  onCornerOverlaysChange,
  showsImages,
}: DisplaySettingsControlsBaseProps) {
  const {
    viewMode, columns, imageMode, imageVisibility, imageLayout, cornerOverlays,
  } = value;
  const croppedWidth = useUiStore(state => state.croppedWidth);
  const croppedHeight = useUiStore(state => state.croppedHeight);
  const {
    data: customRatios = [],
  } = useCustomAspectRatios();

  return (
    <div className="flex flex-col gap-2.5">
      <ViewModeToggle
        value={viewMode}
        onChange={onViewModeChange}
      />

      {viewMode === "cards" && (
        <>
          <ColumnsSelect
            value={columns}
            onChange={onColumnsChange}
          />

          {showsImages && (
            <>
              {/* Images */}
              <div className="flex items-center justify-between gap-4">
                <Label className="text-sm font-medium">Images</Label>
                <ToggleGroup
                  type="single"
                  size="sm"
                  value={imageVisibility}
                  className="
                    gap-0 overflow-hidden rounded-md border border-input
                  "
                  onValueChange={(next) => {
                    if (next) onImageVisibilityChange(next as BookmarkImageVisibility);
                  }}
                >
                  <ToggleGroupItem
                    value="shown"
                    className="
                      rounded-none border-r border-input
                      first:rounded-l-sm
                      last:rounded-r-sm
                    "
                  >
                    Show
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="image-only"
                    className="rounded-none border-r border-input"
                  >
                    Only
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="off"
                    className="
                      rounded-none
                      last:rounded-r-sm
                    "
                  >
                    Off
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {imageVisibility !== "off" && (
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-sm font-medium">Aspect</Label>
                  <Select
                    value={typeof imageMode === "boolean" ? (imageMode ? "natural" : "cropped") : imageMode}
                    onValueChange={next => onImageModeChange(next)}
                  >
                    <SelectTrigger className="h-7 text-xs">
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
              )}

              {imageVisibility === "shown" && (columns === 1 || columns === 2) && (
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-sm font-medium">Layout</Label>
                  <ToggleGroup
                    type="single"
                    size="sm"
                    value={imageLayout}
                    className="
                      gap-0 overflow-hidden rounded-md border border-input
                    "
                    onValueChange={(next) => {
                      if (next) onImageLayoutChange(next as HomepageSectionImageLayout);
                    }}
                  >
                    <ToggleGroupItem
                      value="above"
                      className="
                        rounded-none border-r border-input
                        first:rounded-l-sm
                      "
                    >
                      Above
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="side"
                      className="
                        rounded-none
                        last:rounded-r-sm
                      "
                    >
                      Side
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              )}

              {imageVisibility !== "off" && onCornerOverlaysChange && (
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-sm font-medium">Image corners</Label>
                  <ToggleGroup
                    type="single"
                    size="sm"
                    value={cornerOverlays ? "on" : "off"}
                    className="
                      gap-0 overflow-hidden rounded-md border border-input
                    "
                    onValueChange={(next) => {
                      if (next) onCornerOverlaysChange(next === "on");
                    }}
                  >
                    <ToggleGroupItem
                      value="on"
                      className="
                        rounded-none border-r border-input
                        first:rounded-l-sm
                      "
                    >
                      On
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="off"
                      className="
                        rounded-none
                        last:rounded-r-sm
                      "
                    >
                      Off
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
