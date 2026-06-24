import type { BookmarkFormApi, BookmarkInputType } from "./bookmarkFormSchema";
import type { BookmarkFormProps } from "./useBookmarkFormController";
import type { BookmarkUrlDuplicateResult } from "@eesimple/types";

import { useEffect, useRef } from "react";

import { Brush, Loader2 } from "lucide-react";

import { bookmarkInputHint } from "./bookmarkFormSchema";
import { BookmarkRevealedFields } from "./BookmarkRevealedFields";
import { BookmarkUrlResolveFeedback } from "./BookmarkUrlResolveFeedback";
import { useBookmarkFormController } from "./useBookmarkFormController";

import { Button } from "@/components/ui/button";

interface BookmarkFormComponentProps extends BookmarkFormProps {
  /** When true, the form runs the URL scan on mount (e.g. the quick-add popup). Create-mode only. */
  autoScan?: boolean;
}

/**
 * Bookmark form. Creates a new bookmark by default, or edits `bookmark` when given.
 * Owns its own mutation so the page stays focused on the list. All state and handlers live in
 * `useBookmarkFormController`; this component is the JSX wiring.
 */
export function BookmarkForm({
  autoScan, ...props
}: BookmarkFormComponentProps = {}) {
  const c = useBookmarkFormController(props);
  const {
    form,
  } = c;

  // Quick-add popup: reveal + scan the seeded URL once, exactly like clicking "Check URL". The ref
  // guards against re-running (StrictMode double-mount / re-renders). The scan effect lives here
  // rather than in the hook-dense controller to keep its complexity score flat.
  const autoScannedRef = useRef(false);
  useEffect(() => {
    if (autoScan && !c.isEdit && !autoScannedRef.current && form.getFieldValue("url").trim() !== "") {
      autoScannedRef.current = true;
      void c.performUrlScan({
        revealing: true,
      });
    }
  }, [autoScan, c, form]);

  return (
    <form
      className="space-y-4"
      onKeyDown={c.handleUrlKeyDown}
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      {/* Primary input — accepts a URL, an ISBN, or plain text. Full width, always shown. The cleanup
          toggle appears only once the form is revealed. */}
      <form.AppField name="url">
        {field => (
          <field.TextField
            label="URL, ISBN, or text"
            type="text"
            onBlur={c.handleUrlBlur}
            action={c.scanned
              ? (
                <Button
                  type="button"
                  variant={c.showUrlCleanup ? "secondary" : "ghost"}
                  size="icon"
                  title="URL cleanup"
                  aria-label="Toggle URL cleanup"
                  aria-expanded={c.showUrlCleanup}
                  onClick={() => c.setShowUrlCleanup(prev => !prev)}
                >
                  <Brush className="size-4" />
                </Button>
              )
              : undefined}
          />
        )}
      </form.AppField>

      {/* Live "what am I adding?" hint, shown before the form is revealed. */}
      {!c.scanned && (
        <form.Subscribe selector={state => state.values.url}>
          {(url) => {
            const hint = bookmarkInputHint(url);
            return hint
              ? (
                <p className="text-xs text-muted-foreground">
                  Detected:
                  {" "}
                  {hint}
                </p>
              )
              : null;
          }}
        </form.Subscribe>
      )}

      {c.urlResolveError && (
        <BookmarkUrlResolveFeedback error={c.urlResolveError} />
      )}

      {c.scanned && (
        <BookmarkRevealedFields
          form={form}
          hideNameField={c.hideNameField}
          lockedCategoryId={c.lockedCategoryId}
          urlCleanup={c.urlCleanup}
          urlShortener={c.urlShortener}
          onUndoUrlCleanup={c.undoUrlCleanup}
          showUrlCleanup={c.showUrlCleanup}
          cleanupId={c.cleanupId}
          urlCleanupMode={c.urlCleanupMode}
          onUrlCleanupModeChange={c.setUrlCleanupMode}
          websites={c.websites ?? []}
          ignoreList={c.shortenerIgnoreList ?? []}
          websiteLookup={c.websiteLookup}
          youtubeChannel={c.youtubeChannel}
          onChannelSelfIdsChange={c.handleChannelSelfIdsChange}
          websiteSiteName={c.websiteSiteName}
          onSiteNameChange={c.setWebsiteSiteName}
          onSiteNameBlur={() => void c.runFetchTitle(form.getFieldValue("url"), {
            force: true,
          })}
          onTitleBlur={c.prefill.runAutofill}
          onTitleChange={() => c.setTitleFetch(null)}
          onFetchTitleClick={c.handleFetchTitleClick}
          isFetchTitlePending={c.fetchTitle.isPending}
          isFetchMetadataPending={c.fetchMetadata.isPending}
          titleFetch={c.titleFetch}
          onUndoTitleFetch={c.undoTitleFetch}
          fetchTitleIsSuccess={c.fetchTitle.isSuccess}
          fetchTitleIsError={c.fetchTitle.isError}
          fetchTitleErrorMessage={c.fetchTitle.error?.message}
          fetchedTitle={c.fetchTitle.data?.title}
          isReportingTitle={c.isReportingTitle}
          onStartReporting={() => c.setIsReportingTitle(true)}
          expectedTitle={c.expectedTitle}
          onExpectedTitleChange={c.setExpectedTitle}
          onCancelReporting={c.handleCancelReporting}
          tagTree={c.tagTree ?? []}
          customProperties={c.customProperties ?? []}
          mediaTypes={c.mediaTypes ?? []}
          authors={c.authors ?? []}
          onTagToggle={c.prefill.markTagsTouched}
          numberInputs={c.prefill.numberInputs}
          booleanInputs={c.prefill.booleanInputs}
          dateTimeInputs={c.prefill.dateTimeInputs}
          choicesInputs={c.prefill.choicesInputs}
          progressInputs={c.prefill.progressInputs}
          sectionsInputs={c.prefill.sectionsInputs}
          textInputs={c.prefill.textInputs}
          onNumberChange={c.prefill.handleNumberChange}
          onBooleanChange={c.prefill.handleBooleanChange}
          onDateTimeChange={c.prefill.handleDateTimeChange}
          onChoicesChange={c.prefill.handleChoicesChange}
          onProgressChange={c.prefill.handleProgressChange}
          onSectionsChange={c.prefill.handleSectionsChange}
          onTextChange={c.prefill.handleTextChange}
          categories={c.categories ?? []}
          addCategoryOpen={c.addCategoryOpen}
          onAddCategoryOpenChange={c.setAddCategoryOpen}
          addMediaTypeOpen={c.addMediaTypeOpen}
          onAddMediaTypeOpenChange={c.setAddMediaTypeOpen}
          publishers={c.publishers ?? []}
          addPublisherOpen={c.addPublisherOpen}
          onAddPublisherOpenChange={c.setAddPublisherOpen}
          sourceDefaults={c.sourceDefaults}
          imageFieldKey={c.imageFieldKey}
          existingImageUrl={c.bookmark?.image?.url ?? null}
          defaultAuto={!c.isEdit && c.autoFetchImage}
          autoGrabError={c.bookmark?.imageAutoGrabError ?? null}
          onImageIntentChange={(intent) => {
            c.imageIntentRef.current = intent;
          }}
          onApplyCategoryDefaults={c.prefill.applyCategoryDefaults}
          urlDuplicate={c.urlDuplicate}
          autofillOfferDismissed={c.autofillOfferDismissed}
          onAutofillOfferDismiss={() => c.setAutofillOfferDismissed(true)}
          onFetchDescription={url => void c.runFetchDescription(url, {
            force: true,
          })}
          onIsbnFetch={isbn => void c.handleIsbnFetch(isbn)}
          isIsbnFetchPending={c.isbnFetch.isPending}
        />
      )}

      <BookmarkFormFooter
        form={form}
        scanned={c.scanned}
        isEdit={c.isEdit}
        isScanning={c.isScanning}
        inputType={c.inputType}
        urlDuplicate={c.urlDuplicate}
        saveIsPending={c.saveBookmark.isPending}
        saveIsError={c.saveBookmark.isError}
        saveErrorMessage={c.saveBookmark.error?.message}
        onDone={c.onDone}
        onCheckUrl={() => void c.performUrlScan({
          revealing: true,
        })}
        onAddNow={() => void c.handleAddNow()}
        onAddOfflineBookmark={() => void c.handleAddOfflineBookmark()}
        onLookupIsbn={() => void c.handleLookupIsbn()}
        onReset={c.handleReset}
      />
    </form>
  );
}

interface BookmarkFormFooterProps {
  form: BookmarkFormApi;
  scanned: boolean;
  isEdit: boolean;
  isScanning: boolean;
  inputType: BookmarkInputType;
  urlDuplicate: BookmarkUrlDuplicateResult | null;
  saveIsPending: boolean;
  saveIsError: boolean;
  saveErrorMessage?: string;
  onDone?: () => void;
  onCheckUrl: () => void;
  onAddNow: () => void;
  onAddOfflineBookmark: () => void;
  onLookupIsbn: () => void;
  onReset: () => void;
}

/**
 * Action row beneath the form. Pre-scan the primary action depends on what was typed: Check URL / Add
 * Now for a URL, Look up ISBN for an ISBN, Add Offline Bookmark for plain text. Once revealed it's the
 * submit button. Cancel (edit) and Reset (create) sit alongside.
 */
function BookmarkFormFooter({
  form,
  scanned,
  isEdit,
  isScanning,
  inputType,
  urlDuplicate,
  saveIsPending,
  saveIsError,
  saveErrorMessage,
  onDone,
  onCheckUrl,
  onAddNow,
  onAddOfflineBookmark,
  onLookupIsbn,
  onReset,
}: BookmarkFormFooterProps) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {scanned
          ? (
            <form.AppForm>
              <form.SubmitButton
                label={isEdit ? "Save changes" : "Add Bookmark"}
                pendingLabel="Saving…"
                disabledWhen={!isEdit && Boolean(urlDuplicate?.exactMatch)}
              />
            </form.AppForm>
          )
          : (
            <PrescanActions
              inputType={inputType}
              isScanning={isScanning}
              saveIsPending={saveIsPending}
              onCheckUrl={onCheckUrl}
              onAddNow={onAddNow}
              onAddOfflineBookmark={onAddOfflineBookmark}
              onLookupIsbn={onLookupIsbn}
            />
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
        {!isEdit
          ? (
            <Button
              type="button"
              variant="ghost"
              className="ml-auto"
              onClick={onReset}
            >
              Reset Form
            </Button>
          )
          : null}
      </div>
      {saveIsError ? <p className="mt-2 text-sm text-destructive">{saveErrorMessage}</p> : null}
    </div>
  );
}

interface PrescanActionsProps {
  inputType: BookmarkInputType;
  isScanning: boolean;
  saveIsPending: boolean;
  onCheckUrl: () => void;
  onAddNow: () => void;
  onAddOfflineBookmark: () => void;
  onLookupIsbn: () => void;
}

/** The pre-scan primary action(s), chosen by what the user typed into the primary input. */
function PrescanActions({
  inputType,
  isScanning,
  saveIsPending,
  onCheckUrl,
  onAddNow,
  onAddOfflineBookmark,
  onLookupIsbn,
}: PrescanActionsProps) {
  if (inputType === "text") {
    return (
      <Button
        type="button"
        onClick={onAddOfflineBookmark}
      >
        Add Offline Bookmark
      </Button>
    );
  }
  if (inputType === "isbn") {
    return (
      <Button
        type="button"
        onClick={onLookupIsbn}
      >
        Look up ISBN
      </Button>
    );
  }
  return (
    <>
      <Button
        type="button"
        disabled={isScanning}
        onClick={onCheckUrl}
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
        disabled={isScanning || saveIsPending}
        onClick={onAddNow}
      >
        Add Now
      </Button>
    </>
  );
}
