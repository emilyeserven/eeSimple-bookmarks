import type { RelationshipType } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { RelationshipTypeGeneralForm } from "./RelationshipTypeGeneralForm";

const baseType: RelationshipType = {
  id: "rt-sequel",
  name: "Sequel of",
  slug: "sequel-of",
  description: null,
  directional: true,
  builtIn: false,
  sortOrder: 5,
  createdAt: "2026-06-01T00:00:00.000Z",
  bookmarkCount: 3,
  relationshipCount: 3,
};

const meta = {
  title: "Components/RelationshipTypeGeneralForm",
  component: RelationshipTypeGeneralForm,
  args: {
    relationshipType: baseType,
  },
} satisfies Meta<typeof RelationshipTypeGeneralForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A custom type — name and direction both auto-save. */
export const Default: Story = {};

/** A built-in type — the name field is locked. */
export const BuiltIn: Story = {
  args: {
    relationshipType: {
      ...baseType,
      id: "rt-parent-child",
      name: "Parent / Child",
      slug: "parent-child",
      builtIn: true,
    },
  },
};
