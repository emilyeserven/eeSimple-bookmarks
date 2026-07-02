import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { PublisherAuthorsForm, PublisherAuthorsView } from "./PublisherAuthorsForm";
import { makeAuthor, makePublisher } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const publisher = makePublisher({
  id: "pub-oreilly",
  name: "O'Reilly Media",
  slug: "oreilly-media",
  bookmarkCount: 12,
});

const authors = [
  makeAuthor({
    id: "author-kyle",
    name: "Kyle Simpson",
    slug: "kyle-simpson",
    bookmarkCount: 9,
    publisherIds: ["pub-oreilly"],
  }),
  makeAuthor({
    id: "author-marijn",
    name: "Marijn Haverbeke",
    slug: "marijn-haverbeke",
    bookmarkCount: 5,
  }),
];

const authorHandlers = [
  ...apiHandlers,
  http.get("/api/authors", () => HttpResponse.json(authors)),
];

const meta = {
  title: "Components/PublisherAuthorsForm",
  component: PublisherAuthorsForm,
  parameters: {
    msw: {
      handlers: authorHandlers,
    },
  },
  args: {
    publisher,
  },
} satisfies Meta<typeof PublisherAuthorsForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Editable association list with one author connected. */
export const Default: Story = {};

/** Read-only view of the connected authors. */
export const ReadOnlyView: Story = {
  render: () => <PublisherAuthorsView publisher={publisher} />,
};
