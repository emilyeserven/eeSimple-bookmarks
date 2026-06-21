import type { Meta, StoryObj } from "@storybook/react-vite";

import { RevealedUrlCleanupSection } from "./RevealedUrlCleanupSection";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import { makeRevealedProps } from "../test-utils/revealedFixtures";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/Revealed/RevealedUrlCleanupSection",
  component: RevealedUrlCleanupSection,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof RevealedUrlCleanupSection>;

export default meta;

type Story = StoryObj;

export const Visible: Story = {
  render: () => (
    <BookmarkFormHost
      initialValues={{
        url: "https://example.com/?utm_source=newsletter&id=42",
      }}
    >
      {form => (
        <RevealedUrlCleanupSection
          form={form}
          {...makeRevealedProps({
            showUrlCleanup: true,
            urlCleanupMode: "trackers",
          })}
        />
      )}
    </BookmarkFormHost>
  ),
};
