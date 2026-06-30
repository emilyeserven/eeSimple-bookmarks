import type { Bookmark } from "@eesimple/types";

import { isInstagramReelUrl } from "@eesimple/types";
import { Download, Film, Loader2, Trash2 } from "lucide-react";

import { useArchiveBookmarkReel, useDeleteBookmarkReelArchive } from "../hooks/useBookmarks";
import { useActiveReelArchiveJobs } from "../hooks/useReelArchive";

import { Button } from "@/components/ui/button";

/** Whether the reel-archive controls apply to this bookmark: it's a reel URL, or one was archived. */
function appliesToBookmark(bookmark: Bookmark): boolean {
  return bookmark.reelArchive !== null || (bookmark.url !== null && isInstagramReelUrl(bookmark.url));
}

/**
 * Header trigger to capture (or re-capture) a bookmark's Instagram reel video into object storage.
 * Self-contained — owns the mutation + pending state. Renders nothing unless reel archiving is
 * enabled (Browserless + object storage) and the bookmark is a reel (or already has an archive), so
 * callers can drop it in unconditionally next to the ArchiveBox actions.
 */
export function BookmarkArchiveReelButton({
  bookmark, enabled,
}: { bookmark: Bookmark;
  enabled: boolean; }) {
  const archive = useArchiveBookmarkReel();
  const {
    data: activeJobs,
  } = useActiveReelArchiveJobs();
  if (!enabled || !appliesToBookmark(bookmark)) return null;

  // Reflect an already-running capture for this bookmark so the user can't double-enqueue it.
  const jobActive = activeJobs?.some(job => job.bookmarkId === bookmark.id) ?? false;
  const busy = archive.isPending || jobActive;
  const hasArchive = bookmark.reelArchive !== null;
  const label = hasArchive ? "Re-archive reel video" : "Archive reel video";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      disabled={busy}
      onClick={() => archive.mutate(bookmark.id)}
    >
      {busy
        ? <Loader2 className="size-4 animate-spin" />
        : <Film className="size-4" />}
    </Button>
  );
}

/**
 * Player + management for a bookmark's archived reel video. Renders the stored MP4 with native
 * controls (the serving route supports Range requests so seeking works), plus download and remove
 * actions. Renders nothing until a reel has actually been archived.
 */
export function BookmarkReelArchivePlayer({
  bookmark,
}: { bookmark: Bookmark }) {
  const remove = useDeleteBookmarkReelArchive();
  const archive = bookmark.reelArchive;
  if (!archive) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">Archived reel</h2>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Download archived reel"
            title="Download archived reel"
            asChild
          >
            <a
              href={archive.url}
              download={`reel-${bookmark.id}.mp4`}
            >
              <Download className="size-4" />
            </a>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove archived reel"
            title="Remove archived reel"
            disabled={remove.isPending}
            onClick={() => remove.mutate(bookmark.id)}
          >
            {remove.isPending
              ? <Loader2 className="size-4 animate-spin" />
              : <Trash2 className="size-4" />}
          </Button>
        </div>
      </div>
      <video
        controls
        preload="metadata"
        src={archive.url}
        className="w-full max-w-xs rounded-md"
      >
        <track kind="captions" />
      </video>
    </div>
  );
}
