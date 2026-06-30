import type { Bookmark } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkGeneralRelationsSection } from "./BookmarkGeneralRelationsSection";
import { useBookmarkGeneralForm } from "./useBookmarkGeneralForm";
import { makeBookmark } from "../test-utils/factories";
import { apiHandlers, sampleBookmark } from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/BookmarkGeneralRelationsSection",
  component: BookmarkGeneralRelationsSection,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkGeneralRelationsSection>;

export default meta;

type Story = StoryObj;

function RelationsHost({
  bookmark = sampleBookmark,
}: {
  bookmark?: Bookmark;
}) {
  const ctrl = useBookmarkGeneralForm(bookmark);
  return (
    <div className="max-w-md space-y-4">
      <BookmarkGeneralRelationsSection ctrl={ctrl} />
    </div>
  );
}

export const Default: Story = {
  render: () => <RelationsHost />,
};

export const Empty: Story = {
  render: () => (
    <RelationsHost
      bookmark={makeBookmark({
        url: "https://example.com",
        categoryId: "cat-workflow",
      })}
    />
  ),
};
