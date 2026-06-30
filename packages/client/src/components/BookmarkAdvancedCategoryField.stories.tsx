import type { SourceDefaults } from "./BookmarkAdvancedSection";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkAdvancedCategoryField } from "./BookmarkAdvancedCategoryField";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import { apiHandlers, sampleCategories } from "../test-utils/story-mocks";

function sourceDefaults(overrides: Partial<SourceDefaults> = {}): SourceDefaults {
  return {
    label: null,
    showSourceDefault: false,
    showMediaTypeDefault: false,
    setCategory: false,
    setTags: false,
    setMediaType: false,
    onSetCategory: () => {},
    onSetTags: () => {},
    onSetMediaType: () => {},
    ...overrides,
  };
}

const meta = {
  title: "Bookmarks/Advanced/BookmarkAdvancedCategoryField",
  component: BookmarkAdvancedCategoryField,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkAdvancedCategoryField>;

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
        <BookmarkAdvancedCategoryField
          form={form}
          categories={sampleCategories}
          sourceDefaults={sourceDefaults()}
          addCategoryOpen={false}
          onAddCategoryOpenChange={() => {}}
        />
      )}
    </BookmarkFormHost>
  ),
};

export const Locked: Story = {
  render: () => (
    <BookmarkFormHost
      initialValues={{
        url: "https://example.com",
        categoryId: "cat-workflow",
      }}
    >
      {form => (
        <BookmarkAdvancedCategoryField
          form={form}
          lockedCategoryId="cat-workflow"
          categories={sampleCategories}
          sourceDefaults={sourceDefaults()}
          addCategoryOpen={false}
          onAddCategoryOpenChange={() => {}}
        />
      )}
    </BookmarkFormHost>
  ),
};

export const WithSourceDefaultOffer: Story = {
  render: () => (
    <BookmarkFormHost
      initialValues={{
        url: "https://example.com",
        categoryId: "cat-workflow",
      }}
    >
      {form => (
        <BookmarkAdvancedCategoryField
          form={form}
          categories={sampleCategories}
          sourceDefaults={sourceDefaults({
            label: "example.com",
            showSourceDefault: true,
          })}
          addCategoryOpen={false}
          onAddCategoryOpenChange={() => {}}
        />
      )}
    </BookmarkFormHost>
  ),
};
