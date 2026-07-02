import type { MediaTypeNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { MediaTypesListing } from "./MediaTypeManager";
import { makeMediaType } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

function node(overrides: Partial<MediaTypeNode>, children: MediaTypeNode[] = []): MediaTypeNode {
  return {
    ...makeMediaType(),
    children,
    ...overrides,
  };
}

const tree: MediaTypeNode[] = [
  node({
    id: "media-video",
    name: "Video",
    slug: "video",
    builtIn: true,
    sortOrder: 0,
    bookmarkCount: 4,
  }, [
    node({
      id: "media-short",
      name: "Short",
      slug: "short",
      parentId: "media-video",
      sortOrder: 0,
      bookmarkCount: 1,
    }),
  ]),
  node({
    id: "media-article",
    name: "Article",
    slug: "article",
    builtIn: true,
    sortOrder: 1,
    bookmarkCount: 7,
  }),
];

const meta = {
  title: "Settings/MediaTypesListing",
  component: MediaTypesListing,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/media-types/tree", () => HttpResponse.json(tree)),
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof MediaTypesListing>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The media-type taxonomy tree populated with a couple of built-ins. */
export const Default: Story = {};

/** No media types yet — the empty-state message is shown. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/media-types/tree", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
};
