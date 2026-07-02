import type { DisplayPreferenceSettings } from "@eesimple/types";

import { SCREENSHOT_SIZE_PRESETS } from "./useBookmarkImageEditForm";
import {
  useDisplayPreferenceSettings,
  useUpdateDisplayPreferenceSettings,
} from "../hooks/useAppSettings";
import { notifyError, notifySuccess } from "../lib/notifications";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DELAY_OPTIONS = [
  {
    value: 0,
    label: "None",
  },
  {
    value: 2000,
    label: "2 s",
  },
  {
    value: 5000,
    label: "5 s",
  },
  {
    value: 10000,
    label: "10 s",
  },
  {
    value: 30000,
    label: "30 s",
  },
] as const;

const SCROLL_OPTIONS = [
  {
    value: 0,
    label: "None",
  },
  {
    value: 500,
    label: "500 px",
  },
  {
    value: 1000,
    label: "1000 px",
  },
  {
    value: 2000,
    label: "2000 px",
  },
  {
    value: 5000,
    label: "5000 px",
  },
] as const;

const SCREENSHOT_DEFAULTS: Pick<
  DisplayPreferenceSettings,
  | "screenshotDefaultDelayMs"
  | "screenshotDefaultWidth"
  | "screenshotDefaultHeight"
  | "screenshotDefaultScrollDistance"
> = {
  screenshotDefaultDelayMs: 0,
  screenshotDefaultWidth: SCREENSHOT_SIZE_PRESETS[0].width,
  screenshotDefaultHeight: SCREENSHOT_SIZE_PRESETS[0].height,
  screenshotDefaultScrollDistance: 0,
};

/**
 * Default wait / viewport size / scroll distance pre-filled into the "Page screenshot" capture
 * controls on a bookmark's Edit → Image tab (`BookmarkImageEditForm`).
 */
export function ScreenshotDefaultsSettings() {
  const {
    data: displayData,
  } = useDisplayPreferenceSettings();
  const updateDisplay = useUpdateDisplayPreferenceSettings();
  const display = {
    ...SCREENSHOT_DEFAULTS,
    ...displayData,
  };

  /** Persist a single display-preference field and fire the named toast. */
  function saveDisplay(patch: Partial<DisplayPreferenceSettings>, message: string): void {
    if (!displayData) return;
    updateDisplay.mutate({
      ...displayData,
      ...patch,
    }, {
      onSuccess: () => notifySuccess(message),
      onError: error => notifyError(error.message),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Screenshot defaults</CardTitle>
        <CardDescription>
          Defaults pre-filled into a bookmark&apos;s &ldquo;Page screenshot&rdquo; capture controls
          on its Edit → Image tab. Changing these does not affect screenshots already taken.
        </CardDescription>
      </CardHeader>
      <CardContent
        className="
          grid grid-cols-1 gap-4
          sm:grid-cols-3
        "
      >
        <div className="space-y-1">
          <Label htmlFor="screenshot-default-delay">Wait</Label>
          <Select
            value={String(display.screenshotDefaultDelayMs)}
            onValueChange={value => saveDisplay({
              screenshotDefaultDelayMs: Number(value),
            }, "Screenshot wait default updated")}
          >
            <SelectTrigger
              id="screenshot-default-delay"
              className="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DELAY_OPTIONS.map(opt => (
                <SelectItem
                  key={opt.value}
                  value={String(opt.value)}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="screenshot-default-size">Size</Label>
          <Select
            value={`${display.screenshotDefaultWidth}x${display.screenshotDefaultHeight}`}
            onValueChange={(value) => {
              const preset = SCREENSHOT_SIZE_PRESETS.find(p => `${p.width}x${p.height}` === value);
              if (preset) {
                saveDisplay({
                  screenshotDefaultWidth: preset.width,
                  screenshotDefaultHeight: preset.height,
                }, "Screenshot size default updated");
              }
            }}
          >
            <SelectTrigger
              id="screenshot-default-size"
              className="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCREENSHOT_SIZE_PRESETS.map(preset => (
                <SelectItem
                  key={preset.label}
                  value={`${preset.width}x${preset.height}`}
                >
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="screenshot-default-scroll">Scroll</Label>
          <Select
            value={String(display.screenshotDefaultScrollDistance)}
            onValueChange={value => saveDisplay({
              screenshotDefaultScrollDistance: Number(value),
            }, "Screenshot scroll default updated")}
          >
            <SelectTrigger
              id="screenshot-default-scroll"
              className="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCROLL_OPTIONS.map(opt => (
                <SelectItem
                  key={opt.value}
                  value={String(opt.value)}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
