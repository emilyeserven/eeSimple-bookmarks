import type { SourceDefaults } from "./BookmarkAdvancedSection";
import type { MediaTypeNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkAdvancedMediaTypeField } from "./BookmarkAdvancedMediaTypeField";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import { apiHandlers, sampleMediaTypes } from "../test-utils/story-mocks";

const mediaTypeNodes: MediaTypeNode[] = sampleMediaTypes.map(mediaType => ({
  ...mediaType,
  children: [],
}));

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
  title: "Bookmarks/Advanced/BookmarkAdvancedMediaTypeField",
  component: BookmarkAdvancedMediaTypeField,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkAdvancedMediaTypeField>;

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
        <BookmarkAdvancedMediaTypeField
          form={form}
          mediaTypes={mediaTypeNodes}
          sourceDefaults={sourceDefaults()}
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
        mediaTypeId: "media-video",
      }}
    >
      {form => (
        <BookmarkAdvancedMediaTypeField
          form={form}
          mediaTypes={mediaTypeNodes}
          sourceDefaults={sourceDefaults({
            label: "example.com",
            showMediaTypeDefault: true,
          })}
        />
      )}
    </BookmarkFormHost>
  ),
};
