import { useState } from "react";

/** Tracks whether an entity image (favicon, avatar, etc.) failed to load and provides a stable onError handler. */
export function useEntityImage(imageUrl: string | null | undefined) {
  const [imageFailed, setImageFailed] = useState(false);
  return {
    showImage: imageUrl != null && !imageFailed,
    onError: () => setImageFailed(true),
  };
}
