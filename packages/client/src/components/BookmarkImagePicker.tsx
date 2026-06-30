import type { ImageIntent, ImageMainSelection } from "./bookmarkImageIntent";
import type { BookmarkImage, ImageCandidate } from "@eesimple/types";

import { useEffect, useRef, useState } from "react";

import { ImagePlus, Sparkles, Star, X } from "lucide-react";

import { isFetchableUrl } from "../lib/url";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const IMAGE_GRAB_ERROR_LABELS: Record<string, string> = {
  no_image: "No preview image on this page",
  bad_image: "Preview image couldn't be loaded",
  blocked: "Access to this page was blocked",
  server_error: "Site returned a server error",
  fetch_error: "Page couldn't be reached",
};

interface BookmarkImagePickerProps {
  /** The bookmark's already-saved images when editing, or `[]` on create. */
  existingImages: BookmarkImage[];
  /** Candidate images discovered by the latest URL scan (carousel/article images). */
  candidates: ImageCandidate[];
  /** The current URL field value; enables the "Use page image" fallback. */
  pageUrl: string;
  /** Reports the chosen image intent up to the form, which applies it after the bookmark saves. */
  onChange: (intent: ImageIntent) => void;
  /** When true, default to fetching/keeping the page's first image on save (the auto-fetch setting). */
  defaultAuto?: boolean;
  /** Error from the last auto-grab attempt on the existing bookmark, if any. */
  autoGrabError?: string | null;
}

/** A kept-or-removable upload with its live object-URL preview. */
interface Upload {
  file: File;
  previewUrl: string;
}

/**
 * Multi-image control for the bookmark form. Shows the bookmark's existing images (edit), the URL
 * scan's candidate images (e.g. every slide of an Instagram carousel), and any uploaded/dropped
 * files in one grid. The user keeps any subset and picks which kept image is the main one. It
 * reports an {@link ImageIntent} the form applies once the bookmark has an id (so create + edit
 * share one path); it never talks to the server itself.
 */
export function BookmarkImagePicker({
  existingImages, candidates, pageUrl, onChange, defaultAuto, autoGrabError,
}: BookmarkImagePickerProps) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [keptCandidateUrls, setKeptCandidateUrls] = useState<string[]>([]);
  const [removedExistingIds, setRemovedExistingIds] = useState<string[]>([]);
  const [mainKey, setMainKey] = useState<string | null>(
    existingImages.find(img => img.isMain)?.id ?? null,
  );
  const [dragDepth, setDragDepth] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragActive = dragDepth > 0;

  // Keep `onChange` in a ref so the emit effect doesn't depend on the parent's callback identity.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // When a scan brings in candidates and auto-fetch is on, pre-keep the first as the main image so
  // saving without interacting matches the old single-image auto behaviour. Runs once per scan.
  const lastSeenCandidates = useRef<string>("");
  useEffect(() => {
    const signature = candidates.map(c => c.url).join("\n");
    if (signature === lastSeenCandidates.current) return;
    lastSeenCandidates.current = signature;
    if (defaultAuto && candidates.length > 0) {
      const first = candidates[0].url;
      setKeptCandidateUrls([first]);
      setMainKey(prev => prev ?? `candidate:${first}`);
    }
  }, [candidates, defaultAuto]);

  // Build (and revoke) object-URL previews for uploaded files.
  useEffect(() => {
    return () => {
      for (const upload of uploads) URL.revokeObjectURL(upload.previewUrl);
    };
    // Only revoke on unmount; per-file URLs are created/revoked in the add/remove handlers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recompute and report the intent whenever the selection changes.
  useEffect(() => {
    const keptUploadsExist = uploads.length > 0;
    const main: ImageMainSelection = parseMainKey(mainKey, {
      uploads,
      keptCandidateUrls,
      removedExistingIds,
      existingImages,
    });
    onChangeRef.current({
      uploads: uploads.map(u => u.file),
      keepCandidateUrls: keptCandidateUrls,
      mainSelection: main,
      removeImageIds: removedExistingIds,
      auto: Boolean(defaultAuto) && !keptUploadsExist && keptCandidateUrls.length === 0,
    });
  }, [uploads, keptCandidateUrls, removedExistingIds, mainKey, existingImages, defaultAuto]);

  function addFiles(files: FileList | File[]): void {
    const picked = Array.from(files).filter(file => file.type.startsWith("image/"));
    if (picked.length === 0) return;
    const added = picked.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setUploads((prev) => {
      const next = [...prev, ...added];
      // First image added with nothing else kept becomes the main by default.
      if (mainKey === null && removedExistingIds.length === 0 && keptCandidateUrls.length === 0 && prev.length === 0) {
        setMainKey(`upload:${prev.length}`);
      }
      return next;
    });
  }

  function removeUpload(index: number): void {
    setUploads((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
    if (mainKey === `upload:${index}`) setMainKey(null);
  }

  function toggleCandidate(url: string): void {
    setKeptCandidateUrls(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]);
    if (mainKey === `candidate:${url}`) setMainKey(null);
  }

  function toggleExistingRemoved(id: string): void {
    setRemovedExistingIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    if (mainKey === `existing:${id}`) setMainKey(null);
  }

  const hasAny
    = uploads.length > 0
      || candidates.length > 0
      || existingImages.length > 0;

  return (
    <div className="space-y-2">
      <Label>Images</Label>
      <div
        data-testid="image-dropzone"
        className={cn(
          "rounded-md p-1 transition-shadow",
          dragActive && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        )}
        onPaste={(event) => {
          if (event.clipboardData.files.length > 0) {
            event.preventDefault();
            addFiles(event.clipboardData.files);
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
          addFiles(event.dataTransfer.files);
        }}
      >
        {hasAny
          ? (
            <div className="flex flex-wrap gap-3">
              {existingImages.map(img => (
                <ImageTile
                  key={`existing:${img.id}`}
                  src={img.url}
                  kept={!removedExistingIds.includes(img.id)}
                  isMain={mainKey === `existing:${img.id}`}
                  onToggleKeep={() => toggleExistingRemoved(img.id)}
                  onSetMain={() => setMainKey(`existing:${img.id}`)}
                />
              ))}
              {candidates.map(candidate => (
                <ImageTile
                  key={`candidate:${candidate.url}`}
                  src={candidate.url}
                  kept={keptCandidateUrls.includes(candidate.url)}
                  isMain={mainKey === `candidate:${candidate.url}`}
                  onToggleKeep={() => toggleCandidate(candidate.url)}
                  onSetMain={() => setMainKey(`candidate:${candidate.url}`)}
                />
              ))}
              {uploads.map((upload, index) => (
                <ImageTile
                  key={`upload:${index}`}
                  src={upload.previewUrl}
                  kept
                  isMain={mainKey === `upload:${index}`}
                  onToggleKeep={() => removeUpload(index)}
                  onSetMain={() => setMainKey(`upload:${index}`)}
                />
              ))}
            </div>
          )
          : (
            <div
              className="
                flex size-28 items-center justify-center rounded-md border
                bg-muted/30
              "
            >
              {defaultAuto
                ? (
                  <div
                    className="flex flex-col items-center justify-center gap-1"
                  >
                    <Sparkles className="size-5 text-muted-foreground" />
                    <span
                      className="px-2 text-center text-xs text-muted-foreground"
                    >Page image on save
                    </span>
                  </div>
                )
                : <ImagePlus className="size-6 text-muted-foreground" />}
            </div>
          )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          Add image
        </Button>
        {autoGrabError && (
          <p className="text-xs text-muted-foreground">
            {IMAGE_GRAB_ERROR_LABELS[autoGrabError] ?? "Previous auto-grab failed"} — you can still try again after saving.
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Keep any of the images found on the page (or drag, paste, or add your own), then click the
        {" "}
        <Star className="inline size-3" />
        {" "}
        star to choose the main one. Stored as 1200px WebP.
        {!isFetchableUrl(pageUrl) && existingImages.length === 0 && candidates.length === 0
          ? " Enter a URL and scan it to pull its images."
          : ""}
      </p>
    </div>
  );
}

/** A single image tile with keep + set-main controls and a selection ring when kept. */
function ImageTile({
  src, kept, isMain, onToggleKeep, onSetMain,
}: {
  src: string;
  kept: boolean;
  isMain: boolean;
  onToggleKeep: () => void;
  onSetMain: () => void;
}) {
  return (
    <div
      className={cn(
        `
          group relative size-28 overflow-hidden rounded-md border bg-muted/30
          transition
        `,
        kept ? "ring-2 ring-primary" : "opacity-50",
      )}
    >
      <img
        src={src}
        alt=""
        className="size-full object-cover"
      />
      {/* Keep / remove toggle (top-left). */}
      <button
        type="button"
        aria-label={kept ? "Remove image" : "Keep image"}
        aria-pressed={kept}
        onClick={onToggleKeep}
        className="
          absolute top-1 left-1 rounded-sm bg-background/80 p-1 text-foreground
          shadow-sm
          hover:bg-background
        "
      >
        <X className="size-3.5" />
      </button>
      {/* Set-main star (top-right), only meaningful when the image is kept. */}
      {kept && (
        <button
          type="button"
          aria-label={isMain ? "Main image" : "Set as main image"}
          aria-pressed={isMain}
          onClick={onSetMain}
          className={cn(
            `
              absolute top-1 right-1 rounded-sm bg-background/80 p-1 shadow-sm
              hover:bg-background
            `,
            isMain ? "text-yellow-500" : "text-muted-foreground",
          )}
        >
          <Star className={cn("size-3.5", isMain && "fill-current")} />
        </button>
      )}
      {isMain && (
        <span
          className="
            absolute inset-x-0 bottom-0 bg-primary/80 py-0.5 text-center
            text-[10px] font-medium text-primary-foreground
          "
        >
          Main
        </span>
      )}
    </div>
  );
}

/** Resolve the persisted main-selection key to a typed selection, dropping keys no longer kept. */
function parseMainKey(
  mainKey: string | null,
  state: {
    uploads: Upload[];
    keptCandidateUrls: string[];
    removedExistingIds: string[];
    existingImages: BookmarkImage[];
  },
): ImageMainSelection {
  if (!mainKey) return null;
  if (mainKey.startsWith("upload:")) {
    const index = Number(mainKey.slice("upload:".length));
    return Number.isInteger(index) && index < state.uploads.length
      ? {
        kind: "upload",
        index,
      }
      : null;
  }
  if (mainKey.startsWith("candidate:")) {
    const url = mainKey.slice("candidate:".length);
    return state.keptCandidateUrls.includes(url)
      ? {
        kind: "candidate",
        url,
      }
      : null;
  }
  if (mainKey.startsWith("existing:")) {
    const id = mainKey.slice("existing:".length);
    const stillKept = state.existingImages.some(img => img.id === id) && !state.removedExistingIds.includes(id);
    return stillKept
      ? {
        kind: "existing",
        id,
      }
      : null;
  }
  return null;
}
