import type { ConditionTree } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { ConditionsField } from "./ConditionsField";
import {
  apiHandlers,
  sampleCategories,
  sampleProperties,
  sampleTagTree,
} from "../../test-utils/story-mocks";

const meta = {
  title: "Components/Conditions/ConditionsField",
  component: ConditionsField,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    value: {
      type: "group",
      combinator: "and",
      children: [],
    },
    categories: sampleCategories,
    properties: sampleProperties,
    tagTree: sampleTagTree,
    onChange: () => {},
  },
  decorators: [Story => (
    <div className="max-w-xl">
      <Story />
    </div>
  )],
} satisfies Meta<typeof ConditionsField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A fresh tree: every section collapsed with the AND/OR toggle on "all". */
export const Empty: Story = {
  render: () => <Controlled initial={emptyTree("and")} />,
};

/** A category leaf is present, so the Category section opens with a selection. */
export const WithCategorySelected: Story = {
  render: () => (
    <Controlled
      initial={{
        type: "group",
        combinator: "or",
        children: [
          {
            type: "category",
            categoryIds: [sampleCategories[0].id],
          },
        ],
      }}
    />
  ),
};

function emptyTree(combinator: "and" | "or"): ConditionTree {
  return {
    type: "group",
    combinator,
    children: [],
  };
}

function Controlled({
  initial,
}: { initial: ConditionTree }) {
  const [value, setValue] = useState<ConditionTree>(initial);
  return (
    <ConditionsField
      value={value}
      onChange={setValue}
      categories={sampleCategories}
      properties={sampleProperties}
      tagTree={sampleTagTree}
    />
  );
}
