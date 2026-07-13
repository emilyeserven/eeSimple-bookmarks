import type { Meta, StoryObj } from "@storybook/react-vite";

import { AddChildModal } from "./AddChildModal";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/AddChildModal",
  component: AddChildModal,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    kind: "tag",
    parentId: "tag-dev",
    open: true,
    onOpenChange: () => {},
  },
} satisfies Meta<typeof AddChildModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Quick-create a sub-tag under the current tag (parent fixed). */
export const Tag: Story = {};

/** Quick-create a sub-type under the current media type. */
export const MediaType: Story = {
  args: {
    kind: "mediaType",
    parentId: "media-video",
  },
};

/** Quick-create a sub-term under the current user-created taxonomy term. */
export const TaxonomyTerm: Story = {
  args: {
    kind: "taxonomyTerm",
    parentId: "term-listening",
    taxonomyId: "taxonomy-japanese",
    taxonomySlug: "japanese",
  },
};
