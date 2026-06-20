import type { DisplayPresetSettings } from "@eesimple/types";

import { useState } from "react";

import { Eye } from "lucide-react";

import { CardDisplayControls } from "./CardDisplayControls";
import { CardOptionsPreview } from "./CardOptionsPreview";
import { DisplayPresetSelect } from "./DisplayPresetSelect";
import { DisplaySettingsControls } from "./DisplaySettingsControls";
import { useUpdateDisplayPreset, useDisplayPresets } from "../hooks/useDisplayPresets";
import {
  useBookmarkColumns,
  useBookmarkImageLayout,
  useBookmarkImageMode,
  useBookmarkImageVisibility,
  useViewMode,
} from "../lib/bookmarkColumns";
import { displayPresetSettingsEqual } from "../lib/displayPresets";
import { useUiStore } from "../stores/uiStore";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface DisplayOptionsPopoverProps {
  pageKey: string;
  showsImages: boolean;
  showsCards: boolean;
}

type OptionsTab = "columns" | "layout";

/**
 * The merged display-options popover for listing pages: a Columns tab (card-field visibility) and a
 * Layout tab (view mode, column count, images), with the display-preset picker opposite the tab
 * switcher. Replaces the former separate CardOptionsPopover and LayoutOptionsPopover. When the
 * applied preset predates column options and otherwise matches the current state, it offers to
 * backfill the column settings onto that preset.
 */
export function DisplayOptionsPopover({
  pageKey, showsImages, showsCards,
}: DisplayOptionsPopoverProps) {
  const viewMode = useViewMode(pageKey);
  const isTable = viewMode === "table";
  const [tab, setTab] = useState<OptionsTab>(showsCards ? "columns" : "layout");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Display options"
        >
          <Eye className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-auto min-w-72"
      >
        {/* Tabs + preset selector */}
        <div className="mb-3 flex items-center justify-between gap-4">
          {showsCards
            ? (
              <ToggleGroup
                type="single"
                size="sm"
                value={tab}
                className="gap-0 overflow-hidden rounded-md border border-input"
                onValueChange={(value) => {
                  if (value) setTab(value as OptionsTab);
                }}
              >
                <ToggleGroupItem
                  value="columns"
                  className="
                    rounded-none border-r border-input
                    first:rounded-l-sm
                  "
                >
                  Columns
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="layout"
                  className="
                    rounded-none
                    last:rounded-r-sm
                  "
                >
                  Layout
                </ToggleGroupItem>
              </ToggleGroup>
            )
            : <p className="text-sm font-medium">Layout</p>}
          <DisplayPresetSelect
            pageKey={pageKey}
            showLabel={false}
            triggerClassName="h-7 w-40 text-xs"
          />
        </div>

        <UpdatePresetOffer pageKey={pageKey} />

        {showsCards && tab === "columns"
          ? (
            <div className="flex gap-4">
              {!isTable && <CardOptionsPreview pageKey={pageKey} />}
              <CardDisplayControls pageKey={pageKey} />
            </div>
          )
          : (
            <DisplaySettingsControls
              pageKey={pageKey}
              showsImages={showsImages}
              showPresetPicker={false}
            />
          )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * Inline offer shown when the applied preset predates column options (its `hiddenFields` is
 * undefined) and its layout still matches the current state — clicking it backfills the page's
 * current hidden card fields onto that preset.
 */
function UpdatePresetOffer({
  pageKey,
}: { pageKey: string }) {
  const {
    data: presets = [],
  } = useDisplayPresets();
  const updateMutation = useUpdateDisplayPreset();
  const selectedId = useUiStore(state => state.selectedDisplayPreset[pageKey]);
  const hiddenFields = useUiStore(state => state.hiddenCardFields[pageKey]) ?? [];
  const columns = useBookmarkColumns(pageKey);
  const imageMode = useBookmarkImageMode(pageKey);
  const imageVisibility = useBookmarkImageVisibility(pageKey);
  const imageLayout = useBookmarkImageLayout(pageKey);

  const preset = presets.find(p => p.id === selectedId);
  if (!preset || preset.settings.hiddenFields !== undefined) return null;

  const current: DisplayPresetSettings = {
    columns,
    imageVisibility,
    imageMode,
    imageLayout,
  };
  if (!displayPresetSettingsEqual(current, preset.settings)) return null;

  return (
    <div
      className="mb-3 rounded-md border border-dashed border-input p-2 text-xs"
    >
      <p className="mb-1.5 text-muted-foreground">
        “{preset.name}” doesn’t store column settings yet.
      </p>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="h-7 w-full text-xs"
        disabled={updateMutation.isPending}
        onClick={() => {
          updateMutation.mutate({
            id: preset.id,
            input: {
              settings: {
                ...preset.settings,
                hiddenFields,
              },
            },
          });
        }}
      >
        Update preset with column settings
      </Button>
    </div>
  );
}
