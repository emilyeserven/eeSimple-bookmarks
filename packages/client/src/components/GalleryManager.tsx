import type { GalleryLayout, GalleryView } from "./galleryFormat";
import type { Bookmark, MediaObject } from "@eesimple/types";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import i18n from "../i18n";
import { GalleryDialogs } from "./GalleryDialogs";
import { isVideoObject } from "./galleryFormat";
import { ArchivedReelsGrid, OrphansGrid, RegisteredGrid, StorageSummary } from "./GalleryGrids";
import { GalleryToolbar } from "./GalleryToolbar";
import { navLinkClass, TabbedShell } from "./TabbedShell";
import { galleryColumns } from "./tables/galleryColumns";
import { useBookmarks } from "../hooks/useBookmarks";
import { useAttachOrphan, useAutoFetchImages, useAutoFetchStatus, useAutoFetchWithFallback, useAutoFetchWithFallbackStatus, useDeleteOrphans, useGallery, useScanBucket } from "../hooks/useGallery";

import { DataTable } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";

type GallerySection = "media" | "archived-reels";

const GALLERY_SECTION_KEYS: GallerySection[] = ["media", "archived-reels"];

interface GalleryContentProps {
  view: GalleryView;
  layout: GalleryLayout;
  registered: MediaObject[];
  orphans: MediaObject[];
  onDeleteAll: () => void;
  onAttach: (key: string) => void;
  onDelete: (key: string) => void;
}

/**
 * The catalog body: one combined data table, or the registered + orphan grids. Extracted from
 * {@link GalleryListing} so the view-switching conditionals don't inflate its complexity.
 */
function GalleryContent({
  view, layout, registered, orphans, onDeleteAll, onAttach, onDelete,
}: GalleryContentProps) {
  if (view === "table") {
    return (
      <DataTable
        columns={galleryColumns({
          onAttach,
          onDelete,
        })}
        data={[...registered, ...orphans]}
        sortable
      />
    );
  }
  return (
    <>
      {registered.length > 0
        ? (
          <RegisteredGrid
            registered={registered}
            layout={layout}
          />
        )
        : null}
      {orphans.length > 0
        ? (
          <OrphansGrid
            orphans={orphans}
            layout={layout}
            onDeleteAll={onDeleteAll}
            onAttach={onAttach}
            onDelete={onDelete}
          />
        )
        : null}
    </>
  );
}

/** Groups the delete-confirm and attach-dialog state, mutations, and handlers for `GalleryListing`. */
function useGalleryDialogs() {
  const {
    t,
  } = useTranslation();
  const {
    data: allBookmarks = [],
  } = useBookmarks();
  const deleteOrphans = useDeleteOrphans();
  const attachOrphan = useAttachOrphan();

  const [pending, setPending] = useState<{ keys: string[];
    label: string; } | null>(null);
  const [attachKey, setAttachKey] = useState<string | null>(null);
  const [attachTarget, setAttachTarget] = useState<Bookmark | null>(null);

  function requestDelete(key: string): void {
    setPending({
      keys: [key],
      label: key,
    });
  }

  function requestDeleteAll(orphans: MediaObject[]): void {
    setPending({
      keys: orphans.map(o => o.objectKey),
      label: orphans.length === 1
        ? t("all {{count}} orphan", {
          count: orphans.length,
        })
        : t("all {{count}} orphans", {
          count: orphans.length,
        }),
    });
  }

  function confirmDelete(): void {
    if (!pending) return;
    deleteOrphans.mutate(pending.keys, {
      onSettled: () => setPending(null),
    });
  }

  function openAttach(key: string): void {
    setAttachKey(key);
    setAttachTarget(null);
  }

  function confirmAttach(): void {
    if (!attachKey || !attachTarget) return;
    attachOrphan.mutate({
      key: attachKey,
      bookmarkId: attachTarget.id,
    }, {
      onSettled: () => {
        setAttachKey(null);
        setAttachTarget(null);
      },
    });
  }

  return {
    allBookmarks,
    pending,
    attachKey,
    attachTarget,
    attachTargetHasImage: attachTarget?.image != null,
    deletePending: deleteOrphans.isPending,
    attachPending: attachOrphan.isPending,
    requestDelete,
    requestDeleteAll,
    confirmDelete,
    openAttach,
    onCancelDelete: () => setPending(null),
    onCancelAttach: () => setAttachKey(null),
    onSelectTarget: setAttachTarget,
    confirmAttach,
  };
}

/**
 * The Media Management catalog: every object in the storage bucket, split into images still linked
 * to a bookmark and orphans (objects with no live bookmark) that can be reclaimed. The bucket is
 * reconciled on demand with "Scan bucket". Shown either as a thumbnail grid (natural aspect ratio by
 * default, or uniform squares) or as a data table.
 */
export function GalleryListing() {
  const {
    data: catalog, isLoading, error,
  } = useGallery();
  const scan = useScanBucket();
  const autoFetch = useAutoFetchImages();
  const {
    data: autoFetchStatus,
  } = useAutoFetchStatus();
  const autoFetchRunning = autoFetchStatus?.status === "running";
  const autoFetchWithFallback = useAutoFetchWithFallback();
  const {
    data: autoFetchWithFallbackStatus,
  } = useAutoFetchWithFallbackStatus();
  const autoFetchWithFallbackRunning = autoFetchWithFallbackStatus?.status === "running";

  const [view, setView] = useState<GalleryView>("grid");
  const [layout, setLayout] = useState<GalleryLayout>("natural");
  const [section, setSection] = useState<GallerySection>("media");

  const dialogs = useGalleryDialogs();

  const registered = catalog?.registered ?? [];
  const orphans = catalog?.orphans ?? [];
  // Archived-reel videos get their own tab; the Media tab's grid/table only shows images.
  const registeredImages = registered.filter(object => !isVideoObject(object));
  const hasObjects = registeredImages.length > 0 || orphans.length > 0;

  return (
    <div className="space-y-6">
      {catalog
        ? (
          <StorageSummary
            registered={registered}
            orphans={orphans}
            quotaBytes={catalog.storageQuotaBytes ?? null}
          />
        )
        : null}

      {isLoading ? <p className="text-sm text-muted-foreground">{i18n.t("Loading media…")}</p> : null}
      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}

      <TabbedShell
        nav={GALLERY_SECTION_KEYS.map(key => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={cn(navLinkClass, key === section && `
              bg-accent text-accent-foreground
            `)}
          >
            {key === "media" ? i18n.t("Media") : i18n.t("Archived Reels")}
          </button>
        ))}
        navAriaLabel={i18n.t("Gallery sections")}
      >
        {section === "media"
          ? (
            <div className="space-y-6">
              <GalleryToolbar
                view={view}
                onViewChange={setView}
                layout={layout}
                onLayoutChange={setLayout}
                scan={scan}
                autoFetch={autoFetch}
                autoFetchRunning={autoFetchRunning}
                autoFetchWithFallback={autoFetchWithFallback}
                autoFetchWithFallbackRunning={autoFetchWithFallbackRunning}
                pendingAutoFetchCount={catalog?.pendingAutoFetchCount ?? 0}
              />

              {catalog && !hasObjects
                ? (
                  <p className="text-sm text-muted-foreground">
                    {i18n.t("No images in storage yet. Upload an image to a bookmark, then run a scan.")}
                  </p>
                )
                : null}

              {hasObjects
                ? (
                  <GalleryContent
                    view={view}
                    layout={layout}
                    registered={registeredImages}
                    orphans={orphans}
                    onDeleteAll={() => dialogs.requestDeleteAll(orphans)}
                    onAttach={dialogs.openAttach}
                    onDelete={dialogs.requestDelete}
                  />
                )
                : null}
            </div>
          )
          : <ArchivedReelsGrid bookmarks={dialogs.allBookmarks} />}
      </TabbedShell>

      <GalleryDialogs
        pendingLabel={dialogs.pending?.label ?? null}
        onCancelDelete={dialogs.onCancelDelete}
        onConfirmDelete={dialogs.confirmDelete}
        deletePending={dialogs.deletePending}
        attachOpen={dialogs.attachKey !== null}
        onCancelAttach={dialogs.onCancelAttach}
        bookmarks={dialogs.allBookmarks}
        attachTarget={dialogs.attachTarget}
        onSelectTarget={dialogs.onSelectTarget}
        attachTargetHasImage={dialogs.attachTargetHasImage}
        onConfirmAttach={dialogs.confirmAttach}
        attachPending={dialogs.attachPending}
      />
    </div>
  );
}
