import {
  useAddBookmarkImage,
  useAutoBookmarkImage,
  useBookmarkImagesFromCandidates,
  useDeleteBookmarkImageById,
  useDeleteBookmarkScreenshot,
  useIsbnCoverImage,
  useKavitaCoverImage,
  usePlexPosterImage,
  useSetMainBookmarkImage,
  useTakeBookmarkScreenshot,
  useUpdateBookmark,
} from "../hooks/useBookmarks";

/**
 * Bundle every image/screenshot mutation the image-edit tab uses, with the aggregate
 * any-in-flight / first-error views the form's controls render from.
 */
export function useBookmarkImageMutations() {
  const autoImage = useAutoBookmarkImage();
  const kavitaCover = useKavitaCoverImage();
  const plexPoster = usePlexPosterImage();
  const isbnCover = useIsbnCoverImage();
  const addImage = useAddBookmarkImage();
  const imagesFromCandidates = useBookmarkImagesFromCandidates();
  const setMainImage = useSetMainBookmarkImage();
  const deleteImageById = useDeleteBookmarkImageById();
  const takeScreenshot = useTakeBookmarkScreenshot();
  const deleteScreenshot = useDeleteBookmarkScreenshot();
  const updateDisplayPreference = useUpdateBookmark();

  const isMutating = addImage.isPending || autoImage.isPending || kavitaCover.isPending
    || plexPoster.isPending
    || isbnCover.isPending
    || imagesFromCandidates.isPending
    || setMainImage.isPending || deleteImageById.isPending || takeScreenshot.isPending
    || deleteScreenshot.isPending || updateDisplayPreference.isPending;
  const mutationError = addImage.error ?? imagesFromCandidates.error ?? setMainImage.error
    ?? deleteImageById.error ?? autoImage.error ?? kavitaCover.error ?? plexPoster.error
    ?? isbnCover.error ?? updateDisplayPreference.error;

  return {
    autoImage,
    kavitaCover,
    plexPoster,
    isbnCover,
    addImage,
    imagesFromCandidates,
    setMainImage,
    deleteImageById,
    takeScreenshot,
    deleteScreenshot,
    updateDisplayPreference,
    isMutating,
    mutationError,
  };
}
