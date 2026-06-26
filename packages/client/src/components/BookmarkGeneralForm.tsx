import type { Bookmark } from "@eesimple/types";

import { Brush } from "lucide-react";

import { AddAuthorModal } from "./AddAuthorModal";
import { AddMediaTypeModal } from "./AddMediaTypeModal";
import { AddTagModal } from "./AddTagModal";
import { BookmarkAdvancedPublisherField } from "./BookmarkAdvancedPublisherField";
import { BookmarkAutofillOffer } from "./BookmarkAutofillOffer";
import { BookmarkCategoryField } from "./BookmarkCategoryField";
import { BookmarkDescriptionField } from "./BookmarkDescriptionField";
import { BookmarkNameField } from "./BookmarkNameField";
import { GatedTagPicker } from "./BookmarkTagsField";
import { BookmarkUrlCleanupBanner } from "./BookmarkUrlCleanupBanner";
import { UrlCleanupPanel } from "./BookmarkUrlCleanupPanel";
import { BookmarkUrlDuplicateWarnings } from "./BookmarkUrlDuplicateWarnings";
import { MultiCombobox } from "./MultiCombobox";
import { useBookmarkGeneralForm } from "./useBookmarkGeneralForm";
import { WebsiteLookupBanner } from "./WebsiteLookupBanner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { mediaTypeTreeComboboxOptions } from "@/lib/comboboxOptions";

interface BookmarkGeneralFormProps {
  bookmark: Bookmark;
}

/** Edit a bookmark's core fields: URL, name, description, category, and tags. */
export function BookmarkGeneralForm({
  bookmark,
}: BookmarkGeneralFormProps) {
  const {
    form,
    websites,
    shortenerIgnoreList,
    customStripParams,
    tagTree,
    categories,
    mediaTypes,
    authors,
    publishers,
    addPublisherOpen,
    setAddPublisherOpen,
    updateBookmark,
    fetchTitle,
    fetchMetadata,
    websiteLookup,
    urlShortener,
    urlCleanup,
    showUrlCleanup,
    setShowUrlCleanup,
    urlCleanupMode,
    setUrlCleanupMode,
    cleanupId,
    channelHintRef,
    youtubeChannel,
    setYoutubeChannel,
    websiteSiteName,
    setWebsiteSiteName,
    isReportingTitle,
    setIsReportingTitle,
    expectedTitle,
    setExpectedTitle,
    titleFetch,
    setTitleFetch,
    urlDuplicate,
    addCategoryOpen,
    setAddCategoryOpen,
    addMediaTypeOpen,
    setAddMediaTypeOpen,
    addTagOpen,
    setAddTagOpen,
    saveTags,
    saveBlacklistedTagIds,
    addAuthorOpen,
    setAddAuthorOpen,
    saveAuthors,
    autofillOfferDismissed,
    setAutofillOfferDismissed,
    touchedRef,
    runAutofill,
    performUrlScan,
    runFetchTitle,
    runFetchDescription,
    runYouTubeEnrichment,
    undoUrlCleanup,
    undoTitleFetch,
  } = useBookmarkGeneralForm(bookmark);

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
              customStripParams={customStripParams ?? []}
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
          <BookmarkNameField
            form={form}
            fetchTitle={fetchTitle}
            fetchMetadata={fetchMetadata}
            titleFetch={titleFetch}
            onTitleEdited={() => setTitleFetch(null)}
            undoTitleFetch={undoTitleFetch}
            runFetchTitle={runFetchTitle}
            runYouTubeEnrichment={runYouTubeEnrichment}
            isReportingTitle={isReportingTitle}
            setIsReportingTitle={setIsReportingTitle}
            expectedTitle={expectedTitle}
            setExpectedTitle={setExpectedTitle}
            onNameBlur={runAutofill}
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

      <BookmarkDescriptionField
        form={form}
        fetchMetadata={fetchMetadata}
        runFetchDescription={runFetchDescription}
      />

      <BookmarkCategoryField
        form={form}
        categories={categories ?? []}
        addCategoryOpen={addCategoryOpen}
        setAddCategoryOpen={setAddCategoryOpen}
      />

      <form.AppField name="mediaTypeId">
        {field => (
          <field.ComboboxField
            label="Media type"
            placeholder="No media type"
            searchPlaceholder="Search media types…"
            emptyText="No media types found."
            createOption={{
              label: "Create media type",
              onSelect: () => setAddMediaTypeOpen(true),
            }}
            options={mediaTypeTreeComboboxOptions(mediaTypes ?? [])}
          />
        )}
      </form.AppField>
      <AddMediaTypeModal
        open={addMediaTypeOpen}
        onOpenChange={setAddMediaTypeOpen}
        onCreated={mediaType => form.setFieldValue("mediaTypeId", mediaType.id)}
      />

      <form.Subscribe selector={state => state.values.categoryId}>
        {categoryId => (
          <>
            <form.Field name="tagIds">
              {field => (
                <GatedTagPicker
                  categoryId={categoryId}
                  tree={tagTree ?? []}
                  selectedIds={field.state.value}
                  onToggle={(id) => {
                    touchedRef.current.add("tags");
                    const current = field.state.value;
                    const newTagIds = current.includes(id)
                      ? current.filter(tagId => tagId !== id)
                      : [...current, id];
                    field.handleChange(newTagIds);
                    saveTags(newTagIds);
                  }}
                  createOption={{
                    label: "Create tag",
                    onSelect: () => setAddTagOpen(true),
                  }}
                />
              )}
            </form.Field>
            <form.Field name="blacklistedTagIds">
              {field => (
                <GatedTagPicker
                  categoryId={categoryId}
                  tree={tagTree ?? []}
                  selectedIds={field.state.value}
                  onToggle={(id) => {
                    const current = field.state.value;
                    const next = current.includes(id)
                      ? current.filter(tagId => tagId !== id)
                      : [...current, id];
                    field.handleChange(next);
                    saveBlacklistedTagIds(next);
                  }}
                  label="Tag blacklist"
                  description="Tags toggled here will never be auto-applied by autofill rules."
                />
              )}
            </form.Field>
          </>
        )}
      </form.Subscribe>
      <AddTagModal
        open={addTagOpen}
        onOpenChange={setAddTagOpen}
        onCreated={(tag) => {
          touchedRef.current.add("tags");
          const current = form.getFieldValue("tagIds");
          if (!current.includes(tag.id)) {
            const newTagIds = [...current, tag.id];
            form.setFieldValue("tagIds", newTagIds);
            saveTags(newTagIds);
          }
        }}
      />

      <form.Field name="authorIds">
        {field => (
          <div className="space-y-1">
            <Label>Authors</Label>
            <MultiCombobox
              options={(authors ?? []).map(a => ({
                value: a.id,
                label: a.name,
              }))}
              values={field.state.value}
              onValuesChange={field.handleChange}
              placeholder="Select authors…"
              searchPlaceholder="Search authors…"
              emptyText="No authors found."
              createOption={{
                label: "Create author",
                onSelect: () => setAddAuthorOpen(true),
              }}
            />
          </div>
        )}
      </form.Field>
      <AddAuthorModal
        open={addAuthorOpen}
        onOpenChange={setAddAuthorOpen}
        onCreated={(author) => {
          const current = form.getFieldValue("authorIds");
          if (!current.includes(author.id)) {
            const newAuthorIds = [...current, author.id];
            form.setFieldValue("authorIds", newAuthorIds);
            saveAuthors(newAuthorIds);
          }
        }}
      />

      <BookmarkAdvancedPublisherField
        form={form}
        publishers={publishers ?? []}
        addPublisherOpen={addPublisherOpen}
        onAddPublisherOpenChange={setAddPublisherOpen}
      />

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
