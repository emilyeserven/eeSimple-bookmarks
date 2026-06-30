import type { Bookmark } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkGeneralUrlSection } from "./BookmarkGeneralUrlSection";
import { useBookmarkGeneralForm } from "./useBookmarkGeneralForm";
import { sampleBookmark, apiHandlers } from "../test-utils/story-mocks";

/**
 * `BookmarkGeneralUrlSection` is driven entirely by the `useBookmarkGeneralForm` controller, so the
 * story mounts a real controller for a sample bookmark and hands it in — mirroring how
 * `BookmarkGeneralForm` wires the section.
 */
function UrlSectionHost({
  bookmark,
}: { bookmark: Bookmark }) {
  const ctrl = useBookmarkGeneralForm(bookmark);
  return (
    <div className="max-w-xl space-y-4">
      <BookmarkGeneralUrlSection
        ctrl={ctrl}
        bookmark={bookmark}
      />
    </div>
  );
}

const meta = {
  title: "Bookmarks/BookmarkGeneralUrlSection",
  component: BookmarkGeneralUrlSection,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkGeneralUrlSection>;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => <UrlSectionHost bookmark={sampleBookmark} />,
};

export const PlainUrl: Story = {
  render: () => (
    <UrlSectionHost
      bookmark={{
        ...sampleBookmark,
        id: "bm-plain-url",
        url: "https://example.com/some/article",
        website: null,
      }}
    />
  ),
};
