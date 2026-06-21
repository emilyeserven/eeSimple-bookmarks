import type { Meta, StoryObj } from "@storybook/react-vite";

import { RevealedNameField } from "./RevealedNameField";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import { makeRevealedProps } from "../test-utils/revealedFixtures";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/Revealed/RevealedNameField",
  component: RevealedNameField,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof RevealedNameField>;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <BookmarkFormHost
      initialValues={{
        url: "https://example.com",
        title: "Example",
      }}
    >
      {form => (
        <RevealedNameField
          form={form}
          {...makeRevealedProps()}
        />
      )}
    </BookmarkFormHost>
  ),
};

export const AfterTitleFetch: Story = {
  render: () => (
    <BookmarkFormHost
      initialValues={{
        url: "https://example.com",
        title: "Fetched title",
      }}
    >
      {form => (
        <RevealedNameField
          form={form}
          {...makeRevealedProps({
            titleFetch: {
              previous: "Old title",
            },
            fetchTitleIsSuccess: true,
            fetchedTitle: "Fetched title",
          })}
        />
      )}
    </BookmarkFormHost>
  ),
};
