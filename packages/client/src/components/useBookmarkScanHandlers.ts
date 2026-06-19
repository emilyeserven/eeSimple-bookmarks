import type { useBookmarkFormActions } from "./useBookmarkFormActions";
import type { useBookmarkUrlProcessing } from "./useBookmarkUrlProcessing";
import type { YouTubeChannelHint } from "@eesimple/types";
import type { Dispatch, RefObject, SetStateAction } from "react";

import { looksLikeYouTube, stripSelfId } from "./bookmarkFormSchema";

type Actions = ReturnType<typeof useBookmarkFormActions>;
type UrlProcessing = ReturnType<typeof useBookmarkUrlProcessing>;

/** The bookmark-form fields the scan handlers read from / write to. */
type ScanField = "url" | "title" | "description";

/** Minimal slice of a TanStack form the scan handlers touch (kept narrow to avoid the form's heavy generics). */
interface ScanForm {
  getFieldValue: (name: ScanField) => string;
  setFieldValue: (name: ScanField, value: string) => void;
}

interface UseBookmarkScanHandlersParams {
  form: ScanForm;
  /** The resolved-channel ref the owning form's submit handler reads; mutated by enrichment here. */
  channelHintRef: RefObject<YouTubeChannelHint | null>;
  /** Mirror state of `channelHintRef` that drives the banner display. */
  setYoutubeChannel: Dispatch<SetStateAction<YouTubeChannelHint | null>>;
  /** The new-site name the title fetch sends and the website lookup fills. */
  websiteSiteName: string;
  setWebsiteSiteName: Dispatch<SetStateAction<string>>;
  /** Records the title a fetch overwrote, so the banner can offer an undo. */
  titleFetch: { previous: string } | null;
  setTitleFetch: Dispatch<SetStateAction<{ previous: string } | null>>;
  fetchTitle: Actions["fetchTitle"];
  fetchMetadata: Actions["fetchMetadata"];
  websiteLookup: Actions["websiteLookup"];
  isUrlFetchable: UrlProcessing["isUrlFetchable"];
  classifyUrlShortener: UrlProcessing["classifyUrlShortener"];
  /** The URL-string cleanup from `useBookmarkUrlProcessing` (its `runUrlCleanup`). */
  cleanUrl: UrlProcessing["runUrlCleanup"];
  /** The URL-string cleanup undo from `useBookmarkUrlProcessing` (its `undoUrlCleanup`). */
  undoCleanup: UrlProcessing["undoUrlCleanup"];
}

/**
 * The title-fetch / YouTube-enrichment / URL-cleanup / website-lookup handlers shared verbatim by
 * `BookmarkForm` and `BookmarkGeneralForm`. The small slice of UI state these read/write
 * (`websiteSiteName`, `titleFetch`, the resolved YouTube channel) stays owned by the component — its
 * submit/reset handlers need those setters declared before `form` — and is threaded in here. Each
 * form keeps its own `runAutofill` / `performUrlScan` orchestration and calls these from it.
 */
export function useBookmarkScanHandlers({
  form,
  channelHintRef,
  setYoutubeChannel,
  websiteSiteName,
  setWebsiteSiteName,
  titleFetch,
  setTitleFetch,
  fetchTitle,
  fetchMetadata,
  websiteLookup,
  isUrlFetchable,
  classifyUrlShortener,
  cleanUrl,
  undoCleanup,
}: UseBookmarkScanHandlersParams) {
  // Fetch the page title for the current URL and write it into the Title field.
  // `force` (manual button) always overwrites; the on-blur path only fills a blank title.
  async function runFetchTitle(url: string, {
    force,
  }: { force: boolean }): Promise<void> {
    if (!isUrlFetchable(url)) return;
    if (!force && form.getFieldValue("title").trim() !== "") return;
    try {
      const {
        title,
      } = await fetchTitle.mutateAsync({
        url,
        siteName: websiteSiteName.trim() || undefined,
      });
      const prevTitle = form.getFieldValue("title");
      if (force || prevTitle.trim() === "") {
        form.setFieldValue("title", title);
        if (force && prevTitle.trim() !== "") setTitleFetch({
          previous: prevTitle,
        });
        else setTitleFetch(null);
      }
    }
    catch {
      // Surfaced via fetchTitle.isError; nothing else to do here.
    }
  }

  // For a YouTube URL, pull the title and channel from the video's metadata: the title is written
  // into the Name field (this owns the title fetch for YouTube, so runFetchTitle is skipped) and the
  // channel is held as a hint applied on save (and shown in the banner). The media type and video
  // length are intentionally NOT set here — the server fills them from the URL on save.
  // `fillTitle` mirrors the autoFetchTitle gate; `force` overwrites an existing title (manual button).
  // Best-effort and non-blocking.
  async function runYouTubeEnrichment(url: string, {
    fillTitle, force,
  }: { fillTitle: boolean;
    force: boolean; }): Promise<void> {
    // A non-YouTube URL clears any channel left over from a previously-entered YouTube link.
    if (!isUrlFetchable(url) || !looksLikeYouTube(url)) {
      channelHintRef.current = null;
      setYoutubeChannel(null);
      return;
    }
    // YouTube owns its own title fetch here, so clear any stale fetch-title error from a prior URL.
    fetchTitle.reset();
    try {
      const meta = await fetchMetadata.mutateAsync({
        url,
      });
      if (!meta.isYouTube) {
        channelHintRef.current = null;
        setYoutubeChannel(null);
        return;
      }

      // Capture selfIds the user has already entered for this channel before overwriting the hint,
      // so we can (a) preserve them in the merged hint and (b) apply client-side stripping for any
      // that the server didn't know about (not yet saved to the DB).
      const existingSelfIds
        = channelHintRef.current?.key === meta.channel?.key
          ? (channelHintRef.current?.selfIds ?? [])
          : [];

      // Fill the Name from the (clean) oEmbed title, matching runFetchTitle's overwrite rule.
      // After the server has stripped DB-known selfIds, strip any user-added ones client-side.
      if (fillTitle && meta.title && (force || form.getFieldValue("title").trim() === "")) {
        const serverSelfIdSet = new Set(meta.channel?.selfIds ?? []);
        const userAddedSelfIds = existingSelfIds.filter(id => !serverSelfIdSet.has(id));
        let title = meta.title;
        for (const selfId of userAddedSelfIds) {
          const stripped = stripSelfId(title, selfId);
          if (stripped !== title) {
            title = stripped;
            break;
          }
        }
        const prevTitle = form.getFieldValue("title");
        form.setFieldValue("title", title);
        if (force && prevTitle.trim() !== "") setTitleFetch({
          previous: prevTitle,
        });
        else setTitleFetch(null);
      }
      // Fill the Description from the watch-page og:description when the field is still empty.
      if (fillTitle && meta.description && form.getFieldValue("description").trim() === "") {
        form.setFieldValue("description", meta.description);
      }
      if (meta.channel?.key) {
        // Merge server selfIds with user-entered ones (union, server IDs first) so the user's
        // edits survive a re-fetch.
        const mergedSelfIds = [...new Set([...(meta.channel.selfIds ?? []), ...existingSelfIds])];
        const hint = {
          key: meta.channel.key,
          name: meta.channel.name,
          selfIds: mergedSelfIds,
        };
        channelHintRef.current = hint;
        setYoutubeChannel(hint);
      }
    }
    catch {
      // Non-fatal: enrichment is a best-effort convenience layered on the title fetch.
    }
  }

  // Canonicalize the URL on blur and rewrite the field to the cleaned form (the hook records the
  // original for undo and tracks the cleanup state); a `null` result means leave the field as-is.
  function runUrlCleanup(url: string): void {
    const cleaned = cleanUrl(url);
    if (cleaned !== null) form.setFieldValue("url", cleaned);
  }

  // Restore the URL the user typed before on-blur cleanup (the hook marks the cleanup undone so
  // neither the next blur nor the submit handler re-shortens it).
  function undoUrlCleanup(): void {
    const original = undoCleanup();
    if (original !== null) form.setFieldValue("url", original);
  }

  function undoTitleFetch(): void {
    if (!titleFetch) return;
    form.setFieldValue("title", titleFetch.previous);
    setTitleFetch(null);
  }

  // Check whether the URL's site is already on record so the banner can say whether a new
  // website will be created. Read-only — the site is created only when the bookmark is saved.
  function runWebsiteLookup(url: string): void {
    // Locally classify the URL (shortened? expandable?) so the banner can nudge / show the expansion;
    // a `null` result means the URL isn't fetchable, so reset the lookup + site-name state.
    if (classifyUrlShortener(url) === null) {
      websiteLookup.reset();
      setWebsiteSiteName("");
      return;
    }
    websiteLookup.mutate(url, {
      onSuccess: (data) => {
        // Pre-fill the site name input with the domain when it's a new site.
        if (!data.exists && data.domain) {
          setWebsiteSiteName(data.domain);
        }
        else {
          setWebsiteSiteName("");
        }
      },
    });
  }

  return {
    runFetchTitle,
    runYouTubeEnrichment,
    runUrlCleanup,
    undoUrlCleanup,
    undoTitleFetch,
    runWebsiteLookup,
  };
}
