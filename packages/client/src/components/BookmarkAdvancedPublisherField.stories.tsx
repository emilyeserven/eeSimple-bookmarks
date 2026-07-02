import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkAdvancedPublisherField } from "./BookmarkAdvancedPublisherField";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import { makePublisher } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const samplePublishers = [
  makePublisher({
    id: "pub-oreilly",
    name: "O'Reilly Media",
    slug: "oreilly-media",
  }),
  makePublisher({
    id: "pub-penguin",
    name: "Penguin Random House",
    slug: "penguin-random-house",
  }),
];

const meta = {
  title: "Bookmarks/Advanced/BookmarkAdvancedPublisherField",
  component: BookmarkAdvancedPublisherField,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkAdvancedPublisherField>;

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
        <BookmarkAdvancedPublisherField
          form={form}
          publishers={samplePublishers}
        />
      )}
    </BookmarkFormHost>
  ),
};

export const NoPublishers: Story = {
  render: () => (
    <BookmarkFormHost
      initialValues={{
        url: "https://example.com",
      }}
    >
      {form => (
        <BookmarkAdvancedPublisherField
          form={form}
          publishers={[]}
        />
      )}
    </BookmarkFormHost>
  ),
};
