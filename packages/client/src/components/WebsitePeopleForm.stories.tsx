import type { Person } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { WebsitePeopleForm, WebsitePeopleView } from "./WebsitePeopleForm";
import { makePerson, makeWebsite } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const website = makeWebsite({
  id: "site-github",
  domain: "github.com",
  siteName: "GitHub",
  slug: "github",
  bookmarkCount: 42,
});

const samplePeople: Person[] = [
  makePerson({
    id: "person-1",
    name: "Kyle Simpson",
    slug: "kyle-simpson",
    bookmarkCount: 9,
    websiteIds: ["site-github"],
  }),
  makePerson({
    id: "person-2",
    name: "Sarah Drasner",
    slug: "sarah-drasner",
    bookmarkCount: 4,
  }),
];

const meta = {
  title: "Components/WebsitePeopleForm",
  component: WebsitePeopleForm,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/people", () => HttpResponse.json(samplePeople)),
        ...apiHandlers,
      ],
    },
  },
  args: {
    website,
  },
} satisfies Meta<typeof WebsitePeopleForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Editable association list with one person already connected. */
export const Default: Story = {};

/** No people exist yet — the empty-state message is shown. */
export const NoPeople: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/people", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
};

/** Read-only view of the connected people. */
export const ReadOnlyView: Story = {
  render: () => <WebsitePeopleView website={website} />,
};
