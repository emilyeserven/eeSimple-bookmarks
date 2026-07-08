import type { Bookmark } from "@eesimple/types";

import { isInstagramReelUrl } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { BookmarkArchiveReelButton, BookmarkReelArchivePlayer } from "./BookmarkReelArchive";
import { useConnectors } from "../hooks/useConnectors";

interface BookmarkVideoEditFormProps {
  bookmark: Bookmark;
}

/**
 * The reel **capture** affordance — the connector/reel gate plus the archive trigger — as its own
 * placeable **edit** field (#1163+). Self-hides its trigger behind the same messages the combined form
 * showed: "not configured" when the connector is off, "not a reel" for a non-reel with no archive.
 */
export function BookmarkReelCaptureField({
  bookmark,
}: BookmarkVideoEditFormProps) {
  const {
    data: connectors,
  } = useConnectors();
  const {
    t,
  } = useTranslation();
  const reelArchiveEnabled = connectors?.instagramReelArchive.enabled ?? false;
  const isReel = bookmark.url !== null && isInstagramReelUrl(bookmark.url);

  if (!reelArchiveEnabled) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("Instagram reel archiving isn't configured. Set up object storage (and, optionally, a Browserless endpoint) to enable it — see Settings → Connectors.")}
      </p>
    );
  }

  if (!isReel && bookmark.reelArchive === null) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("This bookmark isn't an Instagram reel, so there's no video to archive.")}
      </p>
    );
  }

  return (
    <BookmarkArchiveReelButton
      bookmark={bookmark}
      enabled={reelArchiveEnabled}
      showLabel
    />
  );
}

/**
 * Manage a bookmark's archived Instagram reel video: capture/re-capture it into object storage, play
 * it back, download it, or remove it. Recomposed from the now-separate `BookmarkReelCaptureField` +
 * `BookmarkReelArchivePlayer` (the two placeable Video-tab fields) so its story/test stay unchanged.
 */
export function BookmarkVideoEditForm({
  bookmark,
}: BookmarkVideoEditFormProps) {
  return (
    <div className="space-y-4">
      <BookmarkReelCaptureField bookmark={bookmark} />
      <BookmarkReelArchivePlayer bookmark={bookmark} />
    </div>
  );
}
