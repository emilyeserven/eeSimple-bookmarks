import type { MediaType, MediaTypeNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { MediaTypeGeneralView, MediaTypeHierarchyView } from "./mediaTypeViews";
import { apiHandlers, sampleMediaTypes } from "../../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const article: MediaType = {
  id: "media-article",
  name: "Article",
  slug: "article",
  icon: "FileText",
  builtIn: true,
  sortOrder: 1,
  parentId: null,
  createdAt: NOW,
  bookmarkCount: 7,
};

const tree: MediaTypeNode[] = [
  {
    ...article,
    children: [
      {
        id: "media-longread",
        name: "Long Read",
        slug: "long-read",
        icon: null,
        builtIn: false,
        sortOrder: 0,
        parentId: "media-article",
        createdAt: NOW,
        bookmarkCount: 2,
        children: [],
      },
    ],
  },
];

const handlers = [
  http.get("/api/media-types/tree", () => HttpResponse.json(tree)),
  ...apiHandlers,
];

const meta = {
  title: "Workbench/MediaTypeViews",
  component: MediaTypeGeneralView,
  parameters: {
    msw: {
      handlers,
    },
  },
  args: {
    entity: article,
  },
} satisfies Meta<typeof MediaTypeGeneralView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The General view tab for a media type. */
export const General: Story = {};

/** A child media type showing its parent name. */
export const GeneralWithParent: Story = {
  args: {
    entity: {
      ...sampleMediaTypes[2],
      parentId: "media-article",
    },
  },
};

/** The Hierarchy view tab: ancestor chain and child subtree. */
export const Hierarchy: StoryObj = {
  render: () => <MediaTypeHierarchyView entity={article} />,
};
