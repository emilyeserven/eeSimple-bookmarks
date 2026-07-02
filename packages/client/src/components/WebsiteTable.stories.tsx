import type { ListSelection } from "../lib/useListSelection";
import type { Website } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { WebsiteTable } from "./WebsiteTable";
import { makeWebsite } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const websites: Website[] = [
  makeWebsite({
    id: "site-github",
    domain: "github.com",
    siteName: "GitHub",
    slug: "github",
    bookmarkCount: 42,
  }),
  makeWebsite({
    id: "site-youtube",
    domain: "youtube.com",
    siteName: "YouTube",
    slug: "youtube",
    builtIn: true,
    bookmarkCount: 18,
  }),
  makeWebsite({
    id: "site-mdn",
    domain: "developer.mozilla.org",
    siteName: "MDN Web Docs",
    slug: "mdn",
    bookmarkCount: 7,
  }),
];

const noSelection = {
  selectedIds: [],
  selectedSet: new Set<string>(),
  isSelected: () => false,
  toggle: () => {},
  selectAll: () => {},
  clear: () => {},
  count: 0,
  allSelected: false,
  mode: false,
  setMode: () => {},
} as unknown as ListSelection;

const meta = {
  title: "Components/WebsiteTable",
  component: WebsiteTable,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    websites,
    selection: noSelection,
  },
} satisfies Meta<typeof WebsiteTable>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The sortable table view of the websites listing. */
export const Default: Story = {};

/** With a selection column shown (bulk-select mode on). */
export const SelectionMode: Story = {
  args: {
    selection: {
      ...noSelection,
      mode: true,
    } as unknown as ListSelection,
  },
};
