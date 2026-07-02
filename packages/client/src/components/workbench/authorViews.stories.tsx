import type { Meta, StoryObj } from "@storybook/react-vite";

import { AuthorGeneralView } from "./authorViews";
import { makeAuthor } from "../../test-utils/factories";
import { apiHandlers } from "../../test-utils/story-mocks";

const author = makeAuthor({
  id: "author-1",
  name: "Jane Doe",
  slug: "jane-doe",
  bookmarkCount: 12,
  authorWebsiteUrl: "https://janedoe.example.com",
  biographyUrl: "https://en.wikipedia.org/wiki/Jane_Doe",
  socialLinks: [
    {
      platform: "x",
      url: "https://x.com/janedoe",
    },
  ],
});

const meta = {
  title: "Components/Workbench/AuthorGeneralView",
  component: AuthorGeneralView,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof AuthorGeneralView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entity: author,
  },
};

export const Minimal: Story = {
  args: {
    entity: {
      ...author,
      id: "author-2",
      name: "Anonymous",
      slug: "anonymous",
      bookmarkCount: 0,
      authorWebsiteUrl: null,
      biographyUrl: null,
      socialLinks: [],
    },
  },
};
