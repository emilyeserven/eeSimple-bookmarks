import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { PersonGroupsForm, PersonGroupsView } from "./PersonGroupsForm";
import { makePerson, makeGroup } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const sampleGroups = [
  makeGroup({
    id: "pub-oreilly",
    name: "O'Reilly Media",
    slug: "oreilly-media",
    labeledWebsites: [
      {
        label: "Website",
        url: "https://oreilly.com",
        websiteId: null,
      },
    ],
    bookmarkCount: 12,
  }),
  makeGroup({
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
  groupIds: ["pub-oreilly"],
});

const groupsHandlers = [
  ...apiHandlers,
  http.get("/api/groups", () => HttpResponse.json(sampleGroups)),
];

const meta = {
  title: "Components/PersonGroupsForm",
  component: PersonGroupsForm,
  parameters: {
    msw: {
      handlers: groupsHandlers,
    },
  },
  args: {
    person,
  },
} satisfies Meta<typeof PersonGroupsForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Editable association list with one group already connected. */
export const Default: Story = {};

/** No connections selected yet. */
export const NoneConnected: Story = {
  args: {
    person: {
      ...person,
      groupIds: [],
    },
  },
};

/** Read-only view of the connected groups. */
export const ReadOnlyView: Story = {
  render: () => <PersonGroupsView person={person} />,
};
