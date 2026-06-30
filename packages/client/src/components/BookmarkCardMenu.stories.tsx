import type { BookmarkTag, CustomProperty } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkCardMenu } from "./BookmarkCardMenu";
import { makeCustomProperty } from "../test-utils/factories";
import { apiHandlers, sampleBookmark } from "../test-utils/story-mocks";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const noop = () => {};

const editableTags: BookmarkTag[] = [
  {
    id: "tag-cli",
    name: "cli",
    slug: "cli",
    parentId: "tag-tools",
    editableOnCard: true,
  },
  {
    id: "tag-tools",
    name: "tools",
    slug: "tools",
    parentId: "tag-dev",
    editableOnCard: true,
  },
];

const editableProperties: CustomProperty[] = [
  makeCustomProperty({
    id: "prop-reviewed",
    name: "Reviewed",
    slug: "reviewed",
    type: "boolean",
    editableOnCard: true,
  }),
  makeCustomProperty({
    id: "prop-rating",
    name: "Rating",
    slug: "rating",
    type: "ratingScale",
    ratingMax: 5,
    editableOnCard: true,
  }),
];

const meta = {
  title: "Bookmarks/BookmarkCardMenu",
  component: BookmarkCardMenu,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    bookmark: sampleBookmark,
    editableProperties: [],
    editableTags: [],
    autoImagePending: false,
    onAutoImage: noop,
    screenshotPending: false,
    onScreenshot: noop,
    onSaveNumber: noop,
    onSaveBoolean: noop,
    onSaveDateTime: noop,
    onSaveChoices: noop,
    onSaveTags: noop,
    onChangeChoicesDisplay: noop,
  },
  render: args => (
    <DropdownMenu open>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="More options"
        >
          ⋮
        </Button>
      </DropdownMenuTrigger>
      <BookmarkCardMenu {...args} />
    </DropdownMenu>
  ),
} satisfies Meta<typeof BookmarkCardMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithQuickEdit: Story = {
  args: {
    editableTags,
    editableProperties,
  },
};

export const WithDelete: Story = {
  args: {
    onDelete: noop,
  },
};

export const ImageGrabError: Story = {
  args: {
    bookmark: {
      ...sampleBookmark,
      imageAutoGrabError: "no_image",
    },
  },
};
