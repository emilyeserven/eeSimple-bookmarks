import type { Meta, StoryObj } from "@storybook/react-vite";

import { PropertyTypeIconsCard } from "./PropertyTypeIconsCard";

const meta = {
  title: "Settings/PropertyTypeIconsCard",
  component: PropertyTypeIconsCard,
  args: {
    customPropertyTypeIcons: null,
    onSetIcon: () => {},
    onReset: () => {},
  },
} satisfies Meta<typeof PropertyTypeIconsCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Each custom-property type uses its default icon. */
export const Default: Story = {};

/** A couple of types have user-chosen icon overrides. */
export const WithOverrides: Story = {
  args: {
    customPropertyTypeIcons: {
      number: "Hash",
      boolean: "ToggleLeft",
    },
  },
};
