import type { WebsiteNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { WebsiteTreeList } from "./WebsiteTreeList";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

function makeNode(overrides: Partial<WebsiteNode>): WebsiteNode {
  return {
    id: "site-root",
    domain: "github.com",
    siteName: "GitHub",
    slug: "github",
    builtIn: false,
    shortenedLinks: [],
    paramRules: [],
    createdAt: NOW,
    bookmarkCount: 12,
    socialLinks: [],
    alternateNames: [],
    children: [],
    ...overrides,
  };
}

const tree: WebsiteNode[] = [
  makeNode({
    id: "site-github",
    domain: "github.com",
    siteName: "GitHub",
    slug: "github",
    bookmarkCount: 12,
    children: [
      makeNode({
        id: "site-gist",
        domain: "gist.github.com",
        siteName: "Gist",
        slug: "gist-github",
        bookmarkCount: 3,
      }),
    ],
  }),
  makeNode({
    id: "site-youtube",
    domain: "youtube.com",
    siteName: "YouTube",
    slug: "youtube",
    builtIn: true,
    bookmarkCount: 0,
  }),
];

const meta = {
  title: "Components/WebsiteTreeList",
  component: WebsiteTreeList,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    tree,
    expanded: new Set(["site-github"]),
    onToggle: () => {},
    columns: 1,
  },
} satisfies Meta<typeof WebsiteTreeList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A two-level website tree with one node expanded to reveal its subdomain child. */
export const Default: Story = {};

/** Every node collapsed. */
export const Collapsed: Story = {
  args: {
    expanded: new Set<string>(),
  },
};
