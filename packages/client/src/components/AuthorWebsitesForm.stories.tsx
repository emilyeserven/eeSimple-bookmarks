import type { Meta, StoryObj } from "@storybook/react-vite";

import { AuthorWebsitesForm, AuthorWebsitesView } from "./AuthorWebsitesForm";
import { makeAuthor } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const author = makeAuthor({
  id: "author-1",
  name: "Kyle Simpson",
  slug: "kyle-simpson",
  bookmarkCount: 9,
  websiteIds: ["site-github"],
});

const meta = {
  title: "Components/AuthorWebsitesForm",
  component: AuthorWebsitesForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    author,
  },
} satisfies Meta<typeof AuthorWebsitesForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Editable association list with one website already connected. */
export const Default: Story = {};

/** No connections selected yet. */
export const NoneConnected: Story = {
  args: {
    author: {
      ...author,
      websiteIds: [],
    },
  },
};

/** Read-only view of the connected websites. */
export const ReadOnlyView: Story = {
  render: () => <AuthorWebsitesView author={author} />,
};
