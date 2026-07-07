import type { GalleryLayout } from "./galleryFormat";
import type { BookmarkImage, Bookmark } from "@eesimple/types";
import type { CSSProperties } from "react";

import { useEffect, useState } from "react";

import { Link } from "@tanstack/react-router";
import { Crop, Images } from "lucide-react";
import { useTranslation } from "react-i18next";

import { layoutContainerClass, layoutItemClass } from "./galleryFormat";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCroppedHeight, useCroppedWidth } from "@/hooks/useAppSettings";
import { useCustomAspectRatios } from "@/hooks/useCustomAspectRatios";
import { buildAspectOptions } from "@/lib/aspectOptions";
import { useGalleryImageMode } from "@/lib/bookmarkColumns";
import { bookmarkImageAspectStyle } from "@/lib/bookmarkImage";
import { useUiStore } from "@/stores/uiStore";

interface Tile {
  image: BookmarkImage;
  bookmarkId: string;
  bookmarkTitle: string;
}

/**
 * The button group shown ahead of the gallery grid: a Masonry ⇄ Crop toggle plus, in Crop mode, an
 * aspect-size picker. `mode === "natural"` is masonry (true aspect ratio); any other value crops tiles
 * to that aspect. Kept separate so no single function goes hook-dense (fallow complexity cap).
 */
function BookmarkGalleryControls({
  pageKey,
  mode,
}: {
  pageKey: string;
  mode: string;
}) {
  const {
    t,
  } = useTranslation();
  const setMode = useUiStore(state => state.setGalleryImageMode);
  const croppedWidth = useCroppedWidth();
  const croppedHeight = useCroppedHeight();
  const {
    data: customRatios = [],
  } = useCustomAspectRatios();
  const [lastCropMode, setLastCropMode] = useState("square");

  // Remember the active crop ratio so toggling Masonry → Crop restores it instead of resetting.
  useEffect(() => {
    if (mode !== "natural") setLastCropMode(mode);
  }, [mode]);

  const cropOptions = buildAspectOptions(croppedWidth, croppedHeight, customRatios).filter(
    opt => opt.value !== "natural",
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <ToggleGroup
        type="single"
        size="sm"
        value={mode === "natural" ? "masonry" : "crop"}
        onValueChange={(next) => {
          if (next === "masonry") setMode(pageKey, "natural");
          else if (next === "crop") setMode(pageKey, lastCropMode);
        }}
      >
        <ToggleGroupItem
          value="masonry"
          title={t("Masonry")}
        >
          <Images className="size-4" />
          {t("Masonry")}
        </ToggleGroupItem>
        <ToggleGroupItem
          value="crop"
          title={t("Crop")}
        >
          <Crop className="size-4" />
          {t("Crop")}
        </ToggleGroupItem>
      </ToggleGroup>

      {mode !== "natural"
        ? (
          <Select
            value={mode}
            onValueChange={next => setMode(pageKey, next)}
          >
            <SelectTrigger
              className="h-8 w-44"
              aria-label={t("Aspect")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {cropOptions.map(opt => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
        : null}
    </div>
  );
}

/**
 * A tile's image, sized for the active gallery mode: masonry keeps the true aspect ratio; crop forces
 * the chosen aspect into a uniform box that fills with `object-cover`.
 */
function GalleryTileImage({
  image,
  isMasonry,
  aspectStyle,
}: {
  image: BookmarkImage;
  isMasonry: boolean;
  aspectStyle: CSSProperties;
}) {
  if (isMasonry) {
    return (
      <img
        src={image.url}
        alt=""
        loading="lazy"
        className="h-auto w-full rounded-md border bg-muted/30"
      />
    );
  }
  return (
    <div
      className="
        flex w-full items-center justify-center overflow-hidden rounded-md
        border bg-muted/30
      "
      style={aspectStyle}
    >
      <img
        src={image.url}
        alt=""
        loading="lazy"
        className="size-full object-cover"
      />
    </div>
  );
}

/**
 * A grid of every image carried by the given bookmarks, each tile linking to its bookmark. A button
 * group ahead of the grid switches between Masonry (true aspect ratio) and Crop (a uniform grid at a
 * chosen aspect). Scope + filtering are owned by the caller (the listing page passes the
 * already-filtered set), so this component only flattens `bookmark.images` into tiles and renders them.
 */
export function BookmarkImageGallery({
  bookmarks,
  pageKey,
}: {
  bookmarks: Bookmark[];
  pageKey: string;
}) {
  const {
    t,
  } = useTranslation();
  const mode = useGalleryImageMode(pageKey);
  const croppedWidth = useCroppedWidth();
  const croppedHeight = useCroppedHeight();
  const {
    data: customRatios = [],
  } = useCustomAspectRatios();

  const isMasonry = mode === "natural";
  const layout: GalleryLayout = isMasonry ? "natural" : "square";
  const aspectStyle = bookmarkImageAspectStyle(mode, croppedWidth, croppedHeight, customRatios);

  const tiles: Tile[] = bookmarks.flatMap(b => b.images.map(image => ({
    image,
    bookmarkId: b.id,
    bookmarkTitle: b.title,
  })));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{t("Images")}</h2>
          <Badge variant="secondary">{tiles.length}</Badge>
        </div>
        <BookmarkGalleryControls
          pageKey={pageKey}
          mode={mode}
        />
      </div>
      {tiles.length === 0
        ? <p className="text-muted-foreground">{t("No images yet.")}</p>
        : (
          <ul className={layoutContainerClass(layout)}>
            {tiles.map(tile => (
              <li
                key={tile.image.id}
                className={layoutItemClass(layout)}
              >
                <Link
                  to="/bookmarks/$bookmarkId"
                  params={{
                    bookmarkId: tile.bookmarkId,
                  }}
                  title={tile.bookmarkTitle}
                  className="block"
                >
                  <GalleryTileImage
                    image={tile.image}
                    isMasonry={isMasonry}
                    aspectStyle={aspectStyle}
                  />
                </Link>
                <p
                  className="truncate text-sm font-medium"
                  title={tile.bookmarkTitle}
                >
                  {tile.bookmarkTitle}
                </p>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
