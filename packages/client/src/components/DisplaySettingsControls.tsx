import type { BookmarkImageVisibility, HomepageSectionImageLayout, ViewMode } from "../lib/bookmarkColumns";
import type { CustomAspectRatio, DisplayPreset, DisplayPresetSettings } from "@eesimple/types";

import { useState } from "react";

import { Bookmark } from "lucide-react";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCustomAspectRatios } from "../hooks/useCustomAspectRatios";
import { useCreateDisplayPreset, useDisplayPresets } from "../hooks/useDisplayPresets";
import { COLUMN_OPTIONS, useBookmarkColumns, useBookmarkImageLayout, useBookmarkImageMode, useBookmarkImageVisibility, useViewMode } from "../lib/bookmarkColumns";
import { useUiStore } from "../stores/uiStore";

import { Button } from "@/components/ui/button";
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

function applyDisplayPreset(
  pageKey: string,
  settings: DisplayPresetSettings,
  setBookmarkColumns: (key: string, v: number) => void,
  setBookmarkImageVisibility: (key: string, v: BookmarkImageVisibility) => void,
  setBookmarkImageMode: (key: string, v: string) => void,
  setBookmarkImageLayout: (key: string, v: HomepageSectionImageLayout) => void,
) {
  setBookmarkColumns(pageKey, settings.columns);
  setBookmarkImageVisibility(pageKey, settings.imageVisibility);
  const rawMode = settings.imageMode;
  setBookmarkImageMode(pageKey, typeof rawMode === "boolean" ? (rawMode ? "natural" : "cropped") : rawMode);
  setBookmarkImageLayout(pageKey, settings.imageLayout);
}

interface DisplaySettingsValue {
  viewMode: ViewMode;
  columns: number;
  imageMode: string;
  imageVisibility: BookmarkImageVisibility;
  imageLayout: HomepageSectionImageLayout;
}

interface DisplaySettingsControlsBaseProps {
  value: DisplaySettingsValue;
  onViewModeChange: (value: ViewMode) => void;
  onColumnsChange: (value: number) => void;
  onImageModeChange: (value: string) => void;
  onImageVisibilityChange: (value: BookmarkImageVisibility) => void;
  onImageLayoutChange: (value: HomepageSectionImageLayout) => void;
  showsImages: boolean;
  /** Saved presets to offer in the Apply picker; omit/empty to hide the picker. */
  presets: DisplayPreset[];
  /** Apply a saved preset's four layout settings to the current surface. */
  onApplyPreset: (settings: DisplayPresetSettings) => void;
  /** Persist the current settings as a named preset; call `done` to close the modal on success. */
  onSaveAsPreset: (name: string, done: () => void) => void;
  saveError?: boolean;
  saveErrorMessage?: string;
}

/**
 * Controlled display controls: view mode, column count, image visibility/aspect/layout, and preset
 * apply/save. Presentational — callers supply the value, change handlers, and preset infra. Labels
 * sit left of their control; toggle groups use the bordered variant. Reused by the uiStore-backed
 * `DisplaySettingsControls` (listings) and the homepage section form.
 */
export function DisplaySettingsControlsBase({
  value,
  onViewModeChange,
  onColumnsChange,
  onImageModeChange,
  onImageVisibilityChange,
  onImageLayoutChange,
  showsImages,
  presets,
  onApplyPreset,
  onSaveAsPreset,
  saveError,
  saveErrorMessage,
}: DisplaySettingsControlsBaseProps) {
  const {
    viewMode, columns, imageMode, imageVisibility, imageLayout,
  } = value;
  const croppedWidth = useUiStore(state => state.croppedWidth);
  const croppedHeight = useUiStore(state => state.croppedHeight);
  const {
    data: customRatios = [],
  } = useCustomAspectRatios();
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2.5">
      {/* View mode */}
      <div className="flex items-center justify-between gap-4">
        <Label className="text-sm font-medium">View</Label>
        <ToggleGroup
          type="single"
          size="sm"
          value={viewMode}
          className="gap-0 overflow-hidden rounded-md border border-input"
          onValueChange={(next) => {
            if (next) onViewModeChange(next as ViewMode);
          }}
        >
          <ToggleGroupItem
            value="cards"
            className="
              rounded-none border-r border-input
              first:rounded-l-sm
            "
          >
            Cards
          </ToggleGroupItem>
          <ToggleGroupItem
            value="table"
            className="
              rounded-none
              last:rounded-r-sm
            "
          >
            Table
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Preset picker */}
      {presets.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <Label className="text-sm font-medium">Preset</Label>
          <Select
            value=""
            onValueChange={(presetId) => {
              const preset = presets.find(p => p.id === presetId);
              if (!preset) return;
              onApplyPreset(preset.settings);
            }}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Apply a preset…" />
            </SelectTrigger>
            <SelectContent>
              {presets.map(preset => (
                <SelectItem
                  key={preset.id}
                  value={preset.id}
                >
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {viewMode === "cards" && (
        <>
          {/* Columns */}
          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm font-medium">Columns</Label>
            <Select
              value={String(columns)}
              onValueChange={next => onColumnsChange(Number(next))}
            >
              <SelectTrigger className="h-7 w-16 text-xs">
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
            </>
          )}
        </>
      )}

      {/* Save as preset */}
      <div className="flex justify-end pt-0.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-1.5 text-xs text-muted-foreground"
          onClick={() => setSaveModalOpen(true)}
        >
          <Bookmark className="size-3" />
          Save as preset
        </Button>
      </div>

      <InlineCreateModal
        open={saveModalOpen}
        onOpenChange={setSaveModalOpen}
        title="Save display preset"
        description="Give these display settings a name so you can apply them to any listing page."
        placeholder="e.g. Compact Grid"
        submitLabel="Save preset"
        pendingLabel="Saving…"
        isError={saveError ?? false}
        errorMessage={saveErrorMessage}
        onSubmit={(name, done) => onSaveAsPreset(name, done)}
      />
    </div>
  );
}

interface DisplaySettingsControlsProps {
  pageKey: string;
  showsImages: boolean;
}

/**
 * Per-listing display controls backed by uiStore. Reused by LayoutOptionsPopover, the category
 * Display tab, and Settings → Display.
 */
export function DisplaySettingsControls({
  pageKey, showsImages,
}: DisplaySettingsControlsProps) {
  const viewMode = useViewMode(pageKey);
  const setViewMode = useUiStore(state => state.setViewMode);
  const columns = useBookmarkColumns(pageKey);
  const imageMode = useBookmarkImageMode(pageKey);
  const imageVisibility = useBookmarkImageVisibility(pageKey);
  const imageLayout = useBookmarkImageLayout(pageKey);
  const setBookmarkColumns = useUiStore(state => state.setBookmarkColumns);
  const setBookmarkImageMode = useUiStore(state => state.setBookmarkImageMode);
  const setBookmarkImageVisibility = useUiStore(state => state.setBookmarkImageVisibility);
  const setBookmarkImageLayout = useUiStore(state => state.setBookmarkImageLayout);

  const {
    data: presets = [],
  } = useDisplayPresets();
  const createMutation = useCreateDisplayPreset();

  const currentSettings: DisplayPresetSettings = {
    columns,
    imageVisibility,
    imageMode,
    imageLayout,
  };

  return (
    <DisplaySettingsControlsBase
      value={{
        viewMode,
        columns,
        imageMode,
        imageVisibility,
        imageLayout,
      }}
      onViewModeChange={value => setViewMode(pageKey, value)}
      onColumnsChange={value => setBookmarkColumns(pageKey, value)}
      onImageModeChange={value => setBookmarkImageMode(pageKey, value)}
      onImageVisibilityChange={value => setBookmarkImageVisibility(pageKey, value)}
      onImageLayoutChange={value => setBookmarkImageLayout(pageKey, value)}
      showsImages={showsImages}
      presets={presets}
      onApplyPreset={settings => applyDisplayPreset(
        pageKey,
        settings,
        setBookmarkColumns,
        setBookmarkImageVisibility,
        setBookmarkImageMode,
        setBookmarkImageLayout,
      )}
      onSaveAsPreset={(name, done) => createMutation.mutate(
        {
          name,
          settings: currentSettings,
        },
        {
          onSuccess: done,
        },
      )}
      saveError={createMutation.isError}
      saveErrorMessage={createMutation.error?.message}
    />
  );
}
