import type { ImageIntent } from "./bookmarkImageIntent";
import type { Bookmark } from "@eesimple/types";

import { useRef, useState } from "react";

import { BookmarkImageField } from "./BookmarkImageField";
import { EMPTY_IMAGE_INTENT } from "./bookmarkImageIntent";
import {
  useAutoBookmarkImage,
  useDeleteBookmarkImage,
  useUploadBookmarkImage,
} from "../hooks/useBookmarks";
import { notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";

interface BookmarkImageEditFormProps {
  bookmark: Bookmark;
}

/** Manage the image for an existing bookmark. */
export function BookmarkImageEditForm({
  bookmark,
}: BookmarkImageEditFormProps) {
  const uploadImage = useUploadBookmarkImage();
  const autoImage = useAutoBookmarkImage();
  const deleteImage = useDeleteBookmarkImage();

  const imageIntentRef = useRef<ImageIntent>(EMPTY_IMAGE_INTENT);
  const [imageFieldKey, setImageFieldKey] = useState(0);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setIsPending(true);
    try {
      const intent = imageIntentRef.current;
      if (intent.file) {
        await uploadImage.mutateAsync({
          id: bookmark.id,
          file: intent.file,
        });
      }
      else if (intent.auto) {
        await autoImage.mutateAsync({
          id: bookmark.id,
          sourceUrl: bookmark.url,
        });
      }
      else if (intent.remove) {
        await deleteImage.mutateAsync(bookmark.id);
      }
      notifySuccess("Changes saved");
      imageIntentRef.current = EMPTY_IMAGE_INTENT;
      setImageFieldKey(key => key + 1);
    }
    catch {
      // Surfaced via mutation hooks' onError toast.
    }
    finally {
      setIsPending(false);
    }
  }

  const isMutating = uploadImage.isPending || autoImage.isPending || deleteImage.isPending;
  const mutationError = uploadImage.error ?? autoImage.error ?? deleteImage.error;

  return (
    <form
      className="space-y-4"
      onSubmit={event => void handleSubmit(event)}
    >
      <BookmarkImageField
        key={imageFieldKey}
        existingImageUrl={bookmark.image?.url ?? null}
        pageUrl={bookmark.url}
        defaultAuto={false}
        autoGrabError={bookmark.imageAutoGrabError ?? null}
        onChange={(intent) => {
          imageIntentRef.current = intent;
        }}
      />
      <div>
        <Button
          type="submit"
          size="sm"
          disabled={isPending || isMutating}
        >
          {isPending || isMutating ? "Saving…" : "Save changes"}
        </Button>
        {mutationError
          ? <p className="mt-2 text-sm text-destructive">{mutationError.message}</p>
          : null}
      </div>
    </form>
  );
}
