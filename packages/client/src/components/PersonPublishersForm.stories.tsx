import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { PersonPublishersForm, PersonPublishersView } from "./PersonPublishersForm";
import { makePerson, makePublisher } from "../test-utils/factories";
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

const person = makePerson({
  id: "person-1",
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
  title: "Components/PersonPublishersForm",
  component: PersonPublishersForm,
  parameters: {
    msw: {
      handlers: publishersHandlers,
    },
  },
  args: {
    person,
  },
} satisfies Meta<typeof PersonPublishersForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Editable association list with one publisher already connected. */
export const Default: Story = {};

/** No connections selected yet. */
export const NoneConnected: Story = {
  args: {
    person: {
      ...person,
      publisherIds: [],
    },
  },
};

/** Read-only view of the connected publishers. */
export const ReadOnlyView: Story = {
  render: () => <PersonPublishersView person={person} />,
};
