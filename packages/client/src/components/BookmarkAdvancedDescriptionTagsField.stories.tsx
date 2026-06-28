import type { SourceDefaults } from "./BookmarkAdvancedSection";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkAdvancedDescriptionTagsField } from "./BookmarkAdvancedDescriptionTagsField";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import { apiHandlers, sampleTagTree } from "../test-utils/story-mocks";

function sourceDefaults(overrides: Partial<SourceDefaults> = {}): SourceDefaults {
  return {
    label: null,
    showSourceDefault: false,
    showMediaTypeDefault: false,
    setCategory: false,
    setTags: false,
    setMediaType: false,
    onSetCategory: () => undefined,
    onSetTags: () => undefined,
    onSetMediaType: () => undefined,
    ...overrides,
  };
}

const meta = {
  title: "Bookmarks/Advanced/BookmarkAdvancedDescriptionTagsField",
  component: BookmarkAdvancedDescriptionTagsField,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkAdvancedDescriptionTagsField>;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <BookmarkFormHost
      initialValues={{
        url: "https://example.com",
        description: "A short blurb about this page.",
      }}
    >
      {form => (
        <BookmarkAdvancedDescriptionTagsField
          form={form}
          tagTree={sampleTagTree}
          onTagToggle={() => undefined}
          sourceDefaults={sourceDefaults()}
          onFetchDescription={() => undefined}
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
      }}
    >
      {form => (
        <BookmarkAdvancedDescriptionTagsField
          form={form}
          tagTree={sampleTagTree}
          onTagToggle={() => undefined}
          sourceDefaults={sourceDefaults({
            label: "example.com",
            showSourceDefault: true,
          })}
          onFetchDescription={() => undefined}
        />
      )}
    </BookmarkFormHost>
  ),
};

export const WithoutFetchButton: Story = {
  render: () => (
    <BookmarkFormHost
      initialValues={{
        url: "https://example.com",
      }}
    >
      {form => (
        <BookmarkAdvancedDescriptionTagsField
          form={form}
          tagTree={sampleTagTree}
          onTagToggle={() => undefined}
          sourceDefaults={sourceDefaults()}
        />
      )}
    </BookmarkFormHost>
  ),
};
