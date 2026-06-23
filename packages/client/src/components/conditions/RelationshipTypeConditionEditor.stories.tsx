import type { RelationshipType, RelationshipTypeCondition } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { HttpResponse, http } from "msw";

import { RelationshipTypeConditionEditor } from "./RelationshipTypeConditionEditor";

const NOW = "2026-06-01T00:00:00.000Z";

function relType(id: string, name: string, slug: string, sortOrder: number): RelationshipType {
  return {
    id,
    name,
    slug,
    directional: false,
    builtIn: false,
    sortOrder,
    createdAt: NOW,
  };
}

const relationshipTypes: RelationshipType[] = [
  relType("rel-related", "Related", "related", 0),
  relType("rel-follow-up", "Follow-up", "follow-up", 1),
  relType("rel-cited-by", "Cited by", "cited-by", 2),
];

const meta = {
  title: "Components/Conditions/RelationshipTypeConditionEditor",
  component: RelationshipTypeConditionEditor,
  parameters: {
    msw: {
      handlers: [http.get("/api/relationship-types", () => HttpResponse.json(relationshipTypes))],
    },
  },
  args: {
    value: {
      type: "relationship-type",
      relationshipTypeIds: [],
    },
    onChange: () => {},
  },
} satisfies Meta<typeof RelationshipTypeConditionEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: () => <Controlled initial={[]} />,
};

export const WithSelection: Story = {
  render: () => <Controlled initial={["rel-related"]} />,
};

function Controlled({
  initial,
}: { initial: string[] }) {
  const [value, setValue] = useState<RelationshipTypeCondition>({
    type: "relationship-type",
    relationshipTypeIds: initial,
  });
  return (
    <div className="w-80">
      <RelationshipTypeConditionEditor
        value={value}
        onChange={setValue}
      />
    </div>
  );
}
