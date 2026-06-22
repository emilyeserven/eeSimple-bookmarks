import type { Meta, StoryObj } from "@storybook/react-vite";

import { AddChildButton } from "./AddChildButton";

const meta = {
  title: "Components/AddChildButton",
  component: AddChildButton,
  args: {
    kind: "tag",
    parentId: "parent-1",
  },
} satisfies Meta<typeof AddChildButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A hierarchy-tag detail page: the button quick-creates a sub-tag of the current tag. */
export const Tag: Story = {};

/** A media-type detail page: the button quick-creates a sub-type. */
export const MediaType: Story = {
  args: {
    kind: "mediaType",
  },
};

/** Disabled until the parent id resolves (e.g. while the detail page is still loading). */
export const DisabledWhileLoading: Story = {
  args: {
    parentId: undefined,
  },
};
