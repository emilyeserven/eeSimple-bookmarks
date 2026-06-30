import type { Meta, StoryObj } from "@storybook/react-vite";

import { WebsiteRedirectFailureField } from "./WebsiteRedirectFailureField";

const meta = {
  title: "Components/WebsiteRedirectFailureField",
  component: WebsiteRedirectFailureField,
  args: {
    checked: false,
    onCheckedChange: () => {},
  },
} satisfies Meta<typeof WebsiteRedirectFailureField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The redirect-resolution-failure flag, unchecked. */
export const Default: Story = {};

/** The flag enabled. */
export const Checked: Story = {
  args: {
    checked: true,
  },
};
