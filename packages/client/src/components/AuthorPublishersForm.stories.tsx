import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { AuthorPublishersForm, AuthorPublishersView } from "./AuthorPublishersForm";
import { makeAuthor, makePublisher } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const samplePublishers = [
  makePublisher({
    id: "pub-oreilly",
    name: "O'Reilly Media",
    slug: "oreilly-media",
    websiteId: "site-oreilly",
    website: {
      id: "site-oreilly",
      domain: "oreilly.com",
      siteName: "O'Reilly",
    },
    bookmarkCount: 12,
  }),
  makePublisher({
    id: "pub-manning",
    name: "Manning Publications",
    slug: "manning",
    bookmarkCount: 4,
  }),
];

const author = makeAuthor({
  id: "author-1",
  name: "Kyle Simpson",
  slug: "kyle-simpson",
  bookmarkCount: 9,
  publisherIds: ["pub-oreilly"],
});

const publishersHandlers = [
  ...apiHandlers,
  http.get("/api/publishers", () => HttpResponse.json(samplePublishers)),
];

const meta = {
  title: "Components/AuthorPublishersForm",
  component: AuthorPublishersForm,
  parameters: {
    msw: {
      handlers: publishersHandlers,
    },
  },
  args: {
    author,
  },
} satisfies Meta<typeof AuthorPublishersForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Editable association list with one publisher already connected. */
export const Default: Story = {};

/** No connections selected yet. */
export const NoneConnected: Story = {
  args: {
    author: {
      ...author,
      publisherIds: [],
    },
  },
};

/** Read-only view of the connected publishers. */
export const ReadOnlyView: Story = {
  render: () => <AuthorPublishersView author={author} />,
};
