import type { Meta, StoryObj } from "@storybook/react-vite";

import { AddRelationshipTypeRow } from "./AddRelationshipTypeRow";

const meta = {
  title: "Components/AddRelationshipTypeRow",
  component: AddRelationshipTypeRow,
} satisfies Meta<typeof AddRelationshipTypeRow>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The inline "add a relationship type" row with a name input, a Directional toggle, and Add. */
export const Default: Story = {};
