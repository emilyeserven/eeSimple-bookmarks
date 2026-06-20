import { useDisplayPresets } from "../hooks/useDisplayPresets";
import { applyDisplayPreset } from "../lib/displayPresets";
import { useUiStore } from "../stores/uiStore";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DisplayPresetSelectProps {
  pageKey: string;
  /** When false, the leading "Preset" label is omitted (e.g. in a popover header row). */
  showLabel?: boolean;
  /** Extra classes for the select trigger (e.g. a fixed width in a compact header). */
  triggerClassName?: string;
}

/**
 * The display-preset picker: applies a saved preset's layout and column settings to a listing page.
 * Reused inline in `DisplaySettingsControls` (Category Display tab, Settings → Display) and in the
 * `DisplayOptionsPopover` header. Renders nothing until at least one preset exists.
 */
export function DisplayPresetSelect({
  pageKey, showLabel = true, triggerClassName = "h-7 text-xs",
}: DisplayPresetSelectProps) {
  const {
    data: presets = [],
  } = useDisplayPresets();
  const setBookmarkColumns = useUiStore(state => state.setBookmarkColumns);
  const setBookmarkImageVisibility = useUiStore(state => state.setBookmarkImageVisibility);
  const setBookmarkImageMode = useUiStore(state => state.setBookmarkImageMode);
  const setBookmarkImageLayout = useUiStore(state => state.setBookmarkImageLayout);
  const setHiddenCardFields = useUiStore(state => state.setHiddenCardFields);
  const setSelectedDisplayPreset = useUiStore(state => state.setSelectedDisplayPreset);

  if (presets.length === 0) return null;

  const select = (
    <Select
      value=""
      onValueChange={(presetId) => {
        const preset = presets.find(p => p.id === presetId);
        if (!preset) return;
        applyDisplayPreset(pageKey, preset.settings, {
          setBookmarkColumns,
          setBookmarkImageVisibility,
          setBookmarkImageMode,
          setBookmarkImageLayout,
          setHiddenCardFields,
        });
        setSelectedDisplayPreset(pageKey, preset.id);
      }}
    >
      <SelectTrigger className={triggerClassName}>
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
  );

  if (!showLabel) return select;

  return (
    <div className="flex flex-1 items-center justify-between gap-4">
      <Label className="text-sm font-medium">Preset</Label>
      {select}
    </div>
  );
}
