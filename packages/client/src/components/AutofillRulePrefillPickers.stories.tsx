import type { MediaTypeNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { NO_CATEGORY, NO_MEDIA_TYPE } from "./AutofillRuleForm";
import { AutofillRulePrefillPickers } from "./AutofillRulePrefillPickers";
import {
  apiHandlers,
  sampleCategories,
  sampleMediaTypes,
  sampleTagTree,
} from "../test-utils/story-mocks";

const mediaTypeTree: MediaTypeNode[] = sampleMediaTypes.map(mediaType => ({
  ...mediaType,
  children: [],
}));

const meta = {
  title: "Components/AutofillRulePrefillPickers",
  component: AutofillRulePrefillPickers,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    categories: sampleCategories,
    mediaTypeTree,
    tagTree: sampleTagTree,
    locationTree: [],
    setCategoryId: NO_CATEGORY,
    onCategoryChange: () => {},
    setMediaTypeId: NO_MEDIA_TYPE,
    onMediaTypeChange: () => {},
    tagIds: [],
    onToggleTag: () => {},
    locationIds: [],
    onToggleLocation: () => {},
  },
} satisfies Meta<typeof AutofillRulePrefillPickers>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Nothing chosen — every picker shows "Leave unchanged". */
export const Default: Story = {};

/** A category, media type, and tag are selected. */
export const WithSelections: Story = {
  args: {
    setCategoryId: "cat-workflow",
    setMediaTypeId: "media-article",
    tagIds: ["tag-cli"],
  },
};
