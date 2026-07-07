import type {
  BookmarkDetailImageSize,
  BookmarkDetailVideoSize,
  DisplayPreferenceSettings,
} from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { ImageAspectRatiosCard } from "./ImageAspectRatiosCard";
import { ImageProcessingSettingsCard } from "./ImageProcessingSettingsCard";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const IMAGE_SIZE_LABELS: Record<BookmarkDetailImageSize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
};

const VIDEO_SIZE_LABELS: Record<BookmarkDetailVideoSize, string> = {
  standard: "Standard",
  half: "Half",
  twoThirds: "2/3",
  fullwidth: "Full width",
};

const MEDIA_DEFAULTS: Pick<
  DisplayPreferenceSettings,
  "bookmarkDetailImageSize" | "bookmarkDetailVideoSize"
> = {
  bookmarkDetailImageSize: "medium",
  bookmarkDetailVideoSize: "standard",
};

/** Media display preferences — bookmark-detail image/video sizing and image aspect ratios. */
export function DisplayMediaSettings() {
  const {
    t,
  } = useTranslation();
  const {
    data: displayData,
  } = useDisplayPreferenceSettings();
  const updateDisplay = useUpdateDisplayPreferenceSettings();
  const display = {
    ...MEDIA_DEFAULTS,
    ...displayData,
  };

  /** Persist a single display-preference field; the hook fires the named toast. */
  function saveDisplay(patch: Partial<DisplayPreferenceSettings>, message: string): void {
    if (!displayData) return;
    updateDisplay.mutate({
      input: {
        ...displayData,
        ...patch,
      },
      successMessage: message,
    });
  }

  const setBookmarkDetailImageSize = (size: BookmarkDetailImageSize) =>
    saveDisplay({
      bookmarkDetailImageSize: size,
    }, t("Detail image size updated"));
  const setBookmarkDetailVideoSize = (size: BookmarkDetailVideoSize) =>
    saveDisplay({
      bookmarkDetailVideoSize: size,
    }, t("Detail video size updated"));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("Bookmark media")}</CardTitle>
          <CardDescription>
            {t("Control the size of images and video embeds on the bookmark detail page.")}
          </CardDescription>
        </CardHeader>
        <CardContent
          className="
            grid grid-cols-1 gap-4
            sm:grid-cols-2
          "
        >
          <div className="space-y-1">
            <Label htmlFor="bookmark-image-size">{t("Image size")}</Label>
            <Select
              value={display.bookmarkDetailImageSize}
              onValueChange={value => setBookmarkDetailImageSize(value as BookmarkDetailImageSize)}
            >
              <SelectTrigger
                id="bookmark-image-size"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(IMAGE_SIZE_LABELS) as BookmarkDetailImageSize[]).map(value => (
                  <SelectItem
                    key={value}
                    value={value}
                  >
                    {t(IMAGE_SIZE_LABELS[value])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="bookmark-video-size">{t("Video size")}</Label>
            <Select
              value={display.bookmarkDetailVideoSize}
              onValueChange={value => setBookmarkDetailVideoSize(value as BookmarkDetailVideoSize)}
            >
              <SelectTrigger
                id="bookmark-video-size"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(VIDEO_SIZE_LABELS) as BookmarkDetailVideoSize[]).map(value => (
                  <SelectItem
                    key={value}
                    value={value}
                  >
                    {t(VIDEO_SIZE_LABELS[value])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <ImageAspectRatiosCard />
      <ImageProcessingSettingsCard />
    </div>
  );
}
