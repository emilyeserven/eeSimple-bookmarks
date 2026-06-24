import type { UrlCleanupMode } from "../lib/urlCleanup";
import type { Website } from "@eesimple/types";

import { useId, useRef, useState } from "react";

import { isFetchableUrl } from "../lib/url";
import { canonicalize } from "../lib/urlCleanup";

/** On-blur URL cleanup state: the typed original, its cleaned form, and whether the cleanup is live. */
export interface UrlCleanupState {
  original: string;
  cleaned: string;
  applied: boolean;
}

/** Shortened-link classification for the current URL: whether to nudge and the expanded form. */
export interface UrlShortenerState {
  nudge: boolean;
  expandedUrl: string | null;
}

/** Resolved URL to persist plus the typed original it was cleaned from (null when unchanged). */
export interface ResolvedSubmitUrl {
  finalUrl: string | null;
  originalUrl: string | null;
}

/**
 * Owns everything `BookmarkForm` does with the URL string: the canonicalize inputs (websites + ignore
 * list, mirrored into a ref for the stale submit closure), the cleanup mode, and the on-blur cleanup
 * state. Centralizes the `isFetchableUrl` / `canonicalize` calls so the form imports one module. The
 * hook owns the refs it reads; the form passes the live form's getter/setter for the URL field in.
 */
export function useBookmarkUrlProcessing(canonData: {
  websites: Website[];
  ignoreList: string[];
  customStripParams?: string[];
}) {
  // Shortened-link info for the current URL, computed on blur: whether to nudge and the expansion.
  const [urlShortener, setUrlShortener] = useState<UrlShortenerState>({
    nudge: false,
    expandedUrl: null,
  });
  // On-blur URL cleanup: when blur rewrites the field to its canonical form we keep the original so
  // the banner can offer an undo, and so the submit handler can record it as `originalUrl`. `applied`
  // flips to false after an undo, which both suppresses re-cleaning on the next blur and tells submit
  // to save the original URL untouched. The ref mirrors the state for the (stale) submit closure.
  const [urlCleanup, setUrlCleanup] = useState<UrlCleanupState | null>(null);
  const urlCleanupRef = useRef<UrlCleanupState | null>(null);
  urlCleanupRef.current = urlCleanup;
  const [showUrlCleanup, setShowUrlCleanup] = useState(false);
  const [urlCleanupMode, setUrlCleanupMode] = useState<UrlCleanupMode>("none");
  const urlCleanupModeRef = useRef<UrlCleanupMode>("none");
  urlCleanupModeRef.current = urlCleanupMode;
  // Mirror the canonicalize inputs into a ref so the (potentially stale) submit closure reads fresh
  // websites + ignore-list data.
  const canonDataRef = useRef<{ websites: Website[];
    ignoreList: string[];
    customStripParams: string[]; }>({
    websites: [],
    ignoreList: [],
    customStripParams: [],
  });
  canonDataRef.current = {
    websites: canonData.websites,
    ignoreList: canonData.ignoreList,
    customStripParams: canonData.customStripParams ?? [],
  };
  const cleanupId = useId();

  /** True when `url` is a fetchable http(s) URL (mirrors the form's title/metadata guards). */
  function isUrlFetchable(url: string): boolean {
    return isFetchableUrl(url);
  }

  /**
   * Canonicalize the URL on blur and return the cleaned form, recording the original so the banner can
   * offer an undo. Skips a value the user just restored via undo (so blur doesn't re-shorten it), and
   * clears the undo state when the URL is left unchanged. Returns the cleaned URL to write back into
   * the field, or `null` when nothing should change.
   */
  function runUrlCleanup(url: string): string | null {
    const restored = urlCleanupRef.current;
    if (restored && !restored.applied && url === restored.original) return null;
    if (!isFetchableUrl(url)) {
      setUrlCleanup(null);
      return null;
    }
    const cleaned = canonicalize(url, {
      mode: urlCleanupModeRef.current,
      websites: canonDataRef.current.websites,
      ignoreList: canonDataRef.current.ignoreList,
      customStripParams: canonDataRef.current.customStripParams,
    }).url;
    if (cleaned === url) {
      setUrlCleanup(null);
      return null;
    }
    setUrlCleanup({
      original: url,
      cleaned,
      applied: true,
    });
    return cleaned;
  }

  /**
   * Mark the cleanup undone so neither the next blur nor the submit handler re-shortens it, and return
   * the original URL to restore into the field (or `null` when there's nothing to undo).
   */
  function undoUrlCleanup(): string | null {
    const current = urlCleanupRef.current;
    if (!current) return null;
    setUrlCleanup({
      ...current,
      applied: false,
    });
    return current.original;
  }

  /**
   * Classify the URL (shortened? expandable?) so the banner can nudge / show the expansion. Returns
   * `null` when the URL isn't fetchable (the caller resets its lookup state).
   */
  function classifyUrlShortener(url: string): UrlShortenerState | null {
    if (!isFetchableUrl(url)) {
      setUrlShortener({
        nudge: false,
        expandedUrl: null,
      });
      return null;
    }
    const canon = canonicalize(url, {
      mode: "none",
      websites: canonDataRef.current.websites,
      ignoreList: canonDataRef.current.ignoreList,
    });
    const next = {
      nudge: canon.nudge,
      expandedUrl: canon.expanded ? canon.url : null,
    };
    setUrlShortener(next);
    return next;
  }

  /**
   * Resolve the URL to save plus the original it was cleaned from. When blur already cleaned the field
   * we trust that decision: an applied cleanup saves the cleaned URL (recording the typed original),
   * while an undone cleanup saves the original untouched — re-canonicalizing here would re-shorten it,
   * since param rules strip regardless of mode. Otherwise (URL edited after the cleanup, or no cleanup)
   * fall back to canonicalizing the field on submit. `quickAdd` deliberately skips expansion.
   */
  function resolveSubmitUrl(rawUrl: string, quickAdd: boolean): ResolvedSubmitUrl {
    if (rawUrl.trim() === "") {
      return {
        finalUrl: null,
        originalUrl: null,
      };
    }
    const cleanup = urlCleanupRef.current;
    if (quickAdd) {
      // "Add Now" deliberately skips shortened-link expansion: save the URL exactly as typed.
      return {
        finalUrl: rawUrl,
        originalUrl: null,
      };
    }
    if (cleanup?.applied && rawUrl === cleanup.cleaned) {
      return {
        finalUrl: cleanup.cleaned,
        originalUrl: cleanup.original,
      };
    }
    if (cleanup && !cleanup.applied && rawUrl === cleanup.original) {
      return {
        finalUrl: cleanup.original,
        originalUrl: null,
      };
    }
    const finalUrl = canonicalize(rawUrl, {
      mode: urlCleanupModeRef.current,
      websites: canonDataRef.current.websites,
      ignoreList: canonDataRef.current.ignoreList,
      customStripParams: canonDataRef.current.customStripParams,
    }).url;
    return {
      finalUrl,
      originalUrl: finalUrl !== rawUrl ? rawUrl : null,
    };
  }

  return {
    urlShortener,
    setUrlShortener,
    urlCleanup,
    setUrlCleanup,
    showUrlCleanup,
    setShowUrlCleanup,
    urlCleanupMode,
    setUrlCleanupMode,
    cleanupId,
    isUrlFetchable,
    runUrlCleanup,
    undoUrlCleanup,
    classifyUrlShortener,
    resolveSubmitUrl,
  };
}
