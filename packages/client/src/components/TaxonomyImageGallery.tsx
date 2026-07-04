import type { TaxonomyImage } from "@eesimple/types";

import { useRef } from "react";

import { ImagePlus, Star, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** One "pull an image from an external source" action offered above the gallery. */
export interface TaxonomyImageAutoFetchButton {
  /** The action's source path segment, e.g. `"plex-poster"` — passed to the auto-fetch mutation. */
  source: string;
  /** Button label, e.g. "Use Plex poster". */
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Whether the action's precondition is met (connector enabled + entity has the relevant link). */
  enabled: boolean;
}

interface TaxonomyImageGalleryProps {
  images: TaxonomyImage[];
  isLoading: boolean;
  /** Read-only mode (the View tab): shows the grid, no upload/auto-fetch/set-main/remove controls. */
  readOnly?: boolean;
  autoFetchActions?: TaxonomyImageAutoFetchButton[];
  pendingAutoFetchSource?: string | null;
  onUpload?: (file: File) => void;
  uploadPending?: boolean;
  onAutoFetch?: (source: string) => void;
  onSetMain?: (imageId: string) => void;
  setMainPending?: boolean;
  onRemove?: (imageId: string) => void;
  removePending?: boolean;
}

/**
 * Multi-image gallery for a Plex/Kavita-backed media taxonomy entity (Movies, TV Shows, Episodes,
 * Albums, Tracks, Books). Every action is immediate — no staged intent / Save button — to
 * match this app's per-field auto-save convention for taxonomy edit tabs. Shared by every entity's
 * workbench Image tab; only the `autoFetchActions` list differs per entity (Plex poster vs. Kavita/
 * ISBN cover).
 */
export function TaxonomyImageGallery({
  images,
  isLoading,
  readOnly = false,
  autoFetchActions = [],
  pendingAutoFetchSource,
  onUpload,
  uploadPending,
  onAutoFetch,
  onSetMain,
  setMainPending,
  onRemove,
  removePending,
}: TaxonomyImageGalleryProps) {
  const {
    t,
  } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t("Loading images…")}</p>;
  }

  return (
    <div className="space-y-4">
      {images.length > 0
        ? (
          <div
            className="
              grid grid-cols-2 gap-3
              sm:grid-cols-4
            "
          >
            {images.map(image => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-md border"
              >
                <img
                  src={image.url}
                  alt=""
                  className="aspect-square size-full object-cover"
                />
                {image.isMain
                  ? (
                    <span
                      className="
                        absolute top-1 left-1 rounded-full bg-background/80 p-1
                        text-primary
                      "
                      title={t("Main image")}
                    >
                      <Star className="size-3.5 fill-current" />
                    </span>
                  )
                  : null}
                {!readOnly
                  ? (
                    <div
                      className="
                        absolute inset-x-0 bottom-0 flex items-center
                        justify-between gap-1 bg-background/80 p-1 opacity-0
                        transition-opacity
                        group-hover:opacity-100
                      "
                    >
                      {!image.isMain
                        ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-xs"
                            disabled={setMainPending}
                            onClick={() => onSetMain?.(image.id)}
                          >
                            {t("Set main")}
                          </Button>
                        )
                        : <span />}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        aria-label={t("Remove image")}
                        disabled={removePending}
                        onClick={() => onRemove?.(image.id)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  )
                  : null}
              </div>
            ))}
          </div>
        )
        : <p className="text-sm text-muted-foreground">{t("No images yet.")}</p>}

      {!readOnly
        ? (
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (file) onUpload?.(file);
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadPending}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus className="size-4" />
              {uploadPending ? t("Uploading…") : t("Choose image")}
            </Button>
            {autoFetchActions.filter(action => action.enabled).map((action) => {
              const Icon = action.icon;
              const pending = pendingAutoFetchSource === action.source;
              return (
                <Button
                  key={action.source}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => onAutoFetch?.(action.source)}
                >
                  <Icon className={cn("size-4")} />
                  {pending ? t("Importing…") : action.label}
                </Button>
              );
            })}
          </div>
        )
        : null}
    </div>
  );
}
