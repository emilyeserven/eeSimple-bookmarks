import type { Meta, StoryObj } from "@storybook/react-vite";

import { PersonListItem } from "./PersonListItem";
import { makePerson } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const person = makePerson({
  id: "person-1",
  name: "Jane Person",
  slug: "jane-person",
  bookmarkCount: 12,
});

const meta = {
  title: "Components/PersonListItem",
  component: PersonListItem,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    person,
  },
} satisfies Meta<typeof PersonListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A single person row with a name, bookmark count, and hover Edit / Info buttons. */
export const Default: Story = {};

/** An person with no bookmarks yet (zero-count, de-emphasized). */
export const NoBookmarks: Story = {
  args: {
    person: {
      ...person,
      name: "Unused Person",
      slug: "unused-person",
      bookmarkCount: 0,
    },
  },
};
