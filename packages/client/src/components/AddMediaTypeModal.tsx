import type { MediaType } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { InlineCreateModal } from "./InlineCreateModal";
import { useCreateMediaType } from "../hooks/useMediaTypes";

interface AddMediaTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created media type so the opener can navigate to it. */
  onCreated?: (mediaType: MediaType) => void;
  /** Fixed parent id — used by the header's "New sub-type" button to nest under the current type. */
  defaultParentId?: string | null;
}

/** Minimal name-only modal to create a media type inline. */
export function AddMediaTypeModal({
  open, onOpenChange, onCreated, defaultParentId = null,
}: AddMediaTypeModalProps) {
  const {
    t,
  } = useTranslation();
  const createMediaType = useCreateMediaType();

  return (
    <InlineCreateModal
      open={open}
      onOpenChange={onOpenChange}
      title={defaultParentId ? t("New sub-type") : t("New media type")}
      description={defaultParentId
        ? t("Create a media type under the current one — you can fill in the rest from its edit page.")
        : t("Give the media type a name — you can fill in the rest from its edit page.")}
      placeholder={t("e.g. Newsletter")}
      submitLabel={t("Add media type")}
      isError={createMediaType.isError}
      errorMessage={createMediaType.error?.message}
      onSubmit={(name, done) => {
        createMediaType.mutate(
          {
            name,
            parentId: defaultParentId,
          },
          {
            onSuccess: (mediaType) => {
              onCreated?.(mediaType);
              done();
            },
          },
        );
      }}
    />
  );
}
