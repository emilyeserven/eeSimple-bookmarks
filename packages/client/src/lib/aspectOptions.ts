import type { CustomAspectRatio } from "@eesimple/types";

/**
 * The image-aspect options offered in the Aspect dropdown: the four built-ins (Natural, Square,
 * OpenGraph, Cropped — the last labeled with the user's configured crop ratio) plus each saved custom
 * ratio. Shared by the homepage section display controls and the Card Display Rule editor.
 */
export function buildAspectOptions(croppedW: number, croppedH: number, customRatios: CustomAspectRatio[]) {
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
