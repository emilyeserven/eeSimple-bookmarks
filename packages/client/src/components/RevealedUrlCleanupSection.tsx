import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { UrlCleanupMode } from "../lib/urlCleanup";
import type { Website } from "@eesimple/types";

import { UrlCleanupPanel } from "./BookmarkUrlCleanupPanel";

export interface RevealedUrlCleanupSectionProps {
  form: BookmarkFormApi;
  showUrlCleanup: boolean;
  cleanupId: string;
  urlCleanupMode: UrlCleanupMode;
  onUrlCleanupModeChange: (mode: UrlCleanupMode) => void;
  websites: Website[];
  ignoreList: string[];
  customStripParams?: string[];
}

/** The URL cleanup panel, gated on `showUrlCleanup` and subscribed to the current URL. */
export function RevealedUrlCleanupSection({
  form,
  showUrlCleanup,
  cleanupId,
  urlCleanupMode,
  onUrlCleanupModeChange,
  websites,
  ignoreList,
  customStripParams,
}: RevealedUrlCleanupSectionProps) {
  if (!showUrlCleanup) {
    return null;
  }
  return (
    <form.Subscribe selector={state => state.values.url}>
      {url => (
        <UrlCleanupPanel
          url={url}
          cleanupId={cleanupId}
          mode={urlCleanupMode}
          onModeChange={onUrlCleanupModeChange}
          websites={websites}
          ignoreList={ignoreList}
          customStripParams={customStripParams}
        />
      )}
    </form.Subscribe>
  );
}
