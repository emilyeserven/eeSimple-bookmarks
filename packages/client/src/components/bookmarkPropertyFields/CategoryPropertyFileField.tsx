import type { Bookmark, CustomProperty } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { BookmarkPropertyFileField } from "../BookmarkPropertyFileField";

import { Label } from "@/components/ui/label";

/**
 * An `image`/`file` property field. Blobs upload against an existing bookmark id, so on the create
 * form (no bookmark yet) it shows a "save first" hint instead of the upload control.
 */
export function CategoryPropertyFileField({
  property, bookmark,
}: {
  property: CustomProperty;
  bookmark: Bookmark | null;
}) {
  const {
    t,
  } = useTranslation();
  if (!bookmark) {
    return (
      <div className="space-y-1">
        <Label>{property.name}</Label>
        <p className="text-xs text-muted-foreground">
          {property.type === "image"
            ? t("Save the bookmark first, then attach an image.")
            : t("Save the bookmark first, then attach a file.")}
        </p>
      </div>
    );
  }
  return (
    <BookmarkPropertyFileField
      bookmarkId={bookmark.id}
      property={property}
      value={bookmark.fileValues.find(entry => entry.propertyId === property.id)}
    />
  );
}
