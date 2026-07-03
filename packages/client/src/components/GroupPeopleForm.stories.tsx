import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { GroupPeopleForm, GroupPeopleView } from "./GroupPeopleForm";
import { makePerson, makeGroup } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const group = makeGroup({
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
    groupIds: ["pub-oreilly"],
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
  title: "Components/GroupPeopleForm",
  component: GroupPeopleForm,
  parameters: {
    msw: {
      handlers: personHandlers,
    },
  },
  args: {
    group,
  },
} satisfies Meta<typeof GroupPeopleForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Editable association list with one person connected. */
export const Default: Story = {};

/** Read-only view of the connected people. */
export const ReadOnlyView: Story = {
  render: () => <GroupPeopleView group={group} />,
};
