import type { WebsiteNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { WebsiteHierarchyView } from "./websiteHierarchyView";
import { makeWebsite as site } from "../../test-utils/factories";
import { apiHandlers } from "../../test-utils/story-mocks";

const github = site({
  id: "site-github",
  domain: "github.com",
  siteName: "GitHub",
  slug: "github",
});

const tree: WebsiteNode[] = [
  {
    ...github,
    children: [
      {
        ...site({
          id: "site-gist",
          domain: "gist.github.com",
          siteName: "Gist",
          slug: "gist-github",
        }),
        children: [],
      },
    ],
  },
];

const handlers = [
  http.get("/api/websites/tree", () => HttpResponse.json(tree)),
  ...apiHandlers,
];

const meta = {
  title: "Workbench/WebsiteHierarchyView",
  component: WebsiteHierarchyView,
  parameters: {
    msw: {
      handlers,
    },
  },
  args: {
    entity: github,
  },
} satisfies Meta<typeof WebsiteHierarchyView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A root website with one subdomain child. */
export const Default: Story = {};

/** A subdomain leaf — its parent appears as an ancestor link. */
export const Subdomain: Story = {
  args: {
    entity: site({
      id: "site-gist",
      domain: "gist.github.com",
      siteName: "Gist",
      slug: "gist-github",
    }),
  },
};
