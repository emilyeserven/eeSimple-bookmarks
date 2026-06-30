import type { Publisher } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkAdvancedPublisherField } from "./BookmarkAdvancedPublisherField";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const samplePublishers: Publisher[] = [
  {
    id: "pub-oreilly",
    name: "O'Reilly Media",
    slug: "oreilly-media",
    websiteId: null,
    createdAt: NOW,
    socialLinks: [],
  },
  {
    id: "pub-penguin",
    name: "Penguin Random House",
    slug: "penguin-random-house",
    websiteId: null,
    createdAt: NOW,
    socialLinks: [],
  },
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
          addPublisherOpen={false}
          onAddPublisherOpenChange={() => {}}
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
          addPublisherOpen={false}
          onAddPublisherOpenChange={() => {}}
        />
      )}
    </BookmarkFormHost>
  ),
};
