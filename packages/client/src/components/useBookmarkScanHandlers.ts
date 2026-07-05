import type { useBookmarkFormActions } from "./useBookmarkFormActions";
import type { useBookmarkUrlProcessing } from "./useBookmarkUrlProcessing";
import type { BookmarkAddFormStandardField, FetchMetadataResult, Language, Person, SocialAccountRef, YouTubeChannelHint } from "@eesimple/types";
import type { Dispatch, RefObject, SetStateAction } from "react";

import { sameSocialAccount, socialAccountFromLink } from "@eesimple/types";

import { looksLikeYouTube, stripSelfId } from "./bookmarkFormSchema";
import { useAppLocale } from "../hooks/useAppLocale";
import { languageDisplayName } from "../lib/languageDisplay";

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
  /** Loaded person list — when provided, enables `runFetchPeople`. */
  people?: Person[];
  /** Read the current person IDs from the form — when provided, enables `runFetchPeople`. */
  getPersonIds?: () => string[];
  /** Write person IDs back to the form after detection — when provided, enables `runFetchPeople`. */
  setPersonIds?: (ids: string[]) => void;
  /** Create-person mutation — when provided, enables creating new people discovered in metadata. */
  createPerson?: Actions["createPerson"];
  /** Update-person mutation — used to attach a social link when creating an person from a social account. */
  updatePerson?: Actions["updatePerson"];
  /** Auto-avatar mutation — used to pull the new person's avatar from the social account (best-effort). */
  autoPersonImage?: Actions["autoPersonImage"];
  /** Surface a "create person from this social account" offer — when provided, enables the social-match flow. */
  setSocialAccountOffer?: Dispatch<SetStateAction<SocialAccountRef | null>>;
  /** Loaded language list — when provided (with the fields below), enables language auto-detect. */
  languages?: Language[];
  /**
   * Id of the availability-kind usage level named "Primary Language" — when provided (with the
   * fields below), enables language auto-detect. Undefined when no such level exists yet (the user
   * hasn't created one), in which case auto-detect no-ops.
   */
  primaryLanguageLevelId?: string;
  /** Whether the owner already carries a usage row at `primaryLanguageLevelId` — guards against clobbering a manual pick. */
  hasPrimaryLanguageUsage?: () => boolean;
  /** Attach the detected language at `primaryLanguageLevelId`. */
  attachPrimaryLanguageUsage?: (languageId: string) => void;
  /** Create-language mutation — when provided, enables creating a new language for an unmatched code. */
  createLanguage?: Actions["createLanguage"];
  /**
   * Stage the site's detected language code for the create payload (#985) — labels the primary
   * `entity_names` row server-side. Called independently of the "Primary Language" usage-level flow
   * above, so it fires even when no such level exists. Omitted on edit surfaces.
   */
  stageDetectedSiteLanguageCode?: (code: string | null) => void;
  /**
   * Record a standard field the scan just filled (create-only): title, description (both the
   * `descriptionTags` field), or people (`personIds`). Lets the "reveal auto-filled in main" setting
   * lift them into the main area. Omitted on edit surfaces, so edit is unaffected.
   */
  markAutofilledField?: (field: BookmarkAddFormStandardField) => void;
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
  people,
  getPersonIds,
  setPersonIds,
  createPerson,
  updatePerson,
  autoPersonImage,
  setSocialAccountOffer,
  languages,
  primaryLanguageLevelId,
  hasPrimaryLanguageUsage,
  attachPrimaryLanguageUsage,
  createLanguage,
  stageDetectedSiteLanguageCode,
  markAutofilledField,
}: UseBookmarkScanHandlersParams) {
  const locale = useAppLocale();
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

  // Set the Name from a (clean) YouTube title, the Description from the watch-page og:description,
  // and the resolved channel hint — from already-fetched metadata. Pure apply (no network), so the
  // same logic backs both the granular `runYouTubeEnrichment` and the consolidated scan. Assumes
  // `meta.isYouTube`. `fillTitle` mirrors the autoFetchTitle gate; `force` overwrites an existing title.
  function applyYouTubeMeta(meta: FetchMetadataResult, {
    fillTitle, force,
  }: { fillTitle: boolean;
    force: boolean; }): void {
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
      markAutofilledField?.("title");
      if (force && prevTitle.trim() !== "") setTitleFetch({
        previous: prevTitle,
      });
      else setTitleFetch(null);
    }
    // Fill the Description from the watch-page og:description when the field is still empty.
    if (fillTitle && meta.description && form.getFieldValue("description").trim() === "") {
      form.setFieldValue("description", meta.description);
      markAutofilledField?.("descriptionTags");
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
      applyYouTubeMeta(meta, {
        fillTitle,
        force,
      });
      await applyLanguageFromCode(meta.languageCode);
    }
    catch {
      // Non-fatal: enrichment is a best-effort convenience layered on the title fetch.
    }
  }

  // Fetch the page description for the current URL and write it into the Description field.
  // Works for both YouTube (uses the same fetch-metadata result) and regular websites (og:description).
  // `force` always overwrites; the on-blur path would only fill a blank field.
  async function runFetchDescription(url: string, {
    force,
  }: { force: boolean }): Promise<void> {
    if (!isUrlFetchable(url)) return;
    if (!force && form.getFieldValue("description").trim() !== "") return;
    try {
      const meta = await fetchMetadata.mutateAsync({
        url,
      });
      if (!meta.description) return;
      const prev = form.getFieldValue("description");
      if (force || prev.trim() === "") {
        form.setFieldValue("description", meta.description);
      }
    }
    catch {
      // Non-fatal: best-effort convenience.
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

  // Resolve detected person names to IDs and write them into the form: existing people are matched
  // case-insensitively; unknown names are created. Pure apply (other than the create-person network
  // call), shared by `runFetchPeople` and the consolidated scan. No-ops unless the person params are
  // provided (create form only), no people are selected yet, and the URL isn't a YouTube video.
  async function applyPeopleFromNames(url: string, names: string[] | null): Promise<void> {
    if (!setPersonIds || !getPersonIds || looksLikeYouTube(url)) return;
    if (!names || names.length === 0) return;
    if ((getPersonIds()).length > 0) return;
    const existingPeople = people ?? [];
    const ids: string[] = [];
    for (const name of names) {
      const normalName = name.toLowerCase();
      const match = existingPeople.find(a => a.name.toLowerCase() === normalName);
      if (match) {
        ids.push(match.id);
      }
      else if (createPerson) {
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
    if (ids.length > 0) {
      setPersonIds(ids);
      markAutofilledField?.("personIds");
    }
  }

  // Resolve a detected ISO language code to a Language id and attach it as a "Primary Language"
  // availability usage row: an existing language is matched by its `isoCode`; an unmatched code
  // creates a new (non-built-in) language named via `languageDisplayName`. Pure apply (other than the
  // create-language network call), shared by `runYouTubeEnrichment` and the consolidated scan. No-ops
  // unless the language params are provided, the "Primary Language" level exists, and the owner has no
  // primary-language usage yet (never clobbers a user pick).
  async function applyLanguageFromCode(code: string | null): Promise<void> {
    // Stage the detected code for the create payload first — the primary entity_names label (#985)
    // is independent of the "Primary Language" usage level, so it must not be gated on the checks below.
    if (code) stageDetectedSiteLanguageCode?.(code);
    if (!attachPrimaryLanguageUsage || !primaryLanguageLevelId || !code) return;
    if (hasPrimaryLanguageUsage?.()) return;
    const match = (languages ?? []).find(l => l.isoCode === code);
    if (match) {
      attachPrimaryLanguageUsage(match.id);
      return;
    }
    if (!createLanguage) return;
    try {
      const created = await createLanguage.mutateAsync({
        name: languageDisplayName(code, locale),
        isoCode: code,
      });
      attachPrimaryLanguageUsage(created.id);
    }
    catch {
      // Skip a language that can't be created (e.g. duplicate race).
    }
  }

  /** Find an existing person whose social links already include `acct` (same platform + handle). */
  function findPersonBySocialAccount(acct: SocialAccountRef): Person | undefined {
    return (people ?? []).find(person =>
      person.socialLinks.some((link) => {
        const ref = socialAccountFromLink(link);
        return ref !== null && sameSocialAccount(ref, acct);
      }));
  }

  // When the scanned URL is a social account, either select the person who already lists it, or
  // surface an offer to create a new person from it. Create-form only (gated on the person params);
  // runs after name-based resolution and only fills people when none are selected yet, so it never
  // clobbers a name-detected person.
  function applyScanSocialAccount(acct: SocialAccountRef | null): void {
    if (!acct || !setPersonIds || !getPersonIds) return;
    const match = findPersonBySocialAccount(acct);
    if (match) {
      if ((getPersonIds()).length === 0) setPersonIds([match.id]);
      setSocialAccountOffer?.(null);
      return;
    }
    setSocialAccountOffer?.(acct);
  }

  // Edit-mode reconciliation for a scanned social account: unlike `applyScanSocialAccount` (which
  // only fills people when none are selected and otherwise offers to create one), an existing
  // bookmark may already have an person assigned. If an person already lists this social account,
  // attach them to the bookmark (without displacing any other already-assigned person); otherwise,
  // if the bookmark already has an person, record the link on that person instead of reassigning.
  // Falls back to the create-style offer only when neither case applies.
  async function reconcileSocialAccountOnEdit(
    acct: SocialAccountRef | null,
    currentPersonIds: string[],
  ): Promise<void> {
    if (!acct || !setPersonIds) return;
    const match = findPersonBySocialAccount(acct);
    if (match) {
      if (!currentPersonIds.includes(match.id)) {
        setPersonIds([...currentPersonIds, match.id]);
      }
      setSocialAccountOffer?.(null);
      return;
    }
    if (currentPersonIds.length > 0) {
      const existingPerson = (people ?? []).find(a => a.id === currentPersonIds[0]);
      if (!existingPerson) return;
      const alreadyLinked = existingPerson.socialLinks.some((link) => {
        const ref = socialAccountFromLink(link);
        return ref !== null && sameSocialAccount(ref, acct);
      });
      if (alreadyLinked) return;
      try {
        await updatePerson?.mutateAsync({
          id: existingPerson.id,
          input: {
            socialLinks: [...existingPerson.socialLinks, {
              platform: acct.platform,
              url: acct.profileUrl,
            }],
          },
        });
      }
      catch {
        // Non-fatal: the bookmark/person relationship is unaffected; the link can be added manually.
      }
      return;
    }
    setSocialAccountOffer?.(acct);
  }

  // Create a new person from a detected social account: name = handle, attach the social link, pull
  // the avatar best-effort (non-blocking), then select the person and clear the offer. Invoked by the
  // offer banner's "Create person" button.
  async function createPersonFromSocialAccount(acct: SocialAccountRef): Promise<void> {
    if (!createPerson || !setPersonIds || !getPersonIds) return;
    let created;
    try {
      created = await createPerson.mutateAsync({
        name: acct.handle,
      });
    }
    catch {
      return; // e.g. a name clash — leave the offer up so the user can resolve it.
    }
    try {
      await updatePerson?.mutateAsync({
        id: created.id,
        input: {
          socialLinks: [{
            platform: acct.platform,
            url: acct.profileUrl,
          }],
        },
      });
    }
    catch {
      // Non-fatal: the person exists; the link can be added manually.
    }
    // Best-effort avatar pull — don't block selecting the person on the image fetch.
    autoPersonImage?.mutate({
      id: created.id,
      source: "social",
      platform: acct.platform,
      sourceUrl: acct.profileUrl,
    });
    setPersonIds([...getPersonIds(), created.id]);
    setSocialAccountOffer?.(null);
  }

  // For a non-YouTube URL, pull person names from page metadata and resolve them to person IDs.
  // Only runs when no people have been selected yet, and only when the person params are provided.
  async function runFetchPeople(url: string): Promise<void> {
    if (!setPersonIds || !getPersonIds || !isUrlFetchable(url) || looksLikeYouTube(url)) return;
    if ((getPersonIds()).length > 0) return;
    try {
      const meta = await fetchMetadata.mutateAsync({
        url,
      });
      await applyPeopleFromNames(url, meta.authorNames);
    }
    catch {
      // Non-fatal: best-effort convenience layered on the metadata fetch.
    }
  }

  // Apply a consolidated scan's metadata to the form without any further network round-trips: the
  // same title/description/person/channel writes the granular handlers do, fed from one `/api/scan`
  // result. YouTube videos route through `applyYouTubeMeta`; everything else fills the strict title,
  // description, and detected people (and clears any stale channel hint from a prior YouTube URL).
  async function applyScanMetadata(url: string, meta: FetchMetadataResult & {
    socialAccount?: SocialAccountRef | null;
  }, {
    fillTitle, force,
  }: { fillTitle: boolean;
    force: boolean; }): Promise<void> {
    if (meta.isYouTube) {
      applyYouTubeMeta(meta, {
        fillTitle,
        force,
      });
      await applyLanguageFromCode(meta.languageCode);
      return;
    }
    // Non-YouTube: drop any channel hint left over from a previously-entered YouTube link.
    channelHintRef.current = null;
    setYoutubeChannel(null);
    if (fillTitle && meta.title && (force || form.getFieldValue("title").trim() === "")) {
      const prevTitle = form.getFieldValue("title");
      form.setFieldValue("title", meta.title);
      markAutofilledField?.("title");
      if (force && prevTitle.trim() !== "") setTitleFetch({
        previous: prevTitle,
      });
      else setTitleFetch(null);
    }
    if (fillTitle && meta.description && form.getFieldValue("description").trim() === "") {
      form.setFieldValue("description", meta.description);
      markAutofilledField?.("descriptionTags");
    }
    await applyPeopleFromNames(url, meta.authorNames);
    await applyLanguageFromCode(meta.languageCode);
    // Social-account match/offer runs after name resolution; it only fills when still empty.
    applyScanSocialAccount(meta.socialAccount ?? null);
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
    runFetchDescription,
    runFetchPeople,
    runYouTubeEnrichment,
    applyScanMetadata,
    createPersonFromSocialAccount,
    reconcileSocialAccountOnEdit,
    runUrlCleanup,
    undoUrlCleanup,
    undoTitleFetch,
    runWebsiteLookup,
  };
}
