import type { BookmarkFormApi } from "./bookmarkFormSchema";
import type { ImageIntent } from "./bookmarkImageIntent";
import type { BookmarkImage, ImageCandidate } from "@eesimple/types";

import { BookmarkImagePicker } from "./BookmarkImagePicker";

interface BookmarkImageFieldProps {
  form: BookmarkFormApi;
  /** Remount key for the image field so a form reset clears it. */
  imageFieldKey: number;
  existingImages: BookmarkImage[];
  imageCandidates: ImageCandidate[];
  defaultAuto: boolean;
  autoGrabError: string | null;
  onImageIntentChange: (intent: ImageIntent) => void;
}

/**
 * The bookmark image picker, subscribed to the live URL. Extracted from the Advanced section so it
 * can be placed independently via the standard-field zone.
 */
export function BookmarkImageField({
  form, imageFieldKey, existingImages, imageCandidates, defaultAuto, autoGrabError, onImageIntentChange,
}: BookmarkImageFieldProps) {
  return (
    <form.Subscribe selector={state => state.values.url}>
      {url => (
        <BookmarkImagePicker
          key={imageFieldKey}
          existingImages={existingImages}
          candidates={imageCandidates}
          pageUrl={url}
          defaultAuto={defaultAuto}
          autoGrabError={autoGrabError}
          onChange={onImageIntentChange}
        />
      )}
    </form.Subscribe>
  );
}
