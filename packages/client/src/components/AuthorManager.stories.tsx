import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { AuthorsListing } from "./AuthorManager";
import { makeAuthor } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const sampleAuthors = [
  makeAuthor({
    id: "author-1",
    name: "Jane Author",
    slug: "jane-author",
    bookmarkCount: 12,
  }),
  makeAuthor({
    id: "author-2",
    name: "John Writer",
    slug: "john-writer",
  }),
];

const meta = {
  title: "Components/AuthorsListing",
  component: AuthorsListing,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/authors", () => HttpResponse.json(sampleAuthors)),
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof AuthorsListing>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The author listing populated with a couple of authors. */
export const Default: Story = {};

/** No authors yet — the empty-state message is shown. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/authors", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
};
