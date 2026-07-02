import type { Meta, StoryObj } from "@storybook/react-vite";

import { AuthorGeneralForm } from "./AuthorGeneralForm";
import { makeAuthor } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const author = makeAuthor({
  id: "author-1",
  name: "Jane Author",
  slug: "jane-author",
  bookmarkCount: 3,
  authorWebsiteUrl: "https://janeauthor.example.com",
});

const meta = {
  title: "Components/AuthorGeneralForm",
  component: AuthorGeneralForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    author,
  },
} satisfies Meta<typeof AuthorGeneralForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Author General edit tab — name, URLs, avatar, and social links, all auto-saving. */
export const Default: Story = {};
