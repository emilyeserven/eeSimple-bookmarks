import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkCategoryField } from "./BookmarkCategoryField";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import { apiHandlers, sampleCategories } from "../test-utils/story-mocks";

const meta = {
  title: "Bookmarks/BookmarkCategoryField",
  component: BookmarkCategoryField,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkCategoryField>;

export default meta;

type Story = StoryObj;

function CategoryFieldHost({
  selectedId,
}: {
  selectedId?: string;
}) {
  return (
    <BookmarkFormHost
      initialValues={selectedId
        ? {
          categoryId: selectedId,
        }
        : undefined}
    >
      {form => (
        <BookmarkCategoryField
          form={form}
          categories={sampleCategories}
        />
      )}
    </BookmarkFormHost>
  );
}

export const Default: Story = {
  render: () => <CategoryFieldHost />,
};

export const Selected: Story = {
  render: () => <CategoryFieldHost selectedId="cat-workflow" />,
};
