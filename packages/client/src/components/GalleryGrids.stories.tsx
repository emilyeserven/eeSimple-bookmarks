import type { MediaObject } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { OrphansGrid, RegisteredGrid, StorageSummary } from "./GalleryGrids";
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

const registered: MediaObject[] = [
  makeObject({
    objectKey: "bookmarks/github.webp",
    byteSize: 220_000,
    bookmark: {
      id: "bookmark-github",
      title: "GitHub",
    },
  }),
  makeObject({
    objectKey: "bookmarks/news.webp",
    byteSize: 96_000,
    url: "https://placehold.co/300x500/png",
    bookmark: {
      id: "bookmark-news",
      title: "Some long article title that should truncate nicely",
    },
  }),
];

const orphans: MediaObject[] = [
  makeObject({
    objectKey: "bookmarks/orphan-1.webp",
    byteSize: 51_200,
  }),
  makeObject({
    objectKey: "bookmarks/orphan-2.webp",
    byteSize: 410_000,
    url: "https://placehold.co/500x300/png",
  }),
];

const meta = {
  title: "Components/GalleryGrids",
  component: OrphansGrid,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    orphans,
    layout: "natural",
    onDeleteAll: () => {},
    onAttach: () => {},
    onDelete: () => {},
  },
} satisfies Meta<typeof OrphansGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The orphans grid (objects with no live bookmark) in natural-aspect layout. */
export const Orphans: Story = {};

/** The orphans grid in uniform-square layout. */
export const OrphansSquare: Story = {
  args: {
    layout: "square",
  },
};

/** The registered grid (objects still linked to a bookmark). */
export const Registered: Story = {
  render: () => (
    <RegisteredGrid
      registered={registered}
      layout="natural"
    />
  ),
};

/** The storage-used summary line, with and without a quota. */
export const Summary: Story = {
  render: () => (
    <div className="space-y-2">
      <StorageSummary
        registered={registered}
        orphans={orphans}
        quotaBytes={null}
      />
      <StorageSummary
        registered={registered}
        orphans={orphans}
        quotaBytes={10_737_418_240}
      />
    </div>
  ),
};
