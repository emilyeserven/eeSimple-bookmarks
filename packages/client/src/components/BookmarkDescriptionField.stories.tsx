import type { Bookmark } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkDescriptionField } from "./BookmarkDescriptionField";
import { useBookmarkGeneralForm } from "./useBookmarkGeneralForm";
import { makeBookmark } from "../test-utils/factories";
import { apiHandlers, sampleBookmark } from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/BookmarkDescriptionField",
  component: BookmarkDescriptionField,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkDescriptionField>;

export default meta;

type Story = StoryObj;

function DescriptionFieldHost({
  bookmark = sampleBookmark,
}: {
  bookmark?: Bookmark;
}) {
  const ctrl = useBookmarkGeneralForm(bookmark);
  return (
    <BookmarkDescriptionField
      form={ctrl.form}
      fetchMetadata={ctrl.fetchMetadata}
      runFetchDescription={ctrl.runFetchDescription}
    />
  );
}

export const Default: Story = {
  render: () => <DescriptionFieldHost />,
};

export const EmptyDescription: Story = {
  render: () => (
    <DescriptionFieldHost
      bookmark={makeBookmark({
        url: "https://example.com",
        description: null,
      })}
    />
  ),
};
