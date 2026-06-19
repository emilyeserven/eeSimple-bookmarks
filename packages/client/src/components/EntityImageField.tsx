import type { ReactNode } from "react";

import { useRef, useState } from "react";

import { ImagePlus, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface EntityImagePreviewProps {
  imageUrl: string | null | undefined;
  shape?: "square" | "circle";
  fallback: ReactNode;
  /** Tailwind size class for the preview box (default `size-12`). */
  className?: string;
}

/** Read-only image preview for an entity's view page, with a fallback icon when none is stored. */
export function EntityImagePreview({
  imageUrl, shape = "square", fallback, className = "size-12",
}: EntityImagePreviewProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = imageUrl != null && !imageFailed;
  return (
    <span
      className={cn(
        `
          flex shrink-0 items-center justify-center overflow-hidden bg-muted
          text-muted-foreground
        `,
        shape === "circle" ? "rounded-full" : "rounded-md border",
        className,
      )}
    >
      {showImage
        ? (
          <img
            src={imageUrl ?? undefined}
            alt=""
            className={cn("size-full", shape === "circle"
              ? "object-cover"
              : "object-contain")}
            onError={() => setImageFailed(true)}
          />
        )
        : fallback}
    </span>
  );
}

interface EntityImageFieldProps {
  /** Field label (e.g. "Favicon", "Avatar"). */
  label: string;
  /** The entity's current serving image URL, or null/undefined when none is stored. */
  imageUrl: string | null | undefined;
  /** Preview shape — websites use a square favicon, channels a circular avatar. */
  shape?: "square" | "circle";
  /** Icon shown when there's no image. */
  fallback: ReactNode;
  /** Upload a user-chosen file (replaces any existing image). */
  onUpload: (file: File) => void;
  /** Auto-capture the image from the entity's source. Omit to hide the button. */
  onAuto?: () => void;
  /** Tooltip/label for the auto-capture button. */
  autoLabel?: string;
  /** Remove the stored image. */
  onRemove: () => void;
  /** Whether any image mutation is in flight (disables the buttons). */
  busy?: boolean;
}

/**
 * Image control for a taxonomy entity's edit form (websites, YouTube channels). Shows the current
 * image with a fallback icon, and lets the user upload a file, auto-capture from the source, or
 * remove it. Mirrors `BookmarkImageField`, but acts immediately via the passed mutations rather
 * than deferring an intent (the entity already has an id on its edit page).
 */
export function EntityImageField({
  label, imageUrl, shape = "square", fallback, onUpload, onAuto, autoLabel = "Fetch image", onRemove, busy,
}: EntityImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Hide an image that 404s/fails to decode so the fallback icon shows instead.
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = imageUrl != null && !imageFailed;

  function choose(file: File | null): void {
    if (!file || !file.type.startsWith("image/")) return;
    setImageFailed(false);
    onUpload(file);
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            `
              flex size-16 shrink-0 items-center justify-center overflow-hidden
              bg-muted text-muted-foreground
            `,
            shape === "circle" ? "rounded-full" : "rounded-md border",
          )}
        >
          {showImage
            ? (
              <img
                src={imageUrl ?? undefined}
                alt=""
                className={cn("size-full", shape === "circle"
                  ? "object-cover"
                  : "object-contain")}
                onError={() => setImageFailed(true)}
              />
            )
            : fallback}
        </span>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
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
            <ImagePlus className="size-4" />
            Choose image
          </Button>
          {onAuto
            ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                title={autoLabel}
                onClick={() => {
                  setImageFailed(false);
                  onAuto();
                }}
              >
                <Sparkles className="size-4" />
                {autoLabel}
              </Button>
            )
            : null}
          {imageUrl
            ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={onRemove}
              >
                <X className="size-4" />
                Remove
              </Button>
            )
            : null}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Choose an image to upload, or fetch one from the source. Stored as a WebP.
      </p>
    </div>
  );
}
