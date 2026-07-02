import type { MediaType, MediaTypeNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { MediaTypeGeneralView, MediaTypeHierarchyView } from "./mediaTypeViews";
import { makeMediaType } from "../../test-utils/factories";
import { apiHandlers, sampleMediaTypes } from "../../test-utils/story-mocks";

const article: MediaType = makeMediaType({
  id: "media-article",
  name: "Article",
  slug: "article",
  icon: "FileText",
  builtIn: true,
  sortOrder: 1,
  bookmarkCount: 7,
});

const tree: MediaTypeNode[] = [
  {
    ...article,
    children: [
      {
        ...makeMediaType({
          id: "media-longread",
          name: "Long Read",
          slug: "long-read",
          parentId: "media-article",
          bookmarkCount: 2,
        }),
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
