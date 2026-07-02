import {
  useAddBookmarkImage,
  useAutoBookmarkImage,
  useBookmarkImagesFromCandidates,
  useDeleteBookmarkImageById,
  useDeleteBookmarkScreenshot,
  useIsbnCoverImage,
  useKavitaCoverImage,
  useSetMainBookmarkImage,
  useTakeBookmarkScreenshot,
} from "../hooks/useBookmarks";

/**
 * Bundle every image/screenshot mutation the image-edit tab uses, with the aggregate
 * any-in-flight / first-error views the form's controls render from.
 */
export function useBookmarkImageMutations() {
  const autoImage = useAutoBookmarkImage();
  const kavitaCover = useKavitaCoverImage();
  const isbnCover = useIsbnCoverImage();
  const addImage = useAddBookmarkImage();
  const imagesFromCandidates = useBookmarkImagesFromCandidates();
  const setMainImage = useSetMainBookmarkImage();
  const deleteImageById = useDeleteBookmarkImageById();
  const takeScreenshot = useTakeBookmarkScreenshot();
  const deleteScreenshot = useDeleteBookmarkScreenshot();

  const isMutating = addImage.isPending || autoImage.isPending || kavitaCover.isPending
    || isbnCover.isPending
    || imagesFromCandidates.isPending
    || setMainImage.isPending || deleteImageById.isPending || takeScreenshot.isPending
    || deleteScreenshot.isPending;
  const mutationError = addImage.error ?? imagesFromCandidates.error ?? setMainImage.error
    ?? deleteImageById.error ?? autoImage.error ?? kavitaCover.error ?? isbnCover.error;

  return {
    autoImage,
    kavitaCover,
    isbnCover,
    addImage,
    imagesFromCandidates,
    setMainImage,
    deleteImageById,
    takeScreenshot,
    deleteScreenshot,
    isMutating,
    mutationError,
  };
}
