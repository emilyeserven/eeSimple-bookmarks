import type { MediaTypeNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkRevealedFields } from "./BookmarkRevealedFields";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import { makeRevealedProps } from "../test-utils/revealedFixtures";
import { apiHandlers, sampleMediaTypes, sampleTagTree } from "../test-utils/story-mocks";

const mediaTypes: MediaTypeNode[] = sampleMediaTypes.map(type => ({
  ...type,
  children: [],
}));

const sourceDefaults = {
  label: null,
  showSourceDefault: false,
  showMediaTypeDefault: false,
  setCategory: false,
  setTags: false,
  setMediaType: false,
  onSetCategory: () => {},
  onSetTags: () => {},
  onSetMediaType: () => {},
};

/** The props `BookmarkRevealedFields` needs beyond the shared `makeRevealedProps()` bag. */
const extraProps = {
  ...makeRevealedProps(),
  urlCleanup: null,
  urlShortener: {
    nudge: false,
    expandedUrl: null,
  },
  onUndoUrlCleanup: () => {},
  sourceDefaults,
  onApplyCategoryDefaults: () => {},
  tagTree: sampleTagTree,
  mediaTypes,
  onTagToggle: () => {},
  addCategoryOpen: false,
  onAddCategoryOpenChange: () => {},
  addMediaTypeOpen: false,
  onAddMediaTypeOpenChange: () => {},
  addPublisherOpen: false,
  onAddPublisherOpenChange: () => {},
  imageFieldKey: 0,
  existingImages: [],
  imageCandidates: [],
  defaultAuto: false,
  autoGrabError: null,
  onImageIntentChange: () => {},
  onFetchDescription: () => {},
};

const meta = {
  title: "Bookmarks/BookmarkRevealedFields",
  component: BookmarkRevealedFields,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkRevealedFields>;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <BookmarkFormHost
      initialValues={{
        url: "https://example.com/article",
        title: "An example article",
      }}
    >
      {form => (
        <div className="max-w-2xl">
          <BookmarkRevealedFields
            form={form}
            {...extraProps}
          />
        </div>
      )}
    </BookmarkFormHost>
  ),
};

export const HideNameField: Story = {
  render: () => (
    <BookmarkFormHost
      initialValues={{
        url: "https://example.com/note",
      }}
    >
      {form => (
        <div className="max-w-2xl">
          <BookmarkRevealedFields
            form={form}
            {...extraProps}
            hideNameField
          />
        </div>
      )}
    </BookmarkFormHost>
  ),
};
