import type {
  Bookmark,
  BookmarkUrlDuplicateResult,
  YouTubeChannelHint,
} from "@eesimple/types";

import { useRef, useState } from "react";

import { Brush, Loader2, Sparkles } from "lucide-react";

import { AddCategoryModal } from "./AddCategoryModal";
import { BookmarkAutofillOffer } from "./BookmarkAutofillOffer";
import {
  bookmarkSchema,
  computeAutofill,
  looksLikeYouTube,
  stripSelfId,
} from "./bookmarkFormSchema";
import { GatedTagPicker } from "./BookmarkTagsField";
import { TitleFetchFeedback } from "./BookmarkTitleFeedback";
import { BookmarkUrlCleanupBanner } from "./BookmarkUrlCleanupBanner";
import { UrlCleanupPanel } from "./BookmarkUrlCleanupPanel";
import { BookmarkUrlDuplicateWarnings } from "./BookmarkUrlDuplicateWarnings";
import { useBookmarkFormData } from "./useBookmarkFormData";
import { useBookmarkUrlProcessing } from "./useBookmarkUrlProcessing";
import { WebsiteLookupBanner } from "./WebsiteLookupBanner";
import { useAppForm } from "../lib/form";
import { notifySuccess } from "../lib/notifications";
import { isFetchableUrl } from "../lib/url";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CategoryIcon } from "@/lib/icons";

interface BookmarkGeneralFormProps {
  bookmark: Bookmark;
}

/** Edit a bookmark's core fields: URL, name, description, category, and tags. */
export function BookmarkGeneralForm({
  bookmark,
}: BookmarkGeneralFormProps) {
  const {
    actions: {
      updateBookmark,
      fetchTitle,
      fetchMetadata,
      websiteLookup,
      urlDuplicateCheck,
    },
    websites,
    shortenerIgnoreList,
    tagTree,
    categories,
    autofillRules,
    autoFetchTitle,
  } = useBookmarkFormData();

  const {
    urlShortener,
    urlCleanup,
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

  const [isReportingTitle, setIsReportingTitle] = useState(false);
  const [expectedTitle, setExpectedTitle] = useState("");
  const [websiteSiteName, setWebsiteSiteName] = useState("");
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const channelHintRef = useRef<YouTubeChannelHint | null>(null);
  const [youtubeChannel, setYoutubeChannel] = useState<YouTubeChannelHint | null>(null);
  const [titleFetch, setTitleFetch] = useState<{ previous: string } | null>(null);
  const [urlDuplicate, setUrlDuplicate] = useState<BookmarkUrlDuplicateResult | null>(null);
  const [autofillOfferDismissed, setAutofillOfferDismissed] = useState(false);
  const touchedRef = useRef<Set<string>>(new Set());

  const form = useAppForm({
    defaultValues: {
      url: bookmark.originalUrl ?? bookmark.url,
      title: bookmark.title,
      categoryId: bookmark.categoryId ?? "",
      description: bookmark.description ?? "",
      tagIds: (bookmark.tags.map(tag => tag.id)) as string[],
    },
    validators: {
      onChange: bookmarkSchema,
    },
    onSubmit: async ({
      value,
    }) => {
      const {
        finalUrl, originalUrl,
      } = resolveSubmitUrl(value.url, false);

      await updateBookmark.mutateAsync({
        id: bookmark.id,
        input: {
          url: finalUrl,
          originalUrl,
          title: value.title,
          categoryId: value.categoryId,
          description: value.description || null,
          tagIds: value.tagIds,
          ...(channelHintRef.current && {
            youtubeChannel: channelHintRef.current,
          }),
        },
      });
      notifySuccess("Changes saved");
    },
  });

  function runAutofill(): void {
    const url = form.getFieldValue("url");
    const title = form.getFieldValue("title");
    if (!url && !title) return;

    const result = computeAutofill({
      url,
      title,
    }, autofillRules ?? []);

    if (result.categoryId) {
      if (!touchedRef.current.has("categoryId")) {
        form.setFieldValue("categoryId", result.categoryId);
      }
    }

    if (result.tagIds.length > 0 && !touchedRef.current.has("tags")) {
      const current = form.getFieldValue("tagIds");
      form.setFieldValue("tagIds", [...new Set([...current, ...result.tagIds])]);
    }
  }

  function runUrlCleanup(url: string): void {
    const cleaned = cleanUrl(url);
    if (cleaned !== null) form.setFieldValue("url", cleaned);
  }

  function undoUrlCleanup(): void {
    const original = undoCleanup();
    if (original !== null) form.setFieldValue("url", original);
  }

  function undoTitleFetch(): void {
    if (!titleFetch) return;
    form.setFieldValue("title", titleFetch.previous);
    setTitleFetch(null);
  }

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

  async function runYouTubeEnrichment(url: string, {
    fillTitle, force,
  }: { fillTitle: boolean;
    force: boolean; }): Promise<void> {
    if (!isUrlFetchable(url) || !looksLikeYouTube(url)) {
      channelHintRef.current = null;
      setYoutubeChannel(null);
      return;
    }
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
      const existingSelfIds
        = channelHintRef.current?.key === meta.channel?.key
          ? (channelHintRef.current?.selfIds ?? [])
          : [];
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
      if (fillTitle && meta.description && form.getFieldValue("description").trim() === "") {
        form.setFieldValue("description", meta.description);
      }
      if (meta.channel?.key) {
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
      // Non-fatal.
    }
  }

  function runWebsiteLookup(url: string): void {
    if (classifyUrlShortener(url) === null) {
      websiteLookup.reset();
      setWebsiteSiteName("");
      return;
    }
    websiteLookup.mutate(url, {
      onSuccess: (data) => {
        if (!data.exists && data.domain) {
          setWebsiteSiteName(data.domain);
        }
        else {
          setWebsiteSiteName("");
        }
      },
    });
  }

  async function performUrlScan(): Promise<void> {
    runUrlCleanup(form.getFieldValue("url"));
    const url = form.getFieldValue("url");
    runAutofill();
    runWebsiteLookup(url);
    urlDuplicateCheck.mutate(url, {
      onSuccess: setUrlDuplicate,
    });
    const yt = looksLikeYouTube(url);
    if (autoFetchTitle && !yt) {
      await runFetchTitle(url, {
        force: false,
      });
    }
    await runYouTubeEnrichment(url, {
      fillTitle: autoFetchTitle,
      force: false,
    });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="url">
        {field => (
          <field.TextField
            label="URL"
            type="url"
            onBlur={() => void performUrlScan()}
            action={(
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
            )}
          />
        )}
      </form.AppField>

      <BookmarkUrlCleanupBanner
        urlCleanup={urlCleanup}
        urlShortener={urlShortener}
        onUndo={undoUrlCleanup}
      />

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

      <BookmarkUrlDuplicateWarnings
        urlDuplicate={urlDuplicate}
        currentBookmarkId={bookmark.id}
      />

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

      {websiteLookup.data?.exists === false && websiteLookup.data.domain && (
        <form.Subscribe selector={state => state.values.categoryId}>
          {categoryId => (
            <BookmarkAutofillOffer
              domain={websiteLookup.data?.domain ?? ""}
              categoryId={categoryId}
              categories={categories ?? []}
              dismissed={autofillOfferDismissed}
              onDismiss={() => setAutofillOfferDismissed(true)}
            />
          )}
        </form.Subscribe>
      )}

      <form.AppField name="description">
        {field => <field.TextareaField label="Description" />}
      </form.AppField>

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

      <AddCategoryModal
        open={addCategoryOpen}
        onOpenChange={setAddCategoryOpen}
        onCreated={category => form.setFieldValue("categoryId", category.id)}
      />

      <form.Subscribe selector={state => state.values.categoryId}>
        {categoryId => (
          <form.Field name="tagIds">
            {field => (
              <div className="flex flex-col gap-1">
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

      <form.AppForm>
        <form.SubmitButton
          label="Save changes"
          pendingLabel="Saving…"
          size="sm"
        />
      </form.AppForm>

      {updateBookmark.isError
        ? <p className="text-sm text-destructive">{updateBookmark.error?.message}</p>
        : null}
    </form>
  );
}
