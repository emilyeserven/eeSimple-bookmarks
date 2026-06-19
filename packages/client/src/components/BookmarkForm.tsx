import type { ImageIntent } from "./bookmarkImageIntent";
import type {
  Bookmark,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  CreateBookmarkInput,
  YouTubeChannelHint,
} from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { useNavigate } from "@tanstack/react-router";
import { Brush, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  bookmarkSchema,
  buildCategoryPropertyValues,
  computeAutofill,
  initialImageIntent,
  looksLikeYouTube,
  stripSelfId,
} from "./bookmarkFormSchema";
import { BookmarkRevealedFields } from "./BookmarkRevealedFields";
import { useBookmarkFormData } from "./useBookmarkFormData";
import { useBookmarkUrlProcessing } from "./useBookmarkUrlProcessing";
import { useAppForm } from "../lib/form";

import { Button } from "@/components/ui/button";

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
  const {
    actions: {
      createBookmark,
      updateBookmark,
      uploadImage,
      autoImage,
      deleteImage,
      fetchTitle,
      fetchMetadata,
      websiteLookup,
    },
    websites,
    shortenerIgnoreList,
    tagTree,
    customProperties,
    categories,
    autofillRules,
    autoFetchTitle,
    autoFetchImage,
  } = useBookmarkFormData();
  const saveBookmark = isEdit ? updateBookmark : createBookmark;

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
  // All URL-string handling (on-blur cleanup, shortener classification, submit-URL resolution) plus the
  // canonicalize-input refs live in this hook so the form imports one URL module.
  const {
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
    runUrlCleanup: cleanUrl,
    undoUrlCleanup: undoCleanup,
    classifyUrlShortener,
    resolveSubmitUrl,
  } = useBookmarkUrlProcessing({
    websites: websites ?? [],
    ignoreList: shortenerIgnoreList ?? [],
  });
  // When the fetch-title button overwrites a non-empty title, record the previous value so the
  // banner can offer an undo. Cleared when the user manually edits the title field.
  const [titleFetch, setTitleFetch] = useState<{ previous: string } | null>(null);
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
    initialImageIntent(!isEdit && autoFetchImage),
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

    const result = computeAutofill({
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
        numberValues, booleanValues, dateTimeValues,
      } = buildCategoryPropertyValues(customProperties ?? [], value.categoryId, customRef.current);

      // Resolve the URL to save plus the original it was cleaned from (see resolveSubmitUrl).
      const {
        finalUrl, originalUrl,
      } = resolveSubmitUrl(value.url, quickAddRef.current);

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
      imageIntentRef.current = initialImageIntent(autoFetchImage);
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
        <BookmarkRevealedFields
          form={form}
          lockedCategoryId={lockedCategoryId}
          urlCleanup={urlCleanup}
          urlShortener={urlShortener}
          onUndoUrlCleanup={undoUrlCleanup}
          showUrlCleanup={showUrlCleanup}
          cleanupId={cleanupId}
          urlCleanupMode={urlCleanupMode}
          onUrlCleanupModeChange={setUrlCleanupMode}
          websites={websites ?? []}
          ignoreList={shortenerIgnoreList ?? []}
          websiteLookup={websiteLookup}
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
          onTitleBlur={runAutofill}
          onTitleChange={() => setTitleFetch(null)}
          onFetchTitleClick={(url) => {
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
          isFetchTitlePending={fetchTitle.isPending}
          isFetchMetadataPending={fetchMetadata.isPending}
          titleFetch={titleFetch}
          onUndoTitleFetch={undoTitleFetch}
          fetchTitleIsSuccess={fetchTitle.isSuccess}
          fetchTitleIsError={fetchTitle.isError}
          fetchTitleErrorMessage={fetchTitle.error?.message}
          fetchedTitle={fetchTitle.data?.title}
          isReportingTitle={isReportingTitle}
          onStartReporting={() => setIsReportingTitle(true)}
          expectedTitle={expectedTitle}
          onExpectedTitleChange={setExpectedTitle}
          onCancelReporting={() => {
            setIsReportingTitle(false);
            setExpectedTitle("");
          }}
          tagTree={tagTree ?? []}
          customProperties={customProperties ?? []}
          onTagToggle={() => {
            touchedRef.current.add("tags");
          }}
          numberInputs={numberInputs}
          booleanInputs={booleanInputs}
          dateTimeInputs={dateTimeInputs}
          onNumberChange={handleNumberChange}
          onBooleanChange={handleBooleanChange}
          onDateTimeChange={handleDateTimeChange}
          categories={categories ?? []}
          addCategoryOpen={addCategoryOpen}
          onAddCategoryOpenChange={setAddCategoryOpen}
          imageFieldKey={imageFieldKey}
          existingImageUrl={bookmark?.image?.url ?? null}
          defaultAuto={!isEdit && autoFetchImage}
          autoGrabError={bookmark?.imageAutoGrabError ?? null}
          onImageIntentChange={(intent) => {
            imageIntentRef.current = intent;
          }}
          onApplyCategoryDefaults={applyCategoryDefaults}
        />
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
