/** Common Browserless screenshot viewport sizes offered in the size picker. */
export const SCREENSHOT_SIZE_PRESETS = [
  {
    width: 1280,
    height: 720,
    label: "1280 × 720 (16:9)",
  },
  {
    width: 1920,
    height: 1080,
    label: "1920 × 1080 (16:9)",
  },
  {
    width: 1024,
    height: 768,
    label: "1024 × 768 (4:3)",
  },
  {
    width: 800,
    height: 600,
    label: "800 × 600 (4:3)",
  },
] as const;
