import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkAdvancedGroupField } from "./BookmarkAdvancedGroupField";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import { makeGroup } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const sampleGroups = [
  makeGroup({
    id: "pub-oreilly",
    name: "O'Reilly Media",
    slug: "oreilly-media",
  }),
  makeGroup({
    id: "pub-penguin",
    name: "Penguin Random House",
    slug: "penguin-random-house",
  }),
];

const meta = {
  title: "Bookmarks/Advanced/BookmarkAdvancedGroupField",
  component: BookmarkAdvancedGroupField,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkAdvancedGroupField>;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <BookmarkFormHost
      initialValues={{
        url: "https://example.com",
      }}
    >
      {form => (
        <BookmarkAdvancedGroupField
          form={form}
          groups={sampleGroups}
        />
      )}
    </BookmarkFormHost>
  ),
};

export const NoGroups: Story = {
  render: () => (
    <BookmarkFormHost
      initialValues={{
        url: "https://example.com",
      }}
    >
      {form => (
        <BookmarkAdvancedGroupField
          form={form}
          groups={[]}
        />
      )}
    </BookmarkFormHost>
  ),
};
