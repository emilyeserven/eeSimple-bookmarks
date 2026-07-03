import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { PublisherPeopleForm, PublisherPeopleView } from "./PublisherPeopleForm";
import { makePerson, makePublisher } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const publisher = makePublisher({
  id: "pub-oreilly",
  name: "O'Reilly Media",
  slug: "oreilly-media",
  bookmarkCount: 12,
});

const people = [
  makePerson({
    id: "person-kyle",
    name: "Kyle Simpson",
    slug: "kyle-simpson",
    bookmarkCount: 9,
    publisherIds: ["pub-oreilly"],
  }),
  makePerson({
    id: "person-marijn",
    name: "Marijn Haverbeke",
    slug: "marijn-haverbeke",
    bookmarkCount: 5,
  }),
];

const personHandlers = [
  ...apiHandlers,
  http.get("/api/people", () => HttpResponse.json(people)),
];

const meta = {
  title: "Components/PublisherPeopleForm",
  component: PublisherPeopleForm,
  parameters: {
    msw: {
      handlers: personHandlers,
    },
  },
  args: {
    publisher,
  },
} satisfies Meta<typeof PublisherPeopleForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Editable association list with one person connected. */
export const Default: Story = {};

/** Read-only view of the connected people. */
export const ReadOnlyView: Story = {
  render: () => <PublisherPeopleView publisher={publisher} />,
};
