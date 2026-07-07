import type { RelationshipType } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { RelationshipTypeDetail } from "./RelationshipTypeDetail";

const baseType: RelationshipType = {
  id: "rt-1",
  name: "Parent / Child",
  slug: "parent-child",
  description: null,
  directional: true,
  builtIn: true,
  sortOrder: 0,
  createdAt: "2024-01-15T00:00:00.000Z",
  bookmarkCount: 42,
  relationshipCount: 38,
};

const meta = {
  title: "Components/RelationshipTypeDetail",
  component: RelationshipTypeDetail,
  args: {
    relationshipType: baseType,
  },
} satisfies Meta<typeof RelationshipTypeDetail>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A built-in, directional type with counts populated. */
export const BuiltInDirectional: Story = {};

/** A custom symmetric type with no relationships yet. */
export const CustomSymmetric: Story = {
  args: {
    relationshipType: {
      ...baseType,
      id: "rt-2",
      name: "Sequel of",
      slug: "sequel-of",
      directional: false,
      builtIn: false,
      sortOrder: 10,
      bookmarkCount: 0,
      relationshipCount: 0,
    },
  },
};
