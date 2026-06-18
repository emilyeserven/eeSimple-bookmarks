import type { ImageIntent } from "./bookmarkImageIntent";

import { useEffect, useRef, useState } from "react";

import { ImagePlus, Sparkles, X } from "lucide-react";

import { isFetchableUrl } from "../lib/url";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface BookmarkImageFieldProps {
  /** The bookmark's current image URL when editing, or null. */
  existingImageUrl: string | null;
  /** The current URL field value; enables the "Use page image" button. */
  pageUrl: string;
  /** Reports the chosen image intent up to the form, which applies it after the bookmark saves. */
  onChange: (intent: ImageIntent) => void;
  /** When true, the control starts in auto-fetch mode (shows "Fetched on save"). */
  defaultAuto?: boolean;
}

/**
 * Image control for the bookmark form. Lets the user choose, drag-and-drop, or paste a file, or
 * auto-fetch the page's preview image, with a live preview. It doesn't talk to the server itself —
 * it reports an intent the form applies once the bookmark has an id (so it works for create + edit).
 */
export function BookmarkImageField({
  existingImageUrl, pageUrl, onChange, defaultAuto,
}: BookmarkImageFieldProps) {
  const [file, setFile] = useState<File | null>(null);
  const [auto, setAuto] = useState(defaultAuto ?? false);
  const [remove, setRemove] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Track drag nesting so moving the pointer over a child element doesn't flicker the highlight off.
  const [dragDepth, setDragDepth] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragActive = dragDepth > 0;

  // Build (and clean up) the object-URL preview for a chosen file.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function chooseFile(picked: File | null): void {
    if (!picked || !picked.type.startsWith("image/")) return;
    setFile(picked);
    setAuto(false);
    setRemove(false);
    onChange({
      file: picked,
      auto: false,
      remove: false,
    });
  }

  function chooseAuto(): void {
    setFile(null);
    setAuto(true);
    setRemove(false);
    onChange({
      file: null,
      auto: true,
      remove: false,
    });
  }

  function clear(): void {
    setFile(null);
    setAuto(false);
    // Flag removal only when there's a saved image to remove; clearing a pending pick just resets.
    const removeExisting = Boolean(existingImageUrl);
    setRemove(removeExisting);
    onChange({
      file: null,
      auto: false,
      remove: removeExisting,
    });
  }

  const shownImage = previewUrl ?? (remove ? null : existingImageUrl);
  const hasSomething = Boolean(file) || auto || (Boolean(existingImageUrl) && !remove);

  return (
    <div className="space-y-2">
      <Label>Image</Label>
      <div
        data-testid="image-dropzone"
        className={cn(
          "flex flex-wrap items-start gap-3 rounded-md transition-shadow",
          dragActive && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        )}
        onPaste={(event) => {
          const pasted = event.clipboardData.files[0];
          if (pasted?.type.startsWith("image/")) {
            event.preventDefault();
            chooseFile(pasted);
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragDepth(depth => depth + 1);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragDepth(depth => Math.max(0, depth - 1));
        }}
        onDragOver={event => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          setDragDepth(0);
          chooseFile(event.dataTransfer.files[0] ?? null);
        }}
      >
        <div
          className="
            flex size-28 shrink-0 items-center justify-center overflow-hidden
            rounded-md border bg-muted/30
          "
        >
          {shownImage
            ? (
              <img
                src={shownImage}
                alt=""
                className="size-full object-cover"
              />
            )
            : auto
              ? <span className="px-2 text-center text-xs text-muted-foreground">Fetched on save</span>
              : <ImagePlus className="size-6 text-muted-foreground" />}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              chooseFile(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="size-4" />
            Choose image
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!isFetchableUrl(pageUrl)}
            title="Fetch the page's preview image"
            onClick={chooseAuto}
          >
            <Sparkles className="size-4" />
            Use page image
          </Button>
          {hasSomething
            ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clear}
              >
                <X className="size-4" />
                Remove
              </Button>
            )
            : null}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Drag and drop, paste, or choose an image. Accepted formats: JPEG, PNG, WebP,
        GIF, SVG, AVIF, TIFF. Stored as an 800px WebP.
      </p>
      <div className="rounded-md border border-dashed bg-muted/20 px-3 py-2">
        <p className="text-xs font-medium text-muted-foreground">Gallery — coming soon</p>
        <p className="text-xs text-muted-foreground">
          Attaching multiple images to a bookmark will let you build a gallery here.
        </p>
      </div>
    </div>
  );
}
