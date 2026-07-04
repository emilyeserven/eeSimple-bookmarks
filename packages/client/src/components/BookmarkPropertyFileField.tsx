import type { BookmarkFileValue, CustomProperty } from "@eesimple/types";

import { useRef } from "react";

import { FileText, ImagePlus, Paperclip, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useDeleteBookmarkPropertyFile, useUploadBookmarkPropertyFile } from "../hooks/useBookmarks";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface BookmarkPropertyFileFieldProps {
  bookmarkId: string;
  property: CustomProperty;
  /** The bookmark's current value for this property, or undefined when none is stored. */
  value: BookmarkFileValue | undefined;
}

/** Format a byte count as a short human-readable size (e.g. "1.2 MB"). */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unit]}`;
}

/**
 * Upload control for an `image`/`file` custom-property value on an existing bookmark. Unlike the
 * scalar property fields it talks to the server directly (image/file blobs can't ride the bookmark
 * JSON save), uploading on pick and deleting on clear, then relying on the bookmarks query
 * invalidation to refresh the shown value.
 */
export function BookmarkPropertyFileField({
  bookmarkId, property, value,
}: BookmarkPropertyFileFieldProps) {
  const {
    t,
  } = useTranslation();
  const isImage = property.type === "image";
  const upload = useUploadBookmarkPropertyFile();
  const remove = useDeleteBookmarkPropertyFile();
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = upload.isPending || remove.isPending;

  function choose(picked: File | null): void {
    if (!picked) return;
    if (isImage && !picked.type.startsWith("image/")) return;
    upload.mutate({
      id: bookmarkId,
      propertyId: property.id,
      file: picked,
    });
  }

  function clear(): void {
    if (!value) return;
    remove.mutate({
      id: bookmarkId,
      propertyId: property.id,
    });
  }

  return (
    <div className="space-y-1">
      <Label htmlFor={`property-${property.id}`}>{property.name}</Label>
      <div className="flex flex-wrap items-start gap-3">
        <div
          className="
            flex size-20 shrink-0 items-center justify-center overflow-hidden
            rounded-md border bg-muted/30
          "
        >
          {value && isImage
            ? (
              <img
                src={value.url}
                alt=""
                className="size-full object-cover"
              />
            )
            : value
              ? <FileText className="size-6 text-muted-foreground" />
              : isImage
                ? <ImagePlus className="size-6 text-muted-foreground" />
                : <Paperclip className="size-6 text-muted-foreground" />}
        </div>
        <div className="flex flex-col gap-2">
          <input
            id={`property-${property.id}`}
            ref={inputRef}
            type="file"
            accept={isImage ? "image/*" : undefined}
            className="hidden"
            onChange={(event) => {
              choose(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {isImage
              ? <ImagePlus className="size-4" />
              : (
                <Paperclip
                  className="size-4"
                />
              )}
            {value ? t("Replace") : isImage ? t("Choose image") : t("Choose file")}
          </Button>
          {value && !isImage
            ? (
              <a
                href={value.url}
                className="text-xs text-primary underline underline-offset-2"
                target="_blank"
                rel="noreferrer"
              >
                {value.originalFilename ?? t("Download")}
                {" "}
                ({formatBytes(value.byteSize)})
              </a>
            )
            : null}
          {value
            ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={clear}
              >
                <X className="size-4" />
                {t("Remove")}
              </Button>
            )
            : null}
        </div>
      </div>
      {property.description
        ? <p className="text-xs text-muted-foreground">{property.description}</p>
        : null}
    </div>
  );
}
