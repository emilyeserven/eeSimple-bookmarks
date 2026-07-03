import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { PeopleListing } from "./PersonManager";
import { makePerson } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const samplePeople = [
  makePerson({
    id: "person-1",
    name: "Jane Person",
    slug: "jane-person",
    bookmarkCount: 12,
  }),
  makePerson({
    id: "person-2",
    name: "John Writer",
    slug: "john-writer",
  }),
];

const meta = {
  title: "Components/PeopleListing",
  component: PeopleListing,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/people", () => HttpResponse.json(samplePeople)),
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof PeopleListing>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The person listing populated with a couple of people. */
export const Default: Story = {};

/** No people yet — the empty-state message is shown. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/people", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
};
