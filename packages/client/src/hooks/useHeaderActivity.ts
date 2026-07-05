import type { ActivityRow } from "../lib/headerActivity";
import type { LucideIcon } from "lucide-react";

import { Download, Film, ImageDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAutoFetchCompletionToast, useAutoFetchStatus, useAutoFetchWithFallbackCompletionToast, useAutoFetchWithFallbackStatus } from "./useGallery";
import { useActiveImports, useImportCompletionToasts } from "./useImports";
import { useActiveReelArchiveJobs, useReelArchiveCompletionToast } from "./useReelArchive";
import { useBackfillChannelImagesCompletionToast, useBackfillChannelImagesStatus } from "./useYouTubeChannels";
import { fetchRow, importRow, reelRow } from "../lib/headerActivity";

/** One titled group of activity rows in the consolidated header popover. */
export interface ActivitySection {
  key: string;
  title: string;
  icon: LucideIcon;
  rows: ActivityRow[];
}

export interface HeaderActivity {
  sections: ActivitySection[];
  /** Total number of active operations across all sections (0 = header indicator hidden). */
  activeCount: number;
}

/**
 * Aggregates every background job that used to have its own header indicator (imports, reel archiving,
 * image auto-fetch, and YouTube channel-avatar backfill) into a single render model. It owns all the
 * self-stopping poll hooks and — importantly — mounts every completion-toast hook so those toasts keep
 * firing app-wide regardless of the current route, exactly as the four separate indicators did. The
 * hook density lives here (per the controller-hook convention) so the header component stays thin.
 */
export function useHeaderActivity(): HeaderActivity {
  const {
    t,
  } = useTranslation();
  const {
    data: imports,
  } = useActiveImports();
  const {
    data: reels,
  } = useActiveReelArchiveJobs();
  const {
    data: missing,
  } = useAutoFetchStatus();
  const {
    data: fallback,
  } = useAutoFetchWithFallbackStatus();
  const {
    data: channels,
  } = useBackfillChannelImagesStatus();

  useImportCompletionToasts(imports);
  useReelArchiveCompletionToast(reels);
  useAutoFetchCompletionToast(missing);
  useAutoFetchWithFallbackCompletionToast(fallback);
  useBackfillChannelImagesCompletionToast(channels);

  const sections: ActivitySection[] = [];

  if (imports && imports.length > 0) {
    sections.push({
      key: "imports",
      title: t("Imports"),
      icon: Download,
      rows: imports.map(importRow),
    });
  }

  if (reels && reels.length > 0) {
    sections.push({
      key: "reels",
      title: t("Reels archiving"),
      icon: Film,
      rows: reels.map(reelRow),
    });
  }

  // Missing-image and screenshot-fallback fetches are mutually exclusive; show whichever is running.
  const imageRow = fetchRow("missing", t("Fetching missing images"), missing)
    ?? fetchRow("fallback", t("Screenshot fallback"), fallback);
  if (imageRow) {
    sections.push({
      key: "images",
      title: t("Fetching images"),
      icon: ImageDown,
      rows: [imageRow],
    });
  }

  const channelRow = fetchRow("channels", t("Fetching channel avatars"), channels);
  if (channelRow) {
    sections.push({
      key: "channels",
      title: t("Channel avatars"),
      icon: ImageDown,
      rows: [channelRow],
    });
  }

  return {
    sections,
    activeCount: sections.reduce((sum, section) => sum + section.rows.length, 0),
  };
}
