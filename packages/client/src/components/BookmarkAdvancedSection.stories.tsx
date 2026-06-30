import type { BookmarkCustomFieldControls, SourceDefaults } from "./BookmarkAdvancedSection";
import type { MediaTypeNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkAdvancedSection } from "./BookmarkAdvancedSection";
import { BookmarkFormHost } from "../test-utils/bookmarkFormHost";
import {
  apiHandlers,
  sampleCategories,
  sampleMediaTypes,
  sampleProperties,
  sampleTagTree,
} from "../test-utils/story-mocks";

const mediaTypeNodes: MediaTypeNode[] = sampleMediaTypes.map(mediaType => ({
  ...mediaType,
  children: [],
}));

const sourceDefaults: SourceDefaults = {
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

const customFields: BookmarkCustomFieldControls = {
  numberInputs: {},
  booleanInputs: {},
  dateTimeInputs: {},
  choicesInputs: {},
  progressInputs: {},
  sectionsInputs: {},
  textInputs: {},
  onNumberChange: () => {},
  onBooleanChange: () => {},
  onDateTimeChange: () => {},
  onChoicesChange: () => {},
  onProgressChange: () => {},
  onSectionsChange: () => {},
  onTextChange: () => {},
  onApplyCategoryDefaults: () => {},
};

const meta = {
  title: "Bookmarks/BookmarkAdvancedSection",
  component: BookmarkAdvancedSection,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkAdvancedSection>;

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
        <BookmarkAdvancedSection
          form={form}
          categories={sampleCategories}
          customProperties={sampleProperties}
          mediaTypes={mediaTypeNodes}
          sourceDefaults={sourceDefaults}
          addCategoryOpen={false}
          onAddCategoryOpenChange={() => {}}
          addMediaTypeOpen={false}
          onAddMediaTypeOpenChange={() => {}}
          addPublisherOpen={false}
          onAddPublisherOpenChange={() => {}}
          imageFieldKey={0}
          existingImages={[]}
          imageCandidates={[]}
          defaultAuto={false}
          autoGrabError={null}
          onImageIntentChange={() => {}}
          tagTree={sampleTagTree}
          onTagToggle={() => {}}
          customFields={customFields}
        />
      )}
    </BookmarkFormHost>
  ),
};

export const WithCategorySelected: Story = {
  render: () => (
    <BookmarkFormHost
      initialValues={{
        url: "https://example.com",
        categoryId: "cat-workflow",
      }}
    >
      {form => (
        <BookmarkAdvancedSection
          form={form}
          categories={sampleCategories}
          customProperties={sampleProperties}
          mediaTypes={mediaTypeNodes}
          sourceDefaults={sourceDefaults}
          addCategoryOpen={false}
          onAddCategoryOpenChange={() => {}}
          addMediaTypeOpen={false}
          onAddMediaTypeOpenChange={() => {}}
          addPublisherOpen={false}
          onAddPublisherOpenChange={() => {}}
          imageFieldKey={0}
          existingImages={[]}
          imageCandidates={[]}
          defaultAuto={false}
          autoGrabError={null}
          onImageIntentChange={() => {}}
          tagTree={sampleTagTree}
          onTagToggle={() => {}}
          customFields={customFields}
        />
      )}
    </BookmarkFormHost>
  ),
};
