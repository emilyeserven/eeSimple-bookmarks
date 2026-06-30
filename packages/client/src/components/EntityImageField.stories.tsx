import type { Meta, StoryObj } from "@storybook/react-vite";

import { Globe } from "lucide-react";

import { EntityImageField, EntityImagePreview } from "./EntityImageField";

const meta = {
  title: "Components/EntityImageField",
  component: EntityImageField,
  args: {
    label: "Favicon",
    imageUrl: "https://placehold.co/64",
    fallback: <Globe className="size-6" />,
    onUpload: () => {},
    onRemove: () => {},
  },
} satisfies Meta<typeof EntityImageField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A website favicon with upload, fetch, and remove controls. */
export const Default: Story = {
  args: {
    onAuto: () => {},
    autoLabel: "Fetch favicon",
  },
};

/** No stored image: the fallback icon shows and the Remove button is hidden. */
export const NoImage: Story = {
  args: {
    imageUrl: null,
    onAuto: () => {},
  },
};

/** A YouTube channel avatar (circular). */
export const CircleAvatar: Story = {
  args: {
    label: "Avatar",
    shape: "circle",
    onAuto: () => {},
    autoLabel: "Fetch avatar",
  },
};

/** A previous auto-grab failed: the Fetch button is disabled with a reason. */
export const AutoError: Story = {
  args: {
    imageUrl: null,
    onAuto: () => {},
    autoError: "no_image",
  },
};

/** The read-only preview variant used on an entity's view page. */
export const Preview: StoryObj<typeof EntityImagePreview> = {
  render: args => <EntityImagePreview {...args} />,
  args: {
    imageUrl: "https://placehold.co/48",
    fallback: <Globe className="size-5" />,
  },
};
