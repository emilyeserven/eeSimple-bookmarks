import type { GalleryCatalog, MediaObject } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { GalleryListing } from "./GalleryManager";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

function makeObject(overrides: Partial<MediaObject> = {}): MediaObject {
  return {
    objectKey: "bookmarks/example.webp",
    contentType: "image/webp",
    byteSize: 184_320,
    lastModified: NOW,
    lastSeenAt: NOW,
    bookmark: null,
    url: "https://placehold.co/400x300/png",
    ...overrides,
  };
}

const catalog: GalleryCatalog = {
  registered: [
    makeObject({
      objectKey: "bookmarks/github.webp",
      byteSize: 220_000,
      bookmark: {
        id: "bookmark-github",
        title: "GitHub",
      },
    }),
  ],
  orphans: [
    makeObject({
      objectKey: "bookmarks/orphan-1.webp",
      byteSize: 51_200,
    }),
    makeObject({
      objectKey: "bookmarks/orphan-2.webp",
      byteSize: 410_000,
      url: "https://placehold.co/500x300/png",
    }),
  ],
  storageQuotaBytes: 10_737_418_240,
  pendingAutoFetchCount: 2,
};

const emptyCatalog: GalleryCatalog = {
  registered: [],
  orphans: [],
  storageQuotaBytes: null,
  pendingAutoFetchCount: 0,
};

const statusHandlers = [
  http.get("/api/gallery/auto-fetch/status", () => HttpResponse.json({
    status: "idle",
  })),
  http.get("/api/gallery/auto-fetch-screenshot-fallback/status", () => HttpResponse.json({
    status: "idle",
  })),
];

const meta = {
  title: "Components/GalleryListing",
  component: GalleryListing,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/gallery", () => HttpResponse.json(catalog)),
        ...statusHandlers,
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof GalleryListing>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The full Media Management catalog with registered + orphan grids. */
export const Default: Story = {};

/** An empty bucket — the "no images yet" hint. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/gallery", () => HttpResponse.json(emptyCatalog)),
        ...statusHandlers,
        ...apiHandlers,
      ],
    },
  },
};
