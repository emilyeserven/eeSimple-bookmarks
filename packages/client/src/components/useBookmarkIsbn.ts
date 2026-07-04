import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { useBookmarkFormActions } from "./useBookmarkFormActions";
import type { useBookmarkPrimaryLanguage } from "./useBookmarkPrimaryLanguage";
import type { CustomProperty, ImageCandidate, Language, MediaType, Person, Group } from "@eesimple/types";

import { ISBN_SLUG, normalizeIsbn } from "./bookmarkFormSchema";
import { useAppLocale } from "../hooks/useAppLocale";
import { useFetchIsbnMetadata } from "../hooks/useFetchIsbnMetadata";
import { ApiError, describeError } from "../lib/apiError";
import { languageDisplayName } from "../lib/languageDisplay";
import { notifyError } from "../lib/notifications";
import { isFetchableUrl } from "../lib/url";

type Actions = ReturnType<typeof useBookmarkFormActions>;

interface UseBookmarkIsbnParams {
  form: BookmarkFormApi;
  customProperties: CustomProperty[] | undefined;
  mediaTypes: MediaType[] | undefined;
  people: Person[] | undefined;
  groups: Group[] | undefined;
  languages: Language[] | undefined;
  createPerson: Actions["createPerson"];
  createGroup: Actions["createGroup"];
  createLanguage: Actions["createLanguage"];
  handleTextChange: (id: string, value: string) => void;
  setHideNameField: (value: boolean) => void;
  setScanned: (value: boolean) => void;
  setImageCandidates: (candidates: ImageCandidate[]) => void;
  /** Attach a detected primary language as a "Primary Language" usage row (see the hook's docs). */
  primaryLanguage: ReturnType<typeof useBookmarkPrimaryLanguage>;
}

/**
 * ISBN lookup sub-hook for the bookmark form. Owns the `useFetchIsbnMetadata` mutation and
 * exposes `handleIsbnFetch` (fetch metadata and populate the form) plus `handleLookupIsbn`
 * (the ISBN-entry-path orchestrator). Extracted from `useBookmarkFormController` so that
 * function's hook count stays within the fallow cap.
 */
export function useBookmarkIsbn({
  form,
  customProperties,
  mediaTypes,
  people,
  groups,
  languages,
  createPerson,
  createGroup,
  createLanguage,
  handleTextChange,
  setHideNameField,
  setScanned,
  setImageCandidates,
  primaryLanguage,
}: UseBookmarkIsbnParams) {
  const isbnFetch = useFetchIsbnMetadata();
  const locale = useAppLocale();

  async function handleIsbnFetch(isbn: string): Promise<void> {
    let result;
    try {
      result = await isbnFetch.mutateAsync({
        isbn,
      });
    }
    catch (err) {
      const message = describeError(err, "Could not fetch book metadata");
      // The ISBN 404/502 carries a `detail` clause explaining what the Kavita fallback found (or
      // why it couldn't run) — surface it so a miss is debuggable without opening devtools.
      const detail = err instanceof ApiError && err.detail ? ` ${err.detail}` : "";
      notifyError(`${message}${detail}`);
      return;
    }
    if (result.title && !form.getFieldValue("title").trim()) {
      form.setFieldValue("title", result.title);
    }
    if (result.description && !form.getFieldValue("description").trim()) {
      form.setFieldValue("description", result.description);
    }
    if (result.authors.length > 0 && (form.getFieldValue("personIds") as string[]).length === 0) {
      await resolvePeople(
        result.authors,
        people ?? [],
        createPerson,
        ids => form.setFieldValue("personIds", ids),
      );
    }
    if (result.group && !form.getFieldValue("groupId")) {
      await resolveGroup(
        result.group,
        groups ?? [],
        createGroup,
        id => form.setFieldValue("groupId", id),
      );
    }
    if (result.language && !primaryLanguage.hasPrimaryLanguageUsage()) {
      await resolveLanguage(
        result.language,
        languages ?? [],
        createLanguage,
        id => primaryLanguage.attachPrimaryLanguageUsage(id),
        locale,
      );
    }
    // Feed the cover into the same image-candidate picker the URL scan uses, so the existing
    // auto-keep-first-candidate behavior picks it up as the main image on save. A Kavita-sourced
    // cover is a middleware-relative proxy path (not a fetchable absolute URL) and is excluded —
    // it isn't downloadable until the bookmark exists and can be imported via the ISBN cover button.
    if (result.coverUrl && isFetchableUrl(result.coverUrl)) {
      setImageCandidates([{
        url: result.coverUrl,
        width: null,
        height: null,
        source: "og",
      }]);
    }
  }

  // ISBN entry path: the primary input is an ISBN, not a URL. Clear the URL, store the ISBN on its
  // built-in property so it persists, default the media type to Book, reveal the form, and fetch the
  // book's metadata. Mirrors handleAddOfflineBookmark, but the Name field stays visible.
  async function handleLookupIsbn(): Promise<void> {
    const isbn = normalizeIsbn(form.getFieldValue("url"));
    if (!isbn) return;
    form.setFieldValue("url", "");
    const isbnProp = (customProperties ?? []).find(p => p.slug === ISBN_SLUG);
    if (isbnProp) handleTextChange(isbnProp.id, isbn);
    const bookMediaType = mediaTypes?.find(mt => mt.name === "Book");
    if (bookMediaType) form.setFieldValue("mediaTypeId", bookMediaType.id);
    setHideNameField(false);
    setScanned(true);
    await handleIsbnFetch(isbn);
  }

  return {
    isbnFetch,
    handleIsbnFetch,
    handleLookupIsbn,
  };
}

// ---------------------------------------------------------------------------
// Module-level pure helpers (scored independently by fallow, not rolled into
// the hook above — keeping the hook's own cognitive budget low).
// ---------------------------------------------------------------------------

/** Match-or-create people by name and call setIds with the resolved ids. */
async function resolvePeople(
  names: string[],
  existingPeople: Person[],
  createPerson: Actions["createPerson"],
  setIds: (ids: string[]) => void,
): Promise<void> {
  const ids: string[] = [];
  for (const name of names) {
    const lower = name.toLowerCase();
    const match = existingPeople.find(a => a.name.toLowerCase() === lower);
    if (match) {
      ids.push(match.id);
    }
    else {
      try {
        const created = await createPerson.mutateAsync({
          name,
        });
        ids.push(created.id);
      }
      catch {
        // Skip people that can't be created (e.g. duplicate race).
      }
    }
  }
  if (ids.length > 0) setIds(ids);
}

/** Match-or-create a group by name and call setId with the resolved id. */
async function resolveGroup(
  groupName: string,
  existingGroups: Group[],
  createGroup: Actions["createGroup"],
  setId: (id: string) => void,
): Promise<void> {
  const lower = groupName.toLowerCase();
  const match = existingGroups.find(p => p.name.toLowerCase() === lower);
  if (match) {
    setId(match.id);
    return;
  }
  try {
    const created = await createGroup.mutateAsync({
      name: groupName,
    });
    setId(created.id);
  }
  catch {
    // Skip group that can't be created (e.g. duplicate race).
  }
}

/** Match-or-create a language by its detected ISO code and call setId with the resolved id. */
async function resolveLanguage(
  isoCode: string,
  existingLanguages: Language[],
  createLanguage: Actions["createLanguage"],
  setId: (id: string) => void,
  locale: string,
): Promise<void> {
  const match = existingLanguages.find(l => l.isoCode === isoCode);
  if (match) {
    setId(match.id);
    return;
  }
  try {
    const created = await createLanguage.mutateAsync({
      name: languageDisplayName(isoCode, locale),
      isoCode,
    });
    setId(created.id);
  }
  catch {
    // Skip a language that can't be created (e.g. duplicate race).
  }
}
