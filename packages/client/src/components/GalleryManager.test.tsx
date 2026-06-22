import type { GalleryCatalog, MediaObject } from "@eesimple/types";

import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GalleryListing } from "./GalleryManager";
import { renderWithRouter } from "../test-utils/router";

// Stub the gallery hooks so the listing can be driven without a live API.
const deleteMutate = vi.fn<(keys: string[], opts?: unknown) => void>();
let galleryState: { data: GalleryCatalog | undefined;
  isLoading: boolean;
  error: Error | null; } = {
  data: undefined,
  isLoading: false,
  error: null,
};

vi.mock("../hooks/useGallery", () => ({
  useGallery: () => galleryState,
  useScanBucket: () => ({
    mutate: vi.fn(),
    isPending: false,
    data: undefined,
  }),
  useDeleteOrphans: () => ({
    mutate: deleteMutate,
    isPending: false,
  }),
  useAttachOrphan: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("../hooks/useBookmarks", () => ({
  useBookmarks: () => ({
    data: [],
  }),
}));

const DETAIL_PATH = "/bookmarks/$bookmarkId";

function makeObject(over: Partial<MediaObject>): MediaObject {
  return {
    objectKey: "bookmarks/x.webp",
    contentType: "image/webp",
    byteSize: 2048,
    lastModified: "2026-06-18T00:00:00.000Z",
    lastSeenAt: "2026-06-18T00:00:00.000Z",
    bookmark: null,
    url: "/api/gallery/image?key=bookmarks%2Fx.webp",
    ...over,
  };
}

describe("GalleryListing", () => {
  it("surfaces the storage-not-configured error from the query", async () => {
    galleryState = {
      data: undefined,
      isLoading: false,
      error: new Error("Image storage is not configured"),
    };
    await renderWithRouter(<GalleryListing />, {
      paths: [DETAIL_PATH],
    });

    expect(screen.getByText("Image storage is not configured")).toBeInTheDocument();
  });

  it("shows an empty message when the bucket has no objects", async () => {
    galleryState = {
      data: {
        registered: [],
        orphans: [],
        storageQuotaBytes: null,
      },
      isLoading: false,
      error: null,
    };
    await renderWithRouter(<GalleryListing />, {
      paths: [DETAIL_PATH],
    });

    expect(screen.getByText(/No images in storage yet/)).toBeInTheDocument();
  });

  it("lists registered and orphaned objects in their own sections", async () => {
    galleryState = {
      data: {
        registered: [
          makeObject({
            objectKey: "bookmarks/11111111-1111-1111-1111-111111111111.webp",
            bookmark: {
              id: "11111111-1111-1111-1111-111111111111",
              title: "GitHub",
            },
            url: "/api/bookmarks/11111111-1111-1111-1111-111111111111/image",
          }),
        ],
        orphans: [makeObject({
          objectKey: "bookmarks/orphan.webp",
        })],
        storageQuotaBytes: null,
      },
      isLoading: false,
      error: null,
    };
    await renderWithRouter(<GalleryListing />, {
      paths: [DETAIL_PATH],
    });

    expect(screen.getByText("Registered")).toBeInTheDocument();
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("Orphans")).toBeInTheDocument();
    expect(screen.getByText("bookmarks/orphan.webp")).toBeInTheDocument();
  });

  it("renders the table view with preview, name, bookmark, and size columns", async () => {
    galleryState = {
      data: {
        registered: [
          makeObject({
            objectKey: "bookmarks/11111111-1111-1111-1111-111111111111.webp",
            bookmark: {
              id: "11111111-1111-1111-1111-111111111111",
              title: "GitHub",
            },
            url: "/api/bookmarks/11111111-1111-1111-1111-111111111111/image",
          }),
        ],
        orphans: [makeObject({
          objectKey: "bookmarks/orphan.webp",
        })],
        storageQuotaBytes: null,
      },
      isLoading: false,
      error: null,
    };
    await renderWithRouter(<GalleryListing />, {
      paths: [DETAIL_PATH],
    });

    fireEvent.click(screen.getByTitle("Table"));

    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Bookmark")).toBeInTheDocument();
    expect(screen.getByText("Size")).toBeInTheDocument();
    // The associated bookmark, the orphan's name, and the "Orphan" marker all render as rows.
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("bookmarks/orphan.webp")).toBeInTheDocument();
    expect(screen.getByText("Orphan")).toBeInTheDocument();
  });

  it("offers a Natural/Square layout toggle in the grid view", async () => {
    galleryState = {
      data: {
        registered: [],
        orphans: [makeObject({
          objectKey: "bookmarks/orphan.webp",
        })],
        storageQuotaBytes: null,
      },
      isLoading: false,
      error: null,
    };
    await renderWithRouter(<GalleryListing />, {
      paths: [DETAIL_PATH],
    });

    expect(screen.getByTitle("Natural aspect ratio")).toBeInTheDocument();
    expect(screen.getByTitle("Square")).toBeInTheDocument();
  });

  it("confirms before deleting a single orphan", async () => {
    galleryState = {
      data: {
        registered: [],
        orphans: [makeObject({
          objectKey: "bookmarks/orphan.webp",
        })],
        storageQuotaBytes: null,
      },
      isLoading: false,
      error: null,
    };
    await renderWithRouter(<GalleryListing />, {
      paths: [DETAIL_PATH],
    });

    fireEvent.click(screen.getByRole("button", {
      name: /^Delete$/,
    }));
    // The confirm dialog opens; only on confirm does the mutation fire.
    expect(deleteMutate).not.toHaveBeenCalled();
    const deleteButtons = screen.getAllByRole("button", {
      name: /^Delete$/,
    });
    const confirmButton = deleteButtons[deleteButtons.length - 1];
    if (confirmButton) fireEvent.click(confirmButton);

    expect(deleteMutate).toHaveBeenCalledWith(["bookmarks/orphan.webp"], expect.anything());
  });
});
