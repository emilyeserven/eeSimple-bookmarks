import type { BookmarkImageVisibility, HomepageSectionImageLayout } from "../lib/bookmarkColumns";
import type { CustomAspectRatio, DisplayPresetSettings } from "@eesimple/types";

import { useState } from "react";

import { Bookmark } from "lucide-react";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCustomAspectRatios } from "../hooks/useCustomAspectRatios";
import { useCreateDisplayPreset, useDisplayPresets } from "../hooks/useDisplayPresets";
import { COLUMN_OPTIONS, useBookmarkColumns, useBookmarkImageLayout, useBookmarkImageMode, useBookmarkImageVisibility } from "../lib/bookmarkColumns";
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

interface DisplaySettingsControlsProps {
  pageKey: string;
  showsImages: boolean;
}

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

/**
 * Per-listing display controls: column count, image visibility/aspect/layout, and preset
 * save/apply. Labels sit left of their control; toggle groups use the bordered variant.
 * Reused by LayoutOptionsPopover, the category Display tab, and Settings → Display.
 */
export function DisplaySettingsControls({
  pageKey, showsImages,
}: DisplaySettingsControlsProps) {
  const columns = useBookmarkColumns(pageKey);
  const imageMode = useBookmarkImageMode(pageKey);
  const imageVisibility = useBookmarkImageVisibility(pageKey);
  const imageLayout = useBookmarkImageLayout(pageKey);
  const setBookmarkColumns = useUiStore(state => state.setBookmarkColumns);
  const setBookmarkImageMode = useUiStore(state => state.setBookmarkImageMode);
  const setBookmarkImageVisibility = useUiStore(state => state.setBookmarkImageVisibility);
  const setBookmarkImageLayout = useUiStore(state => state.setBookmarkImageLayout);
  const croppedWidth = useUiStore(state => state.croppedWidth);
  const croppedHeight = useUiStore(state => state.croppedHeight);
  const {
    data: customRatios = [],
  } = useCustomAspectRatios();

  const {
    data: presets = [],
  } = useDisplayPresets();
  const createMutation = useCreateDisplayPreset();
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const currentSettings: DisplayPresetSettings = {
    columns,
    imageVisibility,
    imageMode,
    imageLayout,
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Preset picker */}
      {presets.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <Label className="text-sm font-medium">Preset</Label>
          <Select
            value=""
            onValueChange={(presetId) => {
              const preset = presets.find(p => p.id === presetId);
              if (!preset) return;
              applyDisplayPreset(
                pageKey,
                preset.settings,
                setBookmarkColumns,
                setBookmarkImageVisibility,
                setBookmarkImageMode,
                setBookmarkImageLayout,
              );
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

      {/* Columns */}
      <div className="flex items-center justify-between gap-4">
        <Label className="text-sm font-medium">Columns</Label>
        <Select
          value={String(columns)}
          onValueChange={value => setBookmarkColumns(pageKey, Number(value))}
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
              className="gap-0 overflow-hidden rounded-md border border-input"
              onValueChange={(value) => {
                if (value) setBookmarkImageVisibility(pageKey, value as BookmarkImageVisibility);
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
                onValueChange={value => setBookmarkImageMode(pageKey, value)}
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
                className="gap-0 overflow-hidden rounded-md border border-input"
                onValueChange={(value) => {
                  if (value) setBookmarkImageLayout(pageKey, value as HomepageSectionImageLayout);
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
        isError={createMutation.isError}
        errorMessage={createMutation.error?.message}
        onSubmit={(name, done) => {
          createMutation.mutate(
            {
              name,
              settings: currentSettings,
            },
            {
              onSuccess: done,
            },
          );
        }}
      />
    </div>
  );
}
