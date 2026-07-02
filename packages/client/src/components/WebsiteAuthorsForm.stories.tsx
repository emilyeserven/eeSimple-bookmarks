import type { Author } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { WebsiteAuthorsForm, WebsiteAuthorsView } from "./WebsiteAuthorsForm";
import { makeAuthor, makeWebsite } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const website = makeWebsite({
  id: "site-github",
  domain: "github.com",
  siteName: "GitHub",
  slug: "github",
  bookmarkCount: 42,
});

const sampleAuthors: Author[] = [
  makeAuthor({
    id: "author-1",
    name: "Kyle Simpson",
    slug: "kyle-simpson",
    bookmarkCount: 9,
    websiteIds: ["site-github"],
  }),
  makeAuthor({
    id: "author-2",
    name: "Sarah Drasner",
    slug: "sarah-drasner",
    bookmarkCount: 4,
  }),
];

const meta = {
  title: "Components/WebsiteAuthorsForm",
  component: WebsiteAuthorsForm,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/authors", () => HttpResponse.json(sampleAuthors)),
        ...apiHandlers,
      ],
    },
  },
  args: {
    website,
  },
} satisfies Meta<typeof WebsiteAuthorsForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Editable association list with one author already connected. */
export const Default: Story = {};

/** No authors exist yet — the empty-state message is shown. */
export const NoAuthors: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/authors", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
};

/** Read-only view of the connected authors. */
export const ReadOnlyView: Story = {
  render: () => <WebsiteAuthorsView website={website} />,
};
