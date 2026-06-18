import type { ImageIntent } from "./bookmarkImageIntent";
import type { UrlCleanupMode } from "../lib/urlCleanup";
import type {
  Bookmark,
  BookmarkBooleanValue,
  BookmarkNumberValue,
  CreateBookmarkInput,
  CustomProperty,
  TagNode,
  YouTubeChannelHint,
} from "@eesimple/types";

import { useEffect, useId, useRef, useState } from "react";

import { propertyAppliesToCategory } from "@eesimple/types";
import { Brush, ChevronDown, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { z } from "zod";

import { BookmarkImageField } from "./BookmarkImageField";
import { EMPTY_IMAGE_INTENT } from "./bookmarkImageIntent";
import { TagPicker } from "./TagPicker";
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
import { useMediaTypes } from "../hooks/useMediaTypes";
import { useTagTree } from "../hooks/useTags";
import { useWebsiteLookup } from "../hooks/useWebsites";
import { applyAutofill } from "../lib/autofill";
import { useAppForm } from "../lib/form";
import { isFetchableUrl } from "../lib/url";
import { cleanUrl } from "../lib/urlCleanup";
import { useUiStore } from "../stores/uiStore";

import { Badge } from "@/components/ui/badge";
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
  mediaTypeId: z.string(),
  description: z.string(),
  tagIds: z.array(z.string()),
  priority: z.number().int(),
});

/** Slug of the built-in "Video Length" property, used to fill duration from fetched metadata. */
const VIDEO_LENGTH_SLUG = "video-length";
/** Slug of the built-in "Video" media type, auto-selected for YouTube URLs. */
const VIDEO_MEDIA_TYPE_SLUG = "video";
/** Cheap client-side check so we only hit the richer metadata endpoint for YouTube URLs. */
function looksLikeYouTube(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
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
    data: mediaTypes,
  } = useMediaTypes();
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
  const [isReportingTitle, setIsReportingTitle] = useState(false);
  const [expectedTitle, setExpectedTitle] = useState("");
  const [websiteSiteName, setWebsiteSiteName] = useState("");
  // The channel resolved from a fetched YouTube video, passed on save so the server links/creates it.
  const channelHintRef = useRef<YouTubeChannelHint | null>(null);
  const [showUrlCleanup, setShowUrlCleanup] = useState(false);
  const [urlCleanupMode, setUrlCleanupMode] = useState<UrlCleanupMode>("none");
  const urlCleanupModeRef = useRef<UrlCleanupMode>("none");
  urlCleanupModeRef.current = urlCleanupMode;
  const cleanupId = useId();
  const customRef = useRef({
    numberInputs,
    booleanInputs,
  });
  customRef.current = {
    numberInputs,
    booleanInputs,
  };

  // The image control reports its intent here; the form applies it after the bookmark is saved (so
  // it works for both create and edit). `imageFieldKey` remounts the field to clear it on reset.
  const imageIntentRef = useRef<ImageIntent>(EMPTY_IMAGE_INTENT);
  const [imageFieldKey, setImageFieldKey] = useState(0);

  // Precedence when prefilling: user input > autofill rule > category default.
  // `touchedRef` tracks fields the user edited; `ruleSetRef` tracks property ids an autofill rule
  // most recently set (so category defaults don't clobber them); `lastAutoCategoryRef` holds the
  // category we set programmatically so a user's manual pick is never overwritten.
  const touchedRef = useRef<Set<string>>(new Set());
  const ruleSetRef = useRef<{ numbers: Set<string>;
    booleans: Set<string>; }>({
    numbers: new Set(),
    booleans: new Set(),
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
  }

  // Apply a category's default property values, skipping anything the user touched or an autofill
  // rule already set (rules win over defaults), and never overwriting a non-empty number input.
  function applyCategoryDefaults(numberValues: BookmarkNumberValue[], booleanValues: BookmarkBooleanValue[]): void {
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
  }

  const form = useAppForm({
    defaultValues: {
      url: bookmark?.originalUrl ?? bookmark?.url ?? "",
      title: bookmark?.title ?? "",
      categoryId: bookmark?.categoryId ?? lockedCategoryId ?? "",
      mediaTypeId: bookmark?.mediaType?.id ?? "",
      description: bookmark?.description ?? "",
      tagIds: (bookmark?.tags.map(tag => tag.id) ?? []) as string[],
      priority: bookmark?.priority ?? 0,
    },
    validators: {
      onChange: bookmarkSchema,
    },
    onSubmit: async ({
      value,
    }) => {
      const {
        numberInputs: numbers, booleanInputs: booleans,
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

      const rawUrl = value.url;
      const finalUrl = cleanUrl(rawUrl, urlCleanupModeRef.current);
      const isModified = finalUrl !== rawUrl;

      const input: CreateBookmarkInput = {
        url: finalUrl,
        originalUrl: isModified ? rawUrl : null,
        title: value.title,
        categoryId: value.categoryId,
        mediaTypeId: value.mediaTypeId || null,
        description: value.description || null,
        tagIds: value.tagIds,
        numberValues,
        booleanValues,
        priority: value.priority,
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
      form.reset();
      setNumberInputs({});
      setBooleanInputs({});
      setWebsiteSiteName("");
      channelHintRef.current = null;
      imageIntentRef.current = EMPTY_IMAGE_INTENT;
      setImageFieldKey(key => key + 1);
      setShowUrlCleanup(false);
      setUrlCleanupMode("none");
      touchedRef.current = new Set();
      ruleSetRef.current = {
        numbers: new Set(),
        booleans: new Set(),
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
      if (force || form.getFieldValue("title").trim() === "") {
        form.setFieldValue("title", title);
      }
    }
    catch {
      // Surfaced via fetchTitle.isError below; nothing else to do here.
    }
  }

  // For a YouTube URL, pull the channel, duration, and media type from the video's metadata and
  // prefill them: the channel is held as a hint applied on save, the duration fills the built-in
  // "Video Length" property, and the media type is set to "Video". Best-effort and non-blocking.
  async function runYouTubeEnrichment(url: string): Promise<void> {
    if (!isFetchableUrl(url) || !looksLikeYouTube(url)) return;
    try {
      const meta = await fetchMetadata.mutateAsync({
        url,
      });
      if (!meta.isYouTube) return;

      if (meta.channel?.key) {
        channelHintRef.current = {
          key: meta.channel.key,
          name: meta.channel.name,
        };
      }
      const videoType = (mediaTypes ?? []).find(type => type.slug === VIDEO_MEDIA_TYPE_SLUG);
      if (videoType && !form.getFieldValue("mediaTypeId")) {
        form.setFieldValue("mediaTypeId", videoType.id);
      }
      if (meta.durationSeconds !== null) {
        const lengthProp = (customProperties ?? []).find(property => property.slug === VIDEO_LENGTH_SLUG);
        if (lengthProp) {
          touchedRef.current.add(`number:${lengthProp.id}`);
          setNumberInputs(current => ({
            ...current,
            [lengthProp.id]: String(meta.durationSeconds),
          }));
        }
      }
    }
    catch {
      // Non-fatal: enrichment is a best-effort convenience layered on the title fetch.
    }
  }

  // Check whether the URL's site is already on record so the banner can say whether a new
  // website will be created. Read-only — the site is created only when the bookmark is saved.
  function runWebsiteLookup(url: string): void {
    if (!isFetchableUrl(url)) {
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
      className="
        grid gap-4
        sm:grid-cols-2
      "
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      {/* Column 1: URL, then the New-site banner + Site name (new sites only). */}
      <div className="flex flex-col gap-4">
        <form.AppField name="url">
          {field => (
            <field.TextField
              label="URL"
              type="url"
              onBlur={() => {
                runAutofill();
                runWebsiteLookup(field.state.value);
                if (autoFetchTitle) {
                  void runFetchTitle(field.state.value, {
                    force: false,
                  });
                }
                void runYouTubeEnrichment(field.state.value);
              }}
              action={(
                <Button
                  type="button"
                  variant={showUrlCleanup ? "secondary" : "outline"}
                  size="icon"
                  title="URL cleanup"
                  aria-label="Toggle URL cleanup"
                  aria-expanded={showUrlCleanup}
                  onClick={() => setShowUrlCleanup(prev => !prev)}
                >
                  <Brush className="size-4" />
                </Button>
              )}
            />
          )}
        </form.AppField>

        <WebsiteLookupBanner
          data={websiteLookup.data}
          websiteSiteName={websiteSiteName}
          onSiteNameChange={setWebsiteSiteName}
          onSiteNameBlur={() => void runFetchTitle(form.getFieldValue("url"), {
            force: true,
          })}
        />
      </div>

      {/* Column 2: Name (auto-growing), then the incorrect-title prompt / fetch error. */}
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
                  action={(
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Fetch title from URL"
                      aria-label="Fetch title from URL"
                      disabled={!isFetchableUrl(url) || fetchTitle.isPending}
                      onClick={() => {
                        void runFetchTitle(url, {
                          force: true,
                        });
                        void runYouTubeEnrichment(url);
                      }}
                    >
                      {fetchTitle.isPending
                        ? <Loader2 className="size-4 animate-spin" />
                        : <Sparkles className="size-4" />}
                    </Button>
                  )}
                />
              )}
            </form.AppField>
          )}
        </form.Subscribe>

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

      {showUrlCleanup && (
        <form.Subscribe selector={state => state.values.url}>
          {url => (
            <UrlCleanupPanel
              url={url}
              cleanupId={cleanupId}
              mode={urlCleanupMode}
              onModeChange={setUrlCleanupMode}
            />
          )}
        </form.Subscribe>
      )}

      {lockedCategoryId
        ? null
        : (
          <form.AppField name="categoryId">
            {field => (
              <field.ComboboxField
                label="Category"
                className="sm:col-span-2"
                placeholder="Select a category"
                searchPlaceholder="Search categories…"
                emptyText="No categories found."
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

      <form.AppField name="mediaTypeId">
        {field => (
          <field.ComboboxField
            label="Media type"
            className="sm:col-span-2"
            placeholder="Select a media type"
            searchPlaceholder="Search media types…"
            emptyText="No media types found."
            options={[
              {
                value: "",
                label: "None",
              },
              ...(mediaTypes ?? []).map(type => ({
                value: type.id,
                label: type.name,
              })),
            ]}
          />
        )}
      </form.AppField>

      <form.Subscribe selector={state => state.values.categoryId}>
        {categoryId => (
          <CategoryCustomFields
            placement="default"
            className="sm:col-span-2"
            categoryId={categoryId}
            properties={customProperties ?? []}
            numberInputs={numberInputs}
            booleanInputs={booleanInputs}
            onNumberChange={handleNumberChange}
            onBooleanChange={handleBooleanChange}
          />
        )}
      </form.Subscribe>

      <form.Subscribe selector={state => state.values.url}>
        {url => (
          <Collapsible
            key={imageFieldKey}
            defaultOpen={!autoFetchImage}
            className="
              group/images space-y-2
              sm:col-span-2
            "
          >
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
                  group-data-[state=open]/images:rotate-180
                "
              />
              Images
            </CollapsibleTrigger>
            <CollapsibleContent>
              <BookmarkImageField
                existingImageUrl={bookmark?.image?.url ?? null}
                pageUrl={url}
                onChange={(intent) => {
                  imageIntentRef.current = intent;
                }}
              />
            </CollapsibleContent>
          </Collapsible>
        )}
      </form.Subscribe>

      <Collapsible
        className="
          group/advanced space-y-3
          sm:col-span-2
        "
      >
        <CollapsibleTrigger
          className="
            flex items-center gap-1 text-sm font-medium text-muted-foreground
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
          <form.AppField name="description">
            {field => <field.TextareaField label="Description" />}
          </form.AppField>

          <form.Subscribe selector={state => state.values.categoryId}>
            {categoryId => (
              <form.Field name="tagIds">
                {field => (
                  <div className="space-y-1">
                    <Label>Tags</Label>
                    <GatedTagPicker
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

          <form.AppField name="priority">
            {field => (
              <field.NumberField
                label="Priority"
                className="max-w-32"
                hint="Higher numbers appear first on the homepage."
              />
            )}
          </form.AppField>

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
                  numberInputs={numberInputs}
                  booleanInputs={booleanInputs}
                  onNumberChange={handleNumberChange}
                  onBooleanChange={handleBooleanChange}
                />
              </>
            )}
          </form.Subscribe>
        </CollapsibleContent>
      </Collapsible>

      <div className="sm:col-span-2">
        <div className="flex items-center gap-2">
          <form.AppForm>
            <form.SubmitButton
              label={isEdit ? "Save changes" : "Add bookmark"}
              pendingLabel="Saving…"
            />
          </form.AppForm>
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
}

/** TagPicker limited to the selected category's enabled root tags (empty allowlist = all). */
function GatedTagPicker({
  categoryId, tree, selectedIds, onToggle,
}: GatedTagPickerProps) {
  const {
    data: allowedRootIds,
  } = useCategoryRootTags(categoryId);

  const gated = allowedRootIds && allowedRootIds.length > 0
    ? tree.filter(root => allowedRootIds.includes(root.id))
    : tree;

  return (
    <div className="rounded-md border p-2">
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
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  onNumberChange: (propertyId: string, value: string) => void;
  onBooleanChange: (propertyId: string, value: boolean) => void;
}

/** Renders the custom-property inputs for the properties assigned to the chosen category. */
function CategoryCustomFields({
  categoryId, properties, placement, className, numberInputs, booleanInputs, onNumberChange, onBooleanChange,
}: CategoryCustomFieldsProps) {
  const categoryProps = properties.filter((property) => {
    if (!propertyAppliesToCategory(property, categoryId)) return false;
    if (!property.enabled) return false;
    // hiddenFromForm drops the field entirely; otherwise showInForm chooses the main area vs. Advanced.
    if (property.hiddenFromForm) return false;
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
  onApply: (numberValues: BookmarkNumberValue[], booleanValues: BookmarkBooleanValue[]) => void;
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
    onApply(defaults.numberValues, defaults.booleanValues);
    // Re-apply only when the category or its loaded defaults change; `onApply` is stable enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, defaults]);

  return null;
}

interface WebsiteLookupBannerProps {
  data: { exists: boolean;
    domain: string | null;
    siteName?: string | null; } | undefined;
  websiteSiteName: string;
  onSiteNameChange: (value: string) => void;
  onSiteNameBlur: () => void;
}

/** Banner shown below the URL field after a website lookup: existing vs. new site, plus site-name input. */
function WebsiteLookupBanner({
  data, websiteSiteName, onSiteNameChange, onSiteNameBlur,
}: WebsiteLookupBannerProps) {
  if (!data?.domain) return null;
  return (
    <div>
      <p
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        {data.exists
          ? (
            <>
              <Badge variant="secondary">Existing site</Badge>
              <span>{data.siteName}</span>
            </>
          )
          : (
            <>
              <Badge variant="outline">New site</Badge>
              <span>
                {data.domain}
                {" "}
                will be added
              </span>
            </>
          )}
      </p>
      {!data.exists
        ? (
          <div className="mt-2">
            <Label
              htmlFor="website-site-name"
              className="mb-1 block text-sm"
            >
              Site name
            </Label>
            <Input
              id="website-site-name"
              value={websiteSiteName}
              onChange={e => onSiteNameChange(e.target.value)}
              onBlur={onSiteNameBlur}
              placeholder={data.domain ?? ""}
            />
          </div>
        )
        : null}
    </div>
  );
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
}

/** Radio-group + live URL preview for the URL cleanup options. */
function UrlCleanupPanel({
  url, cleanupId, mode, onModeChange,
}: UrlCleanupPanelProps) {
  const preview = cleanUrl(url, mode);
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
