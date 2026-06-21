import type { Meta, StoryObj } from "@storybook/react-vite";

import { RevealedCustomFields } from "./RevealedCustomFields";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import { makeRevealedProps } from "../test-utils/revealedFixtures";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/Revealed/RevealedCustomFields",
  component: RevealedCustomFields,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof RevealedCustomFields>;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <BookmarkFormHost
      initialValues={{
        categoryId: "cat-content",
      }}
    >
      {form => (
        <RevealedCustomFields
          form={form}
          {...makeRevealedProps()}
        />
      )}
    </BookmarkFormHost>
  ),
};
