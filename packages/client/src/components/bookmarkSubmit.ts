import type { ImageIntent } from "./bookmarkImageIntent";
import type { useBookmarkFormActions } from "./useBookmarkFormActions";

type Actions = ReturnType<typeof useBookmarkFormActions>;

/** The image mutations `applyImageIntent` drives (multi-image: add / keep-candidates / set-main / delete). */
interface ImageMutations {
  autoImage: Actions["autoImage"];
  addImage: Actions["addImage"];
  imagesFromCandidates: Actions["imagesFromCandidates"];
  setMainImage: Actions["setMainImage"];
  deleteImageById: Actions["deleteImageById"];
}

/**
 * Apply the pending image intent to a saved bookmark. Non-fatal: the bookmark is already saved, so
 * an image failure just surfaces a toast (from the mutation hooks) without blocking the form.
 * Extracted from the form so the create/edit save path stays a thin orchestration and the
 * delete/upload/keep-candidates/set-main branches are independently testable.
 *
 * Order: remove first, then add uploads (marking the chosen upload main inline), then capture kept
 * candidates (passing the chosen candidate as main), then resolve an existing-image main selection,
 * and finally the back-compat auto-fetch fallback when nothing was explicitly chosen.
 */
export async function applyImageIntent(
  bookmarkId: string,
  sourceUrl: string,
  intent: ImageIntent,
  {
    autoImage, addImage, imagesFromCandidates, setMainImage, deleteImageById,
  }: ImageMutations,
): Promise<void> {
  const {
    uploads, keepCandidateUrls, mainSelection, removeImageIds, auto,
  } = intent;
  try {
    for (const imageId of removeImageIds) {
      await deleteImageById.mutateAsync({
        id: bookmarkId,
        imageId,
      });
    }

    for (let index = 0; index < uploads.length; index++) {
      const isMain = mainSelection?.kind === "upload" && mainSelection.index === index;
      await addImage.mutateAsync({
        id: bookmarkId,
        file: uploads[index],
        main: isMain,
      });
    }

    if (keepCandidateUrls.length > 0) {
      await imagesFromCandidates.mutateAsync({
        id: bookmarkId,
        urls: keepCandidateUrls,
        mainUrl: mainSelection?.kind === "candidate" ? mainSelection.url : null,
      });
    }

    if (mainSelection?.kind === "existing") {
      await setMainImage.mutateAsync({
        id: bookmarkId,
        imageId: mainSelection.id,
      });
    }

    // Back-compat: nothing explicitly chosen but auto-fetch is on → grab the page's image.
    if (uploads.length === 0 && keepCandidateUrls.length === 0 && auto) {
      await autoImage.mutateAsync({
        id: bookmarkId,
        sourceUrl,
      });
    }
  }
  catch {
    // Surfaced via the mutation hooks' onError toast; nothing else to do here.
  }
}

/** The "set as default" checkbox flags for a new bookmark's website / channel (create-only). */
export interface SourceDefaultFlags {
  setWebsiteCategory: boolean;
  setWebsiteTags: boolean;
  setWebsiteMediaType: boolean;
  setChannelCategory: boolean;
  setChannelTags: boolean;
  setChannelMediaType: boolean;
}

/** The website / YouTube-channel default-update mutations `promoteSourceDefaults` drives. */
interface SourceMutations {
  updateWebsite: Actions["updateWebsite"];
  updateYouTubeChannel: Actions["updateYouTubeChannel"];
}

/**
 * Promote the saved bookmark's category/media-type/tags to its website's and channel's defaults,
 * for each "set as default" checkbox the user opted into. Extracted from the form so the create
 * save path stays thin and the per-flag promotion is independently testable.
 */
export function promoteSourceDefaults(
  created: Awaited<ReturnType<Actions["createBookmark"]["mutateAsync"]>>,
  categoryId: string,
  mediaTypeId: string,
  tagIds: string[],
  flags: SourceDefaultFlags,
  {
    updateWebsite, updateYouTubeChannel,
  }: SourceMutations,
): void {
  if (
    (flags.setWebsiteCategory || flags.setWebsiteTags || flags.setWebsiteMediaType)
    && created.website?.id
  ) {
    updateWebsite.mutate({
      id: created.website.id,
      input: {
        ...(flags.setWebsiteCategory && {
          categoryId: categoryId || null,
        }),
        ...(flags.setWebsiteMediaType && {
          mediaTypeId: mediaTypeId || null,
        }),
        ...(flags.setWebsiteTags && {
          tagIds,
        }),
      },
    });
  }
  if (
    (flags.setChannelCategory || flags.setChannelTags || flags.setChannelMediaType)
    && created.youtubeChannel?.id
  ) {
    updateYouTubeChannel.mutate({
      id: created.youtubeChannel.id,
      input: {
        ...(flags.setChannelCategory && {
          categoryId: categoryId || null,
        }),
        ...(flags.setChannelMediaType && {
          mediaTypeId: mediaTypeId || null,
        }),
        ...(flags.setChannelTags && {
          tagIds,
        }),
      },
    });
  }
}
