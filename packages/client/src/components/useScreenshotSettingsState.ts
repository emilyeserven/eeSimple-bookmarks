import type { Bookmark } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { SCREENSHOT_SIZE_PRESETS } from "./screenshotSizePresets";
import { useDisplayPreferenceSettings } from "../hooks/useAppSettings";

/**
 * Local state for the screenshot capture controls (delay / viewport size / scroll distance):
 * seeded from the bookmark's saved settings, overlaid once with the Settings → Media → Screenshot
 * Defaults when they load — but only before the user has touched a control (a ref, not state, so
 * applying the defaults doesn't itself trigger a re-sync).
 */
export function useScreenshotSettingsState(savedSettings: Bookmark["screenshotSettings"]): {
  screenshotDelayMs: number;
  setScreenshotDelayMs: (ms: number) => void;
  screenshotWidth: number;
  screenshotHeight: number;
  setScreenshotSize: (width: number, height: number) => void;
  screenshotScrollDistance: number;
  setScreenshotScrollDistance: (px: number) => void;
} {
  const {
    data: displayPreferences,
  } = useDisplayPreferenceSettings();
  const [screenshotDelayMs, setScreenshotDelayMs] = useState(savedSettings?.delayMs ?? 0);
  const [screenshotWidth, setScreenshotWidth] = useState<number>(
    savedSettings?.width ?? SCREENSHOT_SIZE_PRESETS[0].width,
  );
  const [screenshotHeight, setScreenshotHeight] = useState<number>(
    savedSettings?.height ?? SCREENSHOT_SIZE_PRESETS[0].height,
  );
  const [screenshotScrollDistance, setScreenshotScrollDistance] = useState(savedSettings?.scrollDistance ?? 0);

  const screenshotDefaultsAppliedRef = useRef(false);
  useEffect(() => {
    if (screenshotDefaultsAppliedRef.current || !displayPreferences) return;
    screenshotDefaultsAppliedRef.current = true;
    setScreenshotDelayMs(displayPreferences.screenshotDefaultDelayMs);
    setScreenshotWidth(displayPreferences.screenshotDefaultWidth);
    setScreenshotHeight(displayPreferences.screenshotDefaultHeight);
    setScreenshotScrollDistance(displayPreferences.screenshotDefaultScrollDistance);
  }, [displayPreferences]);

  return {
    screenshotDelayMs,
    setScreenshotDelayMs: (ms) => {
      screenshotDefaultsAppliedRef.current = true;
      setScreenshotDelayMs(ms);
    },
    screenshotWidth,
    screenshotHeight,
    setScreenshotSize: (width, height) => {
      screenshotDefaultsAppliedRef.current = true;
      setScreenshotWidth(width);
      setScreenshotHeight(height);
    },
    screenshotScrollDistance,
    setScreenshotScrollDistance: (px) => {
      screenshotDefaultsAppliedRef.current = true;
      setScreenshotScrollDistance(px);
    },
  };
}
