import type { CustomAspectRatio } from "@eesimple/types";

import i18n from "../i18n";

/**
 * The image-aspect options offered in the Aspect dropdown: the four built-ins (Natural, Square,
 * OpenGraph, Cropped — the last labeled with the user's configured crop ratio) plus each saved custom
 * ratio. Shared by the homepage section display controls and the Card Display Rule editor.
 */
export function buildAspectOptions(croppedW: number, croppedH: number, customRatios: CustomAspectRatio[]) {
  return [
    {
      value: "natural",
      label: i18n.t("Natural"),
    },
    {
      value: "square",
      label: i18n.t("Square (1:1)"),
    },
    {
      value: "opengraph",
      label: i18n.t("OpenGraph (1.91:1)"),
    },
    {
      value: "cropped",
      label: i18n.t("Cropped ({{croppedW}}:{{croppedH}})", {
        croppedW,
        croppedH,
      }),
    },
    ...customRatios.map(r => ({
      value: r.id,
      label: `${r.name} (${r.width}:${r.height})`,
    })),
  ];
}
