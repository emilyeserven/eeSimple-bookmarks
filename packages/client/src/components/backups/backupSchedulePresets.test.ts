// @vitest-environment node
import { describe, expect, it } from "vitest";

import { backupSchedulePresets, CUSTOM_SCHEDULE, presetValueFor } from "./backupSchedulePresets";

describe("presetValueFor", () => {
  it("selects the matching preset for a stored schedule", () => {
    for (const preset of backupSchedulePresets()) {
      expect(presetValueFor(preset.cron)).toBe(preset.cron);
    }
  });

  it("falls back to Custom for any other cron expression", () => {
    expect(presetValueFor("30 4 * * 1-5")).toBe(CUSTOM_SCHEDULE);
    expect(presetValueFor("@daily")).toBe(CUSTOM_SCHEDULE);
  });
});
