import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkTitleColumnCell } from "./bookmarkTitleCell";
import { makeBookmark } from "../../test-utils/factories";
import { apiHandlers } from "../../test-utils/story-mocks";

const meta = {
  title: "Components/Tables/BookmarkTitleColumnCell",
  component: BookmarkTitleColumnCell,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkTitleColumnCell>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The title cell with the website favicon beside the title. */
export const WithFavicon: Story = {
  args: {
    bookmark: makeBookmark({
      id: "bm-title",
      title: "Build a full-stack TypeScript monorepo",
      website: {
        id: "site-github",
        domain: "github.com",
        siteName: "GitHub",
        slug: "github",
        imageUrl: "https://github.githubassets.com/favicons/favicon.png",
      },
    }),
  },
};

/** A bookmark with no website, so no favicon renders. */
export const NoFavicon: Story = {
  args: {
    bookmark: makeBookmark({
      id: "bm-title-2",
      title: "A bookmark with no website favicon",
      website: null,
    }),
  },
};
