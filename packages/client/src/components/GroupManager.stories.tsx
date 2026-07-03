import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { GroupsListing } from "./GroupManager";
import { makeGroup } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const sampleGroups = [
  makeGroup({
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
  makeGroup({
    id: "pub-manning",
    name: "Manning Publications",
    slug: "manning",
    bookmarkCount: 4,
  }),
];

const meta = {
  title: "Settings/GroupManager",
  component: GroupsListing,
  parameters: {
    msw: {
      handlers: [
        ...apiHandlers,
        http.get("/api/groups", () => HttpResponse.json(sampleGroups)),
      ],
    },
  },
} satisfies Meta<typeof GroupsListing>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A populated, searchable group listing. */
export const Default: Story = {};

/** No groups yet — shows the empty-state message. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        ...apiHandlers,
        http.get("/api/groups", () => HttpResponse.json([])),
      ],
    },
  },
};
