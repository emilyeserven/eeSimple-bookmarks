import type { ImageIntent } from "./bookmarkImageIntent";
import type { useBookmarkFormActions } from "./useBookmarkFormActions";

type Actions = ReturnType<typeof useBookmarkFormActions>;

/** The three image mutations `applyImageIntent` drives. */
interface ImageMutations {
  uploadImage: Actions["uploadImage"];
  autoImage: Actions["autoImage"];
  deleteImage: Actions["deleteImage"];
}

/**
 * Apply the pending image intent to a saved bookmark. Non-fatal: the bookmark is already saved, so
 * an image failure just surfaces a toast (from the mutation hooks) without blocking the form.
 * Extracted from the form so the create/edit save path stays a thin orchestration and the
 * file/auto/remove branch is independently testable.
 */
export async function applyImageIntent(
  bookmarkId: string,
  sourceUrl: string,
  intent: ImageIntent,
  {
    uploadImage, autoImage, deleteImage,
  }: ImageMutations,
): Promise<void> {
  try {
    if (intent.file) {
      await uploadImage.mutateAsync({
        id: bookmarkId,
        file: intent.file,
      });
    }
    else if (intent.auto) {
      await autoImage.mutateAsync({
        id: bookmarkId,
        sourceUrl,
      });
    }
    else if (intent.remove) {
      await deleteImage.mutateAsync(bookmarkId);
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
