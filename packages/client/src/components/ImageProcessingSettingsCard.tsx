import { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import {
  useDisplayPreferenceSettings,
  useUpdateDisplayPreferenceSettings,
} from "../hooks/useAppSettings";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_IMAGE_EDGE_BOUNDS = {
  min: 200,
  max: 4000,
};
const IMAGE_QUALITY_BOUNDS = {
  min: 1,
  max: 100,
};
const MAX_IMAGE_EDGE_DEFAULT = 1200;
const IMAGE_QUALITY_DEFAULT = 80;

/**
 * Settings card for the image-processing pipeline: the longest-edge cap and WebP quality applied
 * when resizing/compressing a newly processed image (uploads, screenshots, og-image scrapes, and
 * every other entity's image). Both fields save on blur (one request + recorded toast per commit,
 * not per keystroke), mirroring `ImageAspectRatiosCard`'s Cropped W/H inputs.
 */
export function ImageProcessingSettingsCard() {
  const {
    t,
  } = useTranslation();
  const {
    data: displayData,
  } = useDisplayPreferenceSettings();
  const updateDisplay = useUpdateDisplayPreferenceSettings();

  const maxImageEdge = displayData?.maxImageEdge ?? MAX_IMAGE_EDGE_DEFAULT;
  const imageQuality = displayData?.imageQuality ?? IMAGE_QUALITY_DEFAULT;

  const [edgeInput, setEdgeInput] = useState(String(maxImageEdge));
  const [qualityInput, setQualityInput] = useState(String(imageQuality));
  useEffect(() => {
    setEdgeInput(String(maxImageEdge));
  }, [maxImageEdge]);
  useEffect(() => {
    setQualityInput(String(imageQuality));
  }, [imageQuality]);

  /** Persist an image-processing change, merging the whole display group; the hook fires the toast. */
  function saveImageProcessing(patch: { maxImageEdge: number } | { imageQuality: number }): void {
    if (!displayData) return;
    updateDisplay.mutate({
      input: {
        ...displayData,
        ...patch,
      },
      successMessage: t("Image processing settings updated"),
    });
  }

  function commitEdge() {
    const clamped = Math.min(
      MAX_IMAGE_EDGE_BOUNDS.max,
      Math.max(MAX_IMAGE_EDGE_BOUNDS.min, Math.round(Number(edgeInput) || MAX_IMAGE_EDGE_DEFAULT)),
    );
    setEdgeInput(String(clamped));
    if (clamped !== maxImageEdge) saveImageProcessing({
      maxImageEdge: clamped,
    });
  }

  function commitQuality() {
    const clamped = Math.min(
      IMAGE_QUALITY_BOUNDS.max,
      Math.max(IMAGE_QUALITY_BOUNDS.min, Math.round(Number(qualityInput) || IMAGE_QUALITY_DEFAULT)),
    );
    setQualityInput(String(clamped));
    if (clamped !== imageQuality) saveImageProcessing({
      imageQuality: clamped,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Image processing")}</CardTitle>
        <CardDescription>
          {t("Control the resize cap and compression quality for newly processed images (uploads, screenshots, and auto-fetched images). Applies to newly processed images only — existing images aren't reprocessed.")}
        </CardDescription>
      </CardHeader>
      <CardContent
        className="
          grid grid-cols-1 gap-4
          sm:grid-cols-2
        "
      >
        <div className="space-y-1">
          <Label htmlFor="max-image-edge">{t("Max image edge (px)")}</Label>
          <Input
            id="max-image-edge"
            type="number"
            min={MAX_IMAGE_EDGE_BOUNDS.min}
            max={MAX_IMAGE_EDGE_BOUNDS.max}
            value={edgeInput}
            onChange={e => setEdgeInput(e.target.value)}
            onBlur={commitEdge}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="image-quality">{t("WebP quality (1-100)")}</Label>
          <Input
            id="image-quality"
            type="number"
            min={IMAGE_QUALITY_BOUNDS.min}
            max={IMAGE_QUALITY_BOUNDS.max}
            value={qualityInput}
            onChange={e => setQualityInput(e.target.value)}
            onBlur={commitQuality}
          />
        </div>
      </CardContent>
    </Card>
  );
}
