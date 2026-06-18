import type { ImageIntent } from "./bookmarkImageIntent";
import type { UrlCleanupMode } from "../lib/urlCleanup";
import type {
  Bookmark,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  CreateBookmarkInput,
  CustomProperty,
  TagNode,
  Website,
  YouTubeChannelHint,
} from "@eesimple/types";

import { useEffect, useId, useRef, useState } from "react";

import { propertyAppliesToCategory } from "@eesimple/types";
import { useNavigate } from "@tanstack/react-router";
import { Brush, ChevronDown, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { AddCategoryModal } from "./AddCategoryModal";
import { BookmarkImageField } from "./BookmarkImageField";
import { EMPTY_IMAGE_INTENT } from "./bookmarkImageIntent";
import { DateTimePicker } from "./DateTimePicker";
import { TagPicker } from "./TagPicker";
import { WebsiteLookupBanner } from "./WebsiteLookupBanner";
import { useShortenerIgnoreList } from "../hooks/useAppSettings";
import { useAutofillRules } from "../hooks/useAutofill";
import {
  useAutoBookmarkImage,
  useCreateBookmark,
  useDeleteBookmarkImage,
  useUpdateBookmark,
  useUploadBookmarkImage,
} from "../hooks/useBookmarks";
import { useCategories, useCategoryDefaults, useCategoryRootTags } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useFetchMetadata } from "../hooks/useFetchMetadata";
import { useFetchTitle } from "../hooks/useFetchTitle";
import { useTagTree } from "../hooks/useTags";
import { useWebsiteLookup, useWebsites } from "../hooks/useWebsites";
import { applyAutofill } from "../lib/autofill";
import { useAppForm } from "../lib/form";
import { isFetchableUrl } from "../lib/url";
import { canonicalize } from "../lib/urlCleanup";
import { useUiStore } from "../stores/uiStore";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryIcon } from "@/lib/icons";

const bookmarkSchema = z.object({
  url: z.string().url("Enter a valid URL"),
  title: z.string().min(1, "Title is required"),
  categoryId: z.string().min(1, "Category is required"),
  description: z.string(),
  tagIds: z.array(z.string()),
});

/** Slug of the built-in "Video Length" property, hidden from the form (filled server-side). */
const VIDEO_LENGTH_SLUG = "video-length";
/** Cheap client-side check so we only hit the richer metadata endpoint for YouTube URLs. */
function looksLikeYouTube(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

/** Client-side mirror of the server's stripSiteNameSuffix for user-entered selfIds. */
function stripSelfId(title: string, selfId: string): string {
  const escaped = selfId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\s*[-|–—·•:／]\\s*${escaped}\\s*$`, "i");
  const stripped = title.replace(re, "").trim();
  return stripped.length > 0 ? stripped : title;
}

interface BookmarkFormProps {
  /** When provided, the form edits this bookmark instead of creating a new one. */
  bookmark?: Bookmark;
  /** Called after a successful edit (or on cancel) so the parent can close the form. */
  onDone?: () => void;
  /**
   * When set, the new bookmark is locked to this category and the Category picker is hidden —
   * used on category pages, where the category is implied by the route.
   */
  lockedCategoryId?: string;
}

/**
 * Bookmark form. Creates a new bookmark by default, or edits `bookmark` when given.
 * Owns its own mutation so the page stays focused on the list.
 */
export function BookmarkForm({
  bookmark, onDone, lockedCategoryId,
}: BookmarkFormProps = {}) {
  const isEdit = Boolean(bookmark);
  const navigate = useNavigate();
  const createBookmark = useCreateBookmark();
  const updateBookmark = useUpdateBookmark();
  const saveBookmark = isEdit ? updateBookmark : createBookmark;
  const uploadImage = useUploadBookmarkImage();
  const autoImage = useAutoBookmarkImage();
  const deleteImage = useDeleteBookmarkImage();
  const fetchTitle = useFetchTitle();
  const fetchMetadata = useFetchMetadata();
  const websiteLookup = useWebsiteLookup();
  const {
    data: websites,
  } = useWebsites();
  const {
    data: shortenerIgnoreList,
  } = useShortenerIgnoreList();
  const autoFetchTitle = useUiStore(state => state.autoFetchTitle);
  const autoFetchImage = useUiStore(state => state.autoFetchImage);
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: customProperties,
  } = useCustomProperties();
  const {
    data: categories,
  } = useCategories();
  const {
    data: autofillRules,
  } = useAutofillRules();

  // Custom-property values live outside the typed form (they're dynamic). A ref
  // mirrors them so the submit handler always reads the latest entries. When editing,
  // seed them from the bookmark's existing values (calculate results are ignored on submit).
  const [numberInputs, setNumberInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries((bookmark?.numberValues ?? []).map(entry => [entry.propertyId, String(entry.value)])));
  const [booleanInputs, setBooleanInputs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((bookmark?.booleanValues ?? []).map(entry => [entry.propertyId, entry.value])));
  const [dateTimeInputs, setDateTimeInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries((bookmark?.dateTimeValues ?? []).map(entry => [entry.propertyId, entry.value])));
  const [isReportingTitle, setIsReportingTitle] = useState(false);
  const [expectedTitle, setExpectedTitle] = useState("");
  const [websiteSiteName, setWebsiteSiteName] = useState("");
  // Drives the inline "Create category" modal opened from the Category combobox.
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  // The channel resolved from a fetched YouTube video, passed on save so the server links/creates it.
  // The ref is read by the submit handler (stale-closure-safe); the state drives the banner display.
  const channelHintRef = useRef<YouTubeChannelHint | null>(null);
  const [youtubeChannel, setYoutubeChannel] = useState<YouTubeChannelHint | null>(null);
  // Shortened-link info for the current URL, computed on blur: whether to nudge and the expansion.
  const [urlShortener, setUrlShortener] = useState<{ nudge: boolean;
    expandedUrl: string | null; }>({
    nudge: false,
    expandedUrl: null,
  });
  // On-blur URL cleanup: when blur rewrites the field to its canonical form we keep the original so
  // the banner can offer an undo, and so the submit handler can record it as `originalUrl`. `applied`
  // flips to false after an undo, which both suppresses re-cleaning on the next blur and tells submit
  // to save the original URL untouched. The ref mirrors the state for the (stale) submit closure.
  const [urlCleanup, setUrlCleanup] = useState<{ original: string;
    cleaned: string;
    applied: boolean; } | null>(null);
  const urlCleanupRef = useRef<typeof urlCleanup>(null);
  urlCleanupRef.current = urlCleanup;
  const [showUrlCleanup, setShowUrlCleanup] = useState(false);
  // When the fetch-title button overwrites a non-empty title, record the previous value so the
  // banner can offer an undo. Cleared when the user manually edits the title field.
  const [titleFetch, setTitleFetch] = useState<{ previous: string } | null>(null);
  const [urlCleanupMode, setUrlCleanupMode] = useState<UrlCleanupMode>("none");
  const urlCleanupModeRef = useRef<UrlCleanupMode>("none");
  urlCleanupModeRef.current = urlCleanupMode;
  // Mirror the canonicalize inputs into a ref so the (potentially stale) submit closure reads fresh
  // websites + ignore-list data.
  const canonDataRef = useRef<{ websites: Website[];
    ignoreList: string[]; }>({
    websites: [],
    ignoreList: [],
  });
  canonDataRef.current = {
    websites: websites ?? [],
    ignoreList: shortenerIgnoreList ?? [],
  };
  const cleanupId = useId();
  const customRef = useRef({
    numberInputs,
    booleanInputs,
    dateTimeInputs,
  });
  customRef.current = {
    numberInputs,
    booleanInputs,
    dateTimeInputs,
  };

  // The image control reports its intent here; the form applies it after the bookmark is saved (so
  // it works for both create and edit). `imageFieldKey` remounts the field to clear it on reset.
  const imageIntentRef = useRef<ImageIntent>(
    !isEdit && autoFetchImage
      ? {
        file: null,
        auto: true,
        remove: false,
      }
      : EMPTY_IMAGE_INTENT,
  );
  const [imageFieldKey, setImageFieldKey] = useState(0);

  // Progressive disclosure for new bookmarks: a fresh form shows only the URL field until the URL is
  // checked, then reveals the rest. Editing (and the right panel) starts fully expanded. `isScanning`
  // drives the Check URL button's spinner.
  const [scanned, setScanned] = useState(isEdit);
  const [isScanning, setIsScanning] = useState(false);
  // Set by the "Add Now" quick path so the submit handler saves the URL exactly as typed (no
  // shortened-link expansion). Read by the (stale) submit closure.
  const quickAddRef = useRef(false);

  // Precedence when prefilling: user input > autofill rule > category default.
  // `touchedRef` tracks fields the user edited; `ruleSetRef` tracks property ids an autofill rule
  // most recently set (so category defaults don't clobber them); `lastAutoCategoryRef` holds the
  // category we set programmatically so a user's manual pick is never overwritten.
  const touchedRef = useRef<Set<string>>(new Set());
  const ruleSetRef = useRef<{ numbers: Set<string>;
    booleans: Set<string>;
    dateTimes: Set<string>; }>({
    numbers: new Set(),
    booleans: new Set(),
    dateTimes: new Set(),
  });
  const lastAutoCategoryRef = useRef<string>("");

  // Run the autofill rules against the current URL/Title and prefill the form, never overwriting
  // a value the user has already touched. Called when the URL or Title field loses focus.
  function runAutofill(): void {
    const url = form.getFieldValue("url");
    const title = form.getFieldValue("title");
    if (!url && !title) return;

    const result = applyAutofill({
      url,
      title,
    }, autofillRules ?? []);

    if (result.categoryId) {
      const current = form.getFieldValue("categoryId");
      if (current === "" || current === lastAutoCategoryRef.current) {
        lastAutoCategoryRef.current = result.categoryId;
        form.setFieldValue("categoryId", result.categoryId);
      }
    }

    if (result.tagIds.length > 0 && !touchedRef.current.has("tags")) {
      const current = form.getFieldValue("tagIds");
      form.setFieldValue("tagIds", [...new Set([...current, ...result.tagIds])]);
    }

    ruleSetRef.current = {
      numbers: new Set(result.numberValues.map(entry => entry.propertyId)),
      booleans: new Set(result.booleanValues.map(entry => entry.propertyId)),
      dateTimes: new Set(result.dateTimeValues.map(entry => entry.propertyId)),
    };
    if (result.numberValues.length > 0) {
      setNumberInputs((current) => {
        const next = {
          ...current,
        };
        for (const entry of result.numberValues) {
          if (!touchedRef.current.has(`number:${entry.propertyId}`)) {
            next[entry.propertyId] = String(entry.value);
          }
        }
        return next;
      });
    }
    if (result.booleanValues.length > 0) {
      setBooleanInputs((current) => {
        const next = {
          ...current,
        };
        for (const entry of result.booleanValues) {
          if (!touchedRef.current.has(`boolean:${entry.propertyId}`)) {
            next[entry.propertyId] = entry.value;
          }
        }
        return next;
      });
    }
    if (result.dateTimeValues.length > 0) {
      setDateTimeInputs((current) => {
        const next = {
          ...current,
        };
        for (const entry of result.dateTimeValues) {
          if (!touchedRef.current.has(`datetime:${entry.propertyId}`)) {
            next[entry.propertyId] = entry.value;
          }
        }
        return next;
      });
    }
  }

  // Apply a category's default property values, skipping anything the user touched or an autofill
  // rule already set (rules win over defaults), and never overwriting a non-empty number input.
  function applyCategoryDefaults(
    numberValues: BookmarkNumberValue[],
    booleanValues: BookmarkBooleanValue[],
    dateTimeValues: BookmarkDateTimeValue[],
  ): void {
    setNumberInputs((current) => {
      const next = {
        ...current,
      };
      for (const entry of numberValues) {
        const existing = next[entry.propertyId];
        if (
          !touchedRef.current.has(`number:${entry.propertyId}`)
          && !ruleSetRef.current.numbers.has(entry.propertyId)
          && (existing === undefined || existing === "")
        ) {
          next[entry.propertyId] = String(entry.value);
        }
      }
      return next;
    });
    setBooleanInputs((current) => {
      const next = {
        ...current,
      };
      for (const entry of booleanValues) {
        if (
          !touchedRef.current.has(`boolean:${entry.propertyId}`)
          && !ruleSetRef.current.booleans.has(entry.propertyId)
        ) {
          next[entry.propertyId] = entry.value;
        }
      }
      return next;
    });
    setDateTimeInputs((current) => {
      const next = {
        ...current,
      };
      for (const entry of dateTimeValues) {
        const existing = next[entry.propertyId];
        if (
          !touchedRef.current.has(`datetime:${entry.propertyId}`)
          && !ruleSetRef.current.dateTimes.has(entry.propertyId)
          && (existing === undefined || existing === "")
        ) {
          next[entry.propertyId] = entry.value;
        }
      }
      return next;
    });
  }

  const form = useAppForm({
    defaultValues: {
      url: bookmark?.originalUrl ?? bookmark?.url ?? "",
      title: bookmark?.title ?? "",
      categoryId: bookmark?.categoryId ?? lockedCategoryId ?? "",
      description: bookmark?.description ?? "",
      tagIds: (bookmark?.tags.map(tag => tag.id) ?? []) as string[],
    },
    validators: {
      onChange: bookmarkSchema,
    },
    onSubmit: async ({
      value,
    }) => {
      const {
        numberInputs: numbers, booleanInputs: booleans, dateTimeInputs: dateTimes,
      } = customRef.current;
      // Only persist values for properties that belong to the chosen category and are enabled.
      const categoryProps = (customProperties ?? []).filter(property =>
        propertyAppliesToCategory(property, value.categoryId) && property.enabled);
      const numberValues: BookmarkNumberValue[] = categoryProps
        .filter(property => property.type === "number")
        .map((property) => {
          const raw = numbers[property.id] ?? "";
          return {
            property,
            raw,
          };
        })
        .filter(({
          raw,
        }) => raw.trim() !== "" && !Number.isNaN(Number(raw)))
        .map(({
          property, raw,
        }) => ({
          propertyId: property.id,
          value: Number(raw),
        }));
      const booleanValues: BookmarkBooleanValue[] = categoryProps
        .filter(property => property.type === "boolean")
        .map(property => ({
          propertyId: property.id,
          value: booleans[property.id] ?? false,
        }));
      const dateTimeValues: BookmarkDateTimeValue[] = categoryProps
        .filter(property => property.type === "datetime")
        .map(property => ({
          propertyId: property.id,
          value: (dateTimes[property.id] ?? "").trim(),
        }))
        .filter(entry => entry.value !== "");

      // Resolve the URL to save plus the original it was cleaned from. When blur already cleaned the
      // field we trust that decision: an applied cleanup saves the cleaned URL (recording the typed
      // original), while an undone cleanup saves the original untouched — re-canonicalizing here would
      // re-shorten it, since param rules strip regardless of mode. Otherwise (URL edited after the
      // cleanup, or no cleanup) fall back to canonicalizing the field on submit.
      const rawUrl = value.url;
      const cleanup = urlCleanupRef.current;
      let finalUrl: string;
      let originalUrl: string | null;
      if (quickAddRef.current) {
        // "Add Now" deliberately skips shortened-link expansion: save the URL exactly as typed.
        finalUrl = rawUrl;
        originalUrl = null;
      }
      else if (cleanup?.applied && rawUrl === cleanup.cleaned) {
        finalUrl = cleanup.cleaned;
        originalUrl = cleanup.original;
      }
      else if (cleanup && !cleanup.applied && rawUrl === cleanup.original) {
        finalUrl = cleanup.original;
        originalUrl = null;
      }
      else {
        finalUrl = canonicalize(rawUrl, {
          mode: urlCleanupModeRef.current,
          websites: canonDataRef.current.websites,
          ignoreList: canonDataRef.current.ignoreList,
        }).url;
        originalUrl = finalUrl !== rawUrl ? rawUrl : null;
      }

      // Media type, video length, and priority are intentionally omitted — the server fills the first
      // two from the URL's metadata and defaults priority. On edit, omitting them preserves the
      // existing values (the update patch skips `undefined` fields).
      const input: CreateBookmarkInput = {
        url: finalUrl,
        originalUrl,
        title: value.title,
        categoryId: value.categoryId,
        description: value.description || null,
        tagIds: value.tagIds,
        numberValues,
        booleanValues,
        dateTimeValues,
        ...(channelHintRef.current && {
          youtubeChannel: channelHintRef.current,
        }),
      };

      if (bookmark) {
        await updateBookmark.mutateAsync({
          id: bookmark.id,
          input,
        });
        await applyImageIntent(bookmark.id);
        onDone?.();
        return;
      }

      const trimmedSiteName = websiteSiteName.trim();
      const created = await createBookmark.mutateAsync({
        ...input,
        ...(trimmedSiteName && {
          websiteSiteName: trimmedSiteName,
        }),
      });
      await applyImageIntent(created.id);
      // Offer a shortcut to refine the chosen category right after saving.
      const categorySlug = (categories ?? []).find(category => category.id === value.categoryId)?.slug;
      toast.success("Bookmark added", categorySlug
        ? {
          action: {
            label: "Edit category",
            onClick: () => void navigate({
              to: "/categories/$categorySlug/edit/general",
              params: {
                categorySlug,
              },
            }),
          },
        }
        : undefined);
      form.reset();
      setNumberInputs({});
      setBooleanInputs({});
      setWebsiteSiteName("");
      channelHintRef.current = null;
      setYoutubeChannel(null);
      setUrlShortener({
        nudge: false,
        expandedUrl: null,
      });
      setUrlCleanup(null);
      imageIntentRef.current = autoFetchImage
        ? {
          file: null,
          auto: true,
          remove: false,
        }
        : EMPTY_IMAGE_INTENT;
      setImageFieldKey(key => key + 1);
      setShowUrlCleanup(false);
      setUrlCleanupMode("none");
      setScanned(false);
      quickAddRef.current = false;
      touchedRef.current = new Set();
      ruleSetRef.current = {
        numbers: new Set(),
        booleans: new Set(),
        dateTimes: new Set(),
      };
      lastAutoCategoryRef.current = "";
    },
  });

  // Custom-property change handlers, shared by the main-form and Advanced field groups. Marking the
  // field touched stops autofill/category-defaults from later overwriting the user's entry.
  function handleNumberChange(id: string, value: string): void {
    touchedRef.current.add(`number:${id}`);
    setNumberInputs(current => ({
      ...current,
      [id]: value,
    }));
  }
  function handleBooleanChange(id: string, value: boolean): void {
    touchedRef.current.add(`boolean:${id}`);
    setBooleanInputs(current => ({
      ...current,
      [id]: value,
    }));
  }
  function handleDateTimeChange(id: string, value: string): void {
    touchedRef.current.add(`datetime:${id}`);
    setDateTimeInputs(current => ({
      ...current,
      [id]: value,
    }));
  }

  // Apply the pending image intent to a saved bookmark. Non-fatal: the bookmark is already saved,
  // so an image failure just surfaces a toast (from the mutation hooks) without blocking the form.
  async function applyImageIntent(bookmarkId: string): Promise<void> {
    const intent = imageIntentRef.current;
    try {
      if (intent.file) {
        await uploadImage.mutateAsync({
          id: bookmarkId,
          file: intent.file,
        });
      }
      else if (intent.auto) {
        await autoImage.mutateAsync(bookmarkId);
      }
      else if (intent.remove) {
        await deleteImage.mutateAsync(bookmarkId);
      }
    }
    catch {
      // Surfaced via the mutation hooks' onError toast; nothing else to do here.
    }
  }

  // Fetch the page title for the current URL and write it into the Title field.
  // `force` (manual button) always overwrites; the on-blur path only fills a blank title.
  async function runFetchTitle(url: string, {
    force,
  }: { force: boolean }): Promise<void> {
    if (!isFetchableUrl(url)) return;
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
      // Surfaced via fetchTitle.isError below; nothing else to do here.
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
    if (!isFetchableUrl(url) || !looksLikeYouTube(url)) {
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

  // Canonicalize the URL on blur and rewrite the field to the cleaned form, recording the original so
  // the banner can offer an undo. Skips a value the user just restored via undo (so blur doesn't
  // re-shorten it), and clears the undo state when the URL is left unchanged.
  function runUrlCleanup(url: string): void {
    const restored = urlCleanupRef.current;
    if (restored && !restored.applied && url === restored.original) return;
    if (!isFetchableUrl(url)) {
      setUrlCleanup(null);
      return;
    }
    const cleaned = canonicalize(url, {
      mode: urlCleanupModeRef.current,
      websites: canonDataRef.current.websites,
      ignoreList: canonDataRef.current.ignoreList,
    }).url;
    if (cleaned === url) {
      setUrlCleanup(null);
      return;
    }
    form.setFieldValue("url", cleaned);
    setUrlCleanup({
      original: url,
      cleaned,
      applied: true,
    });
  }

  // Restore the URL the user typed before on-blur cleanup, and mark the cleanup undone so neither the
  // next blur nor the submit handler re-shortens it.
  function undoUrlCleanup(): void {
    const current = urlCleanupRef.current;
    if (!current) return;
    form.setFieldValue("url", current.original);
    setUrlCleanup({
      ...current,
      applied: false,
    });
  }

  function undoTitleFetch(): void {
    if (!titleFetch) return;
    form.setFieldValue("title", titleFetch.previous);
    setTitleFetch(null);
  }

  // Check whether the URL's site is already on record so the banner can say whether a new
  // website will be created. Read-only — the site is created only when the bookmark is saved.
  function runWebsiteLookup(url: string): void {
    if (!isFetchableUrl(url)) {
      websiteLookup.reset();
      setWebsiteSiteName("");
      setUrlShortener({
        nudge: false,
        expandedUrl: null,
      });
      return;
    }
    // Locally classify the URL (shortened? expandable?) so the banner can nudge / show the expansion.
    const canon = canonicalize(url, {
      mode: "none",
      websites: websites ?? [],
      ignoreList: shortenerIgnoreList ?? [],
    });
    setUrlShortener({
      nudge: canon.nudge,
      expandedUrl: canon.expanded ? canon.url : null,
    });
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

  // The full URL scan: clean the URL, apply autofill rules, look up the website, and fetch the
  // title/metadata. `revealing` is the explicit "Check URL" action — it always attempts the title
  // fetch and reveals the rest of the form; on later blurs the title fetch honours the autoFetchTitle
  // setting.
  async function performUrlScan({
    revealing,
  }: { revealing: boolean }): Promise<void> {
    setIsScanning(true);
    try {
      runUrlCleanup(form.getFieldValue("url"));
      const url = form.getFieldValue("url");
      runAutofill();
      runWebsiteLookup(url);
      const yt = looksLikeYouTube(url);
      const fillTitle = revealing || autoFetchTitle;
      // YouTube gets its title from enrichment; non-YouTube uses the strict fetch-title.
      if (fillTitle && !yt) {
        await runFetchTitle(url, {
          force: false,
        });
      }
      await runYouTubeEnrichment(url, {
        fillTitle,
        force: false,
      });
      if (revealing) setScanned(true);
    }
    finally {
      setIsScanning(false);
    }
  }

  // "Add Now" quick path: apply autofill rules and save immediately. Ensures a title (falling back to
  // the URL's host) and saves the URL exactly as typed — no metadata fetch, no shortened-link
  // expansion (the submit handler honours `quickAddRef`).
  async function handleAddNow(): Promise<void> {
    runAutofill();
    if (form.getFieldValue("title").trim() === "") {
      const url = form.getFieldValue("url");
      let fallback = url;
      try {
        fallback = new URL(url).hostname;
      }
      catch {
        // Not a parseable URL — leave the raw value as the fallback title.
      }
      form.setFieldValue("title", fallback);
    }
    quickAddRef.current = true;
    try {
      await form.handleSubmit();
    }
    finally {
      quickAddRef.current = false;
    }
  }

  // Default the category to the built-in "Default" once categories load.
  useEffect(() => {
    if (!categories || categories.length === 0) return;
    if (form.getFieldValue("categoryId")) return;
    const fallback = categories.find(category => category.builtIn) ?? categories[0];
    lastAutoCategoryRef.current = fallback.id;
    form.setFieldValue("categoryId", fallback.id);
  }, [categories, form]);

  useEffect(() => {
    if (fetchTitle.isPending) {
      setIsReportingTitle(false);
      setExpectedTitle("");
    }
  }, [fetchTitle.isPending]);

  return (
    <form
      className="space-y-4"
      onKeyDown={(event) => {
        // Pre-scan, the only field is the URL input: Enter runs "Check URL" rather than submitting
        // (the empty title would otherwise fail validation and the submit would no-op).
        if (event.key === "Enter" && !scanned && !isScanning) {
          event.preventDefault();
          void performUrlScan({
            revealing: true,
          });
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      {/* URL — full width, always shown. The cleanup toggle appears only once the form is revealed. */}
      <form.AppField name="url">
        {field => (
          <field.TextField
            label="URL"
            type="url"
            onBlur={() => {
              // Re-scan on edit (or after the form is revealed) when the URL changes; a fresh create
              // form waits for the explicit "Check URL" action instead.
              if (scanned) void performUrlScan({
                revealing: false,
              });
            }}
            action={scanned
              ? (
                <Button
                  type="button"
                  variant={showUrlCleanup ? "secondary" : "ghost"}
                  size="icon"
                  title="URL cleanup"
                  aria-label="Toggle URL cleanup"
                  aria-expanded={showUrlCleanup}
                  onClick={() => setShowUrlCleanup(prev => !prev)}
                >
                  <Brush className="size-4" />
                </Button>
              )
              : undefined}
          />
        )}
      </form.AppField>

      {scanned && (
        <>
          {/* Shortened-link disclosure: full URL shown inline directly below the URL field. */}
          {urlCleanup?.applied && (
            <div className="space-y-1 text-sm text-muted-foreground">
              {urlShortener.nudge && (
                <p
                  className="
                    text-amber-600
                    dark:text-amber-500
                  "
                >
                  This looks like a shortened link — consider using the full URL.
                </p>
              )}
              <p>
                Shortened from
                {" "}
                <span className="font-mono break-all">{urlCleanup.original}</span>
                {" · "}
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={undoUrlCleanup}
                >
                  Undo
                </Button>
              </p>
              {urlShortener.expandedUrl && (
                <p>
                  Will be saved as
                  {" "}
                  <span className="font-mono break-all">{urlShortener.expandedUrl}</span>
                </p>
              )}
            </div>
          )}

          {showUrlCleanup && (
            <form.Subscribe selector={state => state.values.url}>
              {url => (
                <UrlCleanupPanel
                  url={url}
                  cleanupId={cleanupId}
                  mode={urlCleanupMode}
                  onModeChange={setUrlCleanupMode}
                  websites={websites ?? []}
                  ignoreList={shortenerIgnoreList ?? []}
                />
              )}
            </form.Subscribe>
          )}

          {/* Left: site / shortener info derived from the URL. Right: Name + title feedback. */}
          <div
            className="
              grid gap-4
              sm:grid-cols-2
            "
          >
            <div className="flex flex-col gap-4">
              <WebsiteLookupBanner
                data={websiteLookup.data}
                isYouTube={websiteLookup.data?.domain === "youtube.com"}
                youtubeChannel={youtubeChannel}
                onChannelSelfIdsChange={(ids) => {
                  const updated = {
                    ...(youtubeChannel ?? {
                      key: "",
                      name: "",
                    }),
                    selfIds: ids,
                  };
                  channelHintRef.current = updated;
                  setYoutubeChannel(updated);
                }}
                websiteSiteName={websiteSiteName}
                onSiteNameChange={setWebsiteSiteName}
                onSiteNameBlur={() => void runFetchTitle(form.getFieldValue("url"), {
                  force: true,
                })}
              />
            </div>

            <div className="flex flex-col gap-4">
              <form.Subscribe selector={state => state.values.url}>
                {url => (
                  <form.AppField name="title">
                    {field => (
                      <field.TextareaField
                        label="Name"
                        rows={1}
                        inputClassName="min-h-9"
                        onBlur={runAutofill}
                        onChange={() => setTitleFetch(null)}
                        action={(
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Fetch title from URL"
                            aria-label="Fetch title from URL"
                            disabled={!isFetchableUrl(url) || fetchTitle.isPending || fetchMetadata.isPending}
                            onClick={() => {
                              // YouTube gets its title from enrichment; skip the strict fetch-title for it.
                              const yt = looksLikeYouTube(url);
                              if (!yt) {
                                void runFetchTitle(url, {
                                  force: true,
                                });
                              }
                              void runYouTubeEnrichment(url, {
                                fillTitle: true,
                                force: true,
                              });
                            }}
                          >
                            {fetchTitle.isPending || fetchMetadata.isPending
                              ? <Loader2 className="size-4 animate-spin" />
                              : <Sparkles className="size-4" />}
                          </Button>
                        )}
                      />
                    )}
                  </form.AppField>
                )}
              </form.Subscribe>

              {titleFetch && (
                <p className="text-sm text-muted-foreground">
                  Changed from
                  {" "}
                  <span className="font-mono">{titleFetch.previous}</span>
                  {" · "}
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={undoTitleFetch}
                  >
                    Undo
                  </Button>
                </p>
              )}

              <TitleFetchFeedback
                isSuccess={fetchTitle.isSuccess}
                isError={fetchTitle.isError}
                errorMessage={fetchTitle.error?.message}
                fetchedTitle={fetchTitle.data?.title}
                isReportingTitle={isReportingTitle}
                onStartReporting={() => setIsReportingTitle(true)}
                expectedTitle={expectedTitle}
                onExpectedTitleChange={setExpectedTitle}
                onCancelReporting={() => {
                  setIsReportingTitle(false);
                  setExpectedTitle("");
                }}
                getFormUrl={() => form.getFieldValue("url")}
                getFormTitle={() => form.getFieldValue("title")}
              />
            </div>
          </div>

          {/* Description and Tags side by side, stretched to a matching height. */}
          <div
            className="
              grid items-stretch gap-4
              sm:grid-cols-2
            "
          >
            <form.AppField name="description">
              {field => (
                <field.TextareaField
                  label="Description"
                  fill
                  inputClassName="min-h-24"
                />
              )}
            </form.AppField>

            <form.Subscribe selector={state => state.values.categoryId}>
              {categoryId => (
                <form.Field name="tagIds">
                  {field => (
                    <div className="flex h-full flex-col gap-1">
                      <Label>Tags</Label>
                      <GatedTagPicker
                        className="flex-1 overflow-auto"
                        categoryId={categoryId}
                        tree={tagTree ?? []}
                        selectedIds={field.state.value}
                        onToggle={(id) => {
                          touchedRef.current.add("tags");
                          const current = field.state.value;
                          field.handleChange(
                            current.includes(id)
                              ? current.filter(tagId => tagId !== id)
                              : [...current, id],
                          );
                        }}
                      />
                    </div>
                  )}
                </form.Field>
              )}
            </form.Subscribe>
          </div>

          <form.Subscribe selector={state => state.values.categoryId}>
            {categoryId => (
              <CategoryCustomFields
                placement="default"
                categoryId={categoryId}
                properties={customProperties ?? []}
                hiddenSlugs={[VIDEO_LENGTH_SLUG]}
                numberInputs={numberInputs}
                booleanInputs={booleanInputs}
                dateTimeInputs={dateTimeInputs}
                onNumberChange={handleNumberChange}
                onBooleanChange={handleBooleanChange}
                onDateTimeChange={handleDateTimeChange}
              />
            )}
          </form.Subscribe>

          <Collapsible className="group/advanced space-y-3">
            <CollapsibleTrigger
              className="
                flex items-center gap-1 text-sm font-medium
                text-muted-foreground
                hover:text-foreground
              "
            >
              <ChevronDown
                className="
                  size-4 transition-transform
                  group-data-[state=open]/advanced:rotate-180
                "
              />
              Advanced
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              {lockedCategoryId
                ? null
                : (
                  <form.AppField name="categoryId">
                    {field => (
                      <field.ComboboxField
                        label="Category"
                        placeholder="Select a category"
                        searchPlaceholder="Search categories…"
                        emptyText="No categories found."
                        createOption={{
                          label: "Create category",
                          onSelect: () => setAddCategoryOpen(true),
                        }}
                        options={(categories ?? []).map(category => ({
                          value: category.id,
                          label: category.name,
                          icon: (
                            <CategoryIcon
                              name={category.icon}
                              className="size-4 shrink-0"
                            />
                          ),
                        }))}
                      />
                    )}
                  </form.AppField>
                )}

              <AddCategoryModal
                open={addCategoryOpen}
                onOpenChange={setAddCategoryOpen}
                onCreated={category => form.setFieldValue("categoryId", category.id)}
              />

              <form.Subscribe selector={state => state.values.url}>
                {url => (
                  <div className="space-y-1">
                    <Label>Image</Label>
                    <BookmarkImageField
                      key={imageFieldKey}
                      existingImageUrl={bookmark?.image?.url ?? null}
                      pageUrl={url}
                      defaultAuto={!isEdit && autoFetchImage}
                      autoGrabError={bookmark?.imageAutoGrabError ?? null}
                      onChange={(intent) => {
                        imageIntentRef.current = intent;
                      }}
                    />
                  </div>
                )}
              </form.Subscribe>

              <form.Subscribe selector={state => state.values.categoryId}>
                {categoryId => (
                  <>
                    <CategoryDefaultsApplier
                      categoryId={categoryId}
                      onApply={applyCategoryDefaults}
                    />
                    <CategoryCustomFields
                      placement="advanced"
                      categoryId={categoryId}
                      properties={customProperties ?? []}
                      hiddenSlugs={[VIDEO_LENGTH_SLUG]}
                      numberInputs={numberInputs}
                      booleanInputs={booleanInputs}
                      dateTimeInputs={dateTimeInputs}
                      onNumberChange={handleNumberChange}
                      onBooleanChange={handleBooleanChange}
                      onDateTimeChange={handleDateTimeChange}
                    />
                  </>
                )}
              </form.Subscribe>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}

      <div>
        <div className="flex items-center gap-2">
          {scanned
            ? (
              <form.AppForm>
                <form.SubmitButton
                  label={isEdit ? "Save changes" : "Add Bookmark"}
                  pendingLabel="Saving…"
                />
              </form.AppForm>
            )
            : (
              <>
                <Button
                  type="button"
                  disabled={isScanning}
                  onClick={() => void performUrlScan({
                    revealing: true,
                  })}
                >
                  {isScanning
                    ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Checking…
                      </>
                    )
                    : "Check URL"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  disabled={isScanning || saveBookmark.isPending}
                  onClick={() => void handleAddNow()}
                >
                  Add Now
                </Button>
              </>
            )}
          {isEdit && onDone
            ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onDone}
              >
                Cancel
              </Button>
            )
            : null}
        </div>
        {saveBookmark.isError ? <p className="mt-2 text-sm text-destructive">{saveBookmark.error?.message}</p> : null}
      </div>
    </form>
  );
}

interface GatedTagPickerProps {
  categoryId: string;
  tree: TagNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  /** Extra classes for the bordered box (e.g. `flex-1` to fill an equal-height grid cell). */
  className?: string;
}

/** TagPicker limited to the selected category's enabled root tags (empty allowlist = all). */
function GatedTagPicker({
  categoryId, tree, selectedIds, onToggle, className,
}: GatedTagPickerProps) {
  const {
    data: allowedRootIds,
  } = useCategoryRootTags(categoryId);

  const gated = allowedRootIds && allowedRootIds.length > 0
    ? tree.filter(root => allowedRootIds.includes(root.id))
    : tree;

  return (
    <div className={`rounded-md border p-2 ${className ?? ""}`.trim()}>
      <TagPicker
        tree={gated}
        selectedIds={selectedIds}
        onToggle={onToggle}
      />
    </div>
  );
}

interface CategoryCustomFieldsProps {
  categoryId: string;
  properties: CustomProperty[];
  /** `default` shows properties flagged to appear in the main form; `advanced` shows the rest. */
  placement: "default" | "advanced";
  /** Extra classes for the root (e.g. a grid `col-span` when rendered in the main form). */
  className?: string;
  /** Property slugs to drop from rendering entirely (their value is still submitted/derived). */
  hiddenSlugs?: string[];
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  dateTimeInputs: Record<string, string>;
  onNumberChange: (propertyId: string, value: string) => void;
  onBooleanChange: (propertyId: string, value: boolean) => void;
  onDateTimeChange: (propertyId: string, value: string) => void;
}

/** Renders the custom-property inputs for the properties assigned to the chosen category. */
function CategoryCustomFields({
  categoryId, properties, placement, className, hiddenSlugs,
  numberInputs, booleanInputs, dateTimeInputs,
  onNumberChange, onBooleanChange, onDateTimeChange,
}: CategoryCustomFieldsProps) {
  const categoryProps = properties.filter((property) => {
    if (!propertyAppliesToCategory(property, categoryId)) return false;
    if (!property.enabled) return false;
    // hiddenFromForm drops the field entirely; otherwise showInForm chooses the main area vs. Advanced.
    if (property.hiddenFromForm) return false;
    // Slugs the form fills server-side (e.g. Video Length) are hidden but still persisted.
    if (hiddenSlugs?.includes(property.slug)) return false;
    return placement === "default" ? property.showInForm : !property.showInForm;
  });
  if (categoryProps.length === 0) return null;

  return (
    <div
      className={`
        space-y-3
        ${className ?? ""}
      `}
    >
      <span className="text-sm font-medium">Properties</span>
      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        {categoryProps.map((property) => {
          if (property.type === "number") {
            return (
              <div
                key={property.id}
                className="space-y-1"
              >
                <Label htmlFor={`property-${property.id}`}>
                  {property.name}
                  {property.unitPlural ? ` (${property.unitPlural})` : ""}
                </Label>
                <Input
                  id={`property-${property.id}`}
                  type="number"
                  value={numberInputs[property.id] ?? ""}
                  onChange={event => onNumberChange(property.id, event.target.value)}
                />
                {property.description
                  ? <p className="text-xs text-muted-foreground">{property.description}</p>
                  : null}
              </div>
            );
          }
          if (property.type === "boolean") {
            return (
              <div
                key={property.id}
                className="space-y-1 self-end"
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`property-${property.id}`}
                    checked={booleanInputs[property.id] ?? false}
                    onCheckedChange={checked => onBooleanChange(property.id, checked === true)}
                  />
                  <Label htmlFor={`property-${property.id}`}>{property.name}</Label>
                </div>
                {property.description
                  ? <p className="text-xs text-muted-foreground">{property.description}</p>
                  : null}
              </div>
            );
          }
          if (property.type === "datetime") {
            return (
              <div
                key={property.id}
                className="space-y-1"
              >
                <Label htmlFor={`property-${property.id}`}>{property.name}</Label>
                <DateTimePicker
                  id={`property-${property.id}`}
                  format={property.dateTimeFormat ?? "date"}
                  value={dateTimeInputs[property.id] ?? null}
                  onChange={value => onDateTimeChange(property.id, value ?? "")}
                />
                {property.description
                  ? <p className="text-xs text-muted-foreground">{property.description}</p>
                  : null}
              </div>
            );
          }
          // calculate: computed server-side; shown read-only so the user knows it exists.
          return (
            <div
              key={property.id}
              className="space-y-1"
            >
              <Label>{property.name}</Label>
              <p className="text-xs text-muted-foreground">Calculated automatically when saved.</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface CategoryDefaultsApplierProps {
  categoryId: string;
  onApply: (
    numberValues: BookmarkNumberValue[],
    booleanValues: BookmarkBooleanValue[],
    dateTimeValues: BookmarkDateTimeValue[],
  ) => void;
}

/**
 * Headless helper that loads the chosen category's default property values and applies them to the
 * form whenever the category changes. Renders nothing — the parent owns the property inputs.
 */
function CategoryDefaultsApplier({
  categoryId, onApply,
}: CategoryDefaultsApplierProps) {
  const {
    data: defaults,
  } = useCategoryDefaults(categoryId);

  useEffect(() => {
    if (!categoryId || !defaults) return;
    onApply(defaults.numberValues, defaults.booleanValues, defaults.dateTimeValues);
    // Re-apply only when the category or its loaded defaults change; `onApply` is stable enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, defaults]);

  return null;
}

function openGitHubIssue(title: string, body: string): void {
  const url = new URL("https://github.com/emilyeserven/eesimple-bookmarks/issues/new");
  url.searchParams.set("title", title);
  url.searchParams.set("body", body);
  url.searchParams.set("labels", "bug");
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}

interface IncorrectTitleReporterProps {
  fetchedTitle: string | undefined;
  expectedTitle: string;
  onExpectedTitleChange: (v: string) => void;
  onCancel: () => void;
  getFormUrl: () => string;
  getFormTitle: () => string;
}

function IncorrectTitleReporter({
  fetchedTitle, expectedTitle, onExpectedTitleChange, onCancel, getFormUrl, getFormTitle,
}: IncorrectTitleReporterProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="expected-title">Expected title</Label>
      <Input
        id="expected-title"
        value={expectedTitle}
        onChange={e => onExpectedTitleChange(e.target.value)}
        placeholder="Enter the correct title"
        className="h-8"
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!expectedTitle.trim()}
          onClick={() => {
            const body = [
              `**URL:** ${getFormUrl()}`,
              `**Actual title parsed:** ${fetchedTitle ?? getFormTitle()}`,
              `**Expected title:** ${expectedTitle}`,
            ].join("\n\n");
            openGitHubIssue("Incorrect page title parsed", body);
          }}
        >
          Open GitHub issue
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

interface TitleFetchFeedbackProps {
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string | undefined;
  fetchedTitle: string | undefined;
  isReportingTitle: boolean;
  onStartReporting: () => void;
  expectedTitle: string;
  onExpectedTitleChange: (v: string) => void;
  onCancelReporting: () => void;
  /** Returns the current URL at click-time (not a reactive value). */
  getFormUrl: () => string;
  /** Returns the current title at click-time (not a reactive value). */
  getFormTitle: () => string;
}

/** Success/error feedback shown below the title field after a fetch-title attempt. */
function TitleFetchFeedback({
  isSuccess,
  isError,
  errorMessage,
  fetchedTitle,
  isReportingTitle,
  onStartReporting,
  expectedTitle,
  onExpectedTitleChange,
  onCancelReporting,
  getFormUrl,
  getFormTitle,
}: TitleFetchFeedbackProps) {
  if (isSuccess) {
    return (
      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
        {!isReportingTitle
          ? (
            <p>
              Incorrect title?
              {" "}
              <button
                type="button"
                className="
                  underline
                  hover:text-foreground
                "
                onClick={onStartReporting}
              >
                Report it
              </button>
            </p>
          )
          : (
            <IncorrectTitleReporter
              fetchedTitle={fetchedTitle}
              expectedTitle={expectedTitle}
              onExpectedTitleChange={onExpectedTitleChange}
              onCancel={onCancelReporting}
              getFormUrl={getFormUrl}
              getFormTitle={getFormTitle}
            />
          )}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <p className="text-destructive">
          {errorMessage ?? "Could not fetch a title for that URL."}
        </p>
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const body = [
                `**URL:** ${getFormUrl()}`,
                `**Error:** ${errorMessage ?? "Unknown error"}`,
              ].join("\n\n");
              openGitHubIssue("Title fetch failed", body);
            }}
          >
            File GitHub issue
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

interface UrlCleanupPanelProps {
  url: string;
  cleanupId: string;
  mode: UrlCleanupMode;
  onModeChange: (mode: UrlCleanupMode) => void;
  websites: Website[];
  ignoreList: string[];
}

/** Radio-group + live URL preview for the URL cleanup options. */
function UrlCleanupPanel({
  url, cleanupId, mode, onModeChange, websites, ignoreList,
}: UrlCleanupPanelProps) {
  const preview = canonicalize(url, {
    mode,
    websites,
    ignoreList,
  }).url;
  return (
    <div
      className="
        space-y-4 rounded-lg border bg-muted/50 p-4
        sm:col-span-2
      "
    >
      <p className="text-sm font-medium">URL Cleanup</p>

      <div className="space-y-2">
        {(
          [
            {
              value: "none" as UrlCleanupMode,
              label: "No modification",
            },
            {
              value: "trackers" as UrlCleanupMode,
              label: "Just trackers",
            },
            {
              value: "all" as UrlCleanupMode,
              label: "All params",
            },
          ]
        ).map(option => (
          <div
            key={option.value}
            className="flex items-center gap-2"
          >
            <input
              type="radio"
              id={`${cleanupId}-${option.value}`}
              name={`${cleanupId}-mode`}
              value={option.value}
              checked={mode === option.value}
              onChange={() => onModeChange(option.value)}
              className="accent-primary"
            />
            <Label htmlFor={`${cleanupId}-${option.value}`}>{option.label}</Label>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Preview</p>
        <div className="flex items-center gap-2">
          <Input
            value={preview}
            readOnly
            className="font-mono text-sm"
            aria-label="Cleaned URL preview"
          />
          {isFetchableUrl(preview)
            ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                asChild
              >
                <a
                  href={preview}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open cleaned URL in new tab"
                >
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            )
            : (
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled
                aria-label="Open cleaned URL in new tab"
              >
                <ExternalLink className="size-4" />
              </Button>
            )}
        </div>
      </div>
    </div>
  );
}
